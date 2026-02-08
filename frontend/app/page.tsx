'use client';

import ChatInterface from '@/components/ChatInterface';
import TodoList from '@/components/TodoList';

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <span className="text-3xl">🤖</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
            AI Todo Chatbot
          </h1>
          <p className="text-lg text-white/80 max-w-md mx-auto">
            Manage your tasks with the help of AI — just type what you need!
          </p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TodoList />
          <ChatInterface />
        </div>

        {/* Footer */}
        <footer className="mt-10 text-center">
          <p className="text-sm text-white/50">
            Powered by FastAPI & Next.js — Phase 4
          </p>
        </footer>
      </div>
    </main>
  );
}
