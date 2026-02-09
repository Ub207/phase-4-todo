'use client';

import { useState, useRef, useEffect } from 'react';
import { todoApi } from '@/lib/api';

interface Message {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await todoApi.runTask(input);
      const aiMessage: Message = {
        type: 'ai',
        content: response.result || 'Task processed successfully!',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Notify TodoList to refresh if tasks were modified
      if (response.todosChanged) {
        window.dispatchEvent(new CustomEvent('todosUpdated'));
      }
    } catch (err: any) {
      try {
        const addResponse = await todoApi.addTodo(input);
        const aiMessage: Message = {
          type: 'ai',
          content: addResponse.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        window.dispatchEvent(new CustomEvent('todosUpdated'));
      } catch (addErr) {
        const errorMessage: Message = {
          type: 'ai',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
          <span className="text-white text-lg">💬</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">AI Assistant</h2>
          <p className="text-xs text-gray-400">Ask me to manage your tasks</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3 chat-scroll">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl mb-4 opacity-30">💡</div>
              <p className="text-gray-400 text-sm font-medium">Start chatting!</p>
              <div className="mt-3 space-y-1.5">
                <p className="text-xs text-gray-300 bg-gray-50 rounded-lg px-3 py-1.5 inline-block">
                  "Add a task to buy groceries"
                </p>
                <br />
                <p className="text-xs text-gray-300 bg-gray-50 rounded-lg px-3 py-1.5 inline-block">
                  "Remind me to call mom"
                </p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.type === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${msg.type === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 text-sm placeholder-gray-400"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-5 py-2.5 rounded-xl hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-md hover:shadow-lg disabled:shadow-none"
        >
          Send
        </button>
      </div>
    </div>
  );
}
