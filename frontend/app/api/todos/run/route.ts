import { NextRequest, NextResponse } from 'next/server';
import { getTodos, addTodo, deleteTodo } from '@/lib/todoStore';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are a friendly AI Todo assistant. You help users manage tasks and also chat naturally.

Current todo list:
{TODOS}

Instructions:
- For greetings (hi, hello, hey), respond with a warm greeting and briefly offer help with tasks.
- When the user wants to ADD a task, confirm it. Put the exact task description inside [ADD_TASK:description here].
- When the user wants to LIST tasks, show the current todo list formatted nicely.
- When the user wants to COMPLETE or DELETE a task, confirm it. Put the 0-based index inside [DELETE_TASK:index].
- For general chat, respond naturally and helpfully.
- Keep responses concise (2-3 sentences max).
- Never expose the bracketed tags to the user in your visible text — they are parsed programmatically.`;

async function callOpenAI(task: string, todos: string[]): Promise<string> {
  const todoList =
    todos.length > 0
      ? todos.map((t, i) => `${i + 1}. ${t}`).join('\n')
      : '(empty - no tasks yet)';

  const systemPrompt = SYSTEM_PROMPT.replace('{TODOS}', todoList);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: task },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Smart local fallback when no API key is available
function smartFallback(task: string, todos: string[]): { result: string; todosChanged: boolean } {
  const lower = task.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|howdy|greetings|yo|sup|good\s*(morning|evening|afternoon))[\s!.?]*$/i.test(lower)) {
    return {
      result: `Hello! I'm your AI Todo assistant. Here's what I can do:\n\n• "Add task buy groceries" — to add a task\n• "List my tasks" — to see all tasks\n• "Complete task 1" — to mark a task done\n\nHow can I help you today?`,
      todosChanged: false,
    };
  }

  // Help
  if (/^(help|what can you do|commands|how does this work)[\s!.?]*$/i.test(lower)) {
    return {
      result: `I can help you manage your tasks! Try:\n\n• "Add task [description]" — add a new task\n• "List tasks" or "Show my tasks" — view all tasks\n• "Complete task [number]" — mark a task as done\n• Or just chat with me naturally!`,
      todosChanged: false,
    };
  }

  // List tasks
  if (/\b(list|show|display|view|see|what are|what's on)\b.*\b(tasks?|todos?|list|plate)\b/i.test(lower) || /^(list\s*tasks?|tasks|todos|my tasks|show all)[\s!.?]*$/i.test(lower)) {
    if (todos.length === 0) {
      return { result: 'Your todo list is empty! Try "Add task buy groceries" to get started.', todosChanged: false };
    }
    const taskList = todos.map((t, i) => `${i + 1}. ${t}`).join('\n');
    return { result: `Here are your tasks:\n\n${taskList}`, todosChanged: false };
  }

  // Add task
  const addMatch = task.match(/^(?:add|create|new|remember|remind)\s+(?:a\s+)?(?:task|todo|reminder)?\s*(?:to\s+)?(.+)/i);
  if (addMatch) {
    const taskDesc = addMatch[1].replace(/^["']|["']$/g, '').trim();
    addTodo(taskDesc);
    return { result: `Got it! I've added "${taskDesc}" to your todo list.`, todosChanged: true };
  }

  // Complete/delete task
  const completeMatch = lower.match(/(?:complete|done|finish|delete|remove|mark)\s+(?:task\s*)?#?(\d+)/i);
  if (completeMatch) {
    const index = parseInt(completeMatch[1]) - 1; // User says 1-based, we use 0-based
    const { deleted } = deleteTodo(index);
    if (deleted) {
      return { result: `Done! Task "${deleted}" has been completed and removed.`, todosChanged: true };
    }
    return {
      result: `Couldn't find task #${index + 1}. Use "list tasks" to see your current tasks.`,
      todosChanged: false,
    };
  }

  // Thank you / acknowledgment
  if (/^(thanks|thank you|thx|ty|great|awesome|cool|nice|perfect|ok|okay)[\s!.?]*$/i.test(lower)) {
    return { result: `You're welcome! Let me know if you need anything else.`, todosChanged: false };
  }

  // Default: don't blindly add as task — ask for clarification
  return {
    result: `I'm not sure what you'd like me to do with "${task}". You can:\n\n• "Add task ${task}" — to save it as a task\n• "List tasks" — to see your todos\n• Or just say "hi" to chat!`,
    todosChanged: false,
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const task = body.task;

  if (!task) {
    return NextResponse.json({ error: 'Task is required' }, { status: 400 });
  }

  const todos = getTodos();

  // Try OpenAI if API key is configured
  if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key-here') {
    try {
      let aiResponse = await callOpenAI(task, todos);
      let todosChanged = false;

      // Process action tags from AI response
      const addTaskMatch = aiResponse.match(/\[ADD_TASK:(.+?)\]/);
      if (addTaskMatch) {
        addTodo(addTaskMatch[1].trim());
        aiResponse = aiResponse.replace(/\[ADD_TASK:.+?\]/g, '').trim();
        todosChanged = true;
      }

      const deleteMatch = aiResponse.match(/\[DELETE_TASK:(\d+)\]/);
      if (deleteMatch) {
        deleteTodo(parseInt(deleteMatch[1]));
        aiResponse = aiResponse.replace(/\[DELETE_TASK:\d+\]/g, '').trim();
        todosChanged = true;
      }

      return NextResponse.json({ task, result: aiResponse, todosChanged });
    } catch (error: any) {
      console.error('OpenAI API error, using fallback:', error.message);
      // Fall through to smart fallback
    }
  }

  // Smart fallback (no API key or OpenAI error)
  const { result, todosChanged } = smartFallback(task, todos);
  return NextResponse.json({ task, result, todosChanged });
}
