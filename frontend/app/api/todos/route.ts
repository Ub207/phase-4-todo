import { NextRequest, NextResponse } from 'next/server';
import { getTodos, addTodo } from '@/lib/todoStore';

export async function GET() {
  return NextResponse.json({ todos: getTodos() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const task = body.task;

  if (!task) {
    return NextResponse.json({ error: 'Task is required' }, { status: 400 });
  }

  const todos = addTodo(task);
  return NextResponse.json({
    message: `Task '${task}' added successfully!`,
    todos,
  });
}
