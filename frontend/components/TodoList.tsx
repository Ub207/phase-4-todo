'use client';

import { useEffect, useState } from 'react';
import { todoApi } from '@/lib/api';

export default function TodoList() {
  const [todos, setTodos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await todoApi.getTodos();
      setTodos(data.todos);
    } catch (err) {
      setError('Failed to fetch todos. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    try {
      setDeleting(index);
      await todoApi.deleteTodo(index);
      await fetchTodos();
    } catch (err) {
      console.error('Failed to delete todo:', err);
      setError('Failed to delete todo');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchTodos();

    // Refresh when ChatInterface modifies tasks
    const handleTodosUpdated = () => fetchTodos();
    window.addEventListener('todosUpdated', handleTodosUpdated);
    return () => window.removeEventListener('todosUpdated', handleTodosUpdated);
  }, []);

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">📋</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Your Tasks</h2>
            <p className="text-xs text-gray-400">{todos.length} total</p>
          </div>
        </div>
        <button
          onClick={fetchTodos}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition"
        >
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto chat-scroll">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-3 text-gray-500 text-sm">Loading tasks...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-4">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={fetchTodos}
              className="mt-2 text-sm text-red-700 font-medium hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        ) : todos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl mb-3 opacity-30">📝</div>
              <p className="text-gray-400 text-sm">No tasks yet</p>
              <p className="text-gray-300 text-xs mt-1">Use the chat to add tasks!</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {todos.map((todo, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-blue-50 rounded-xl transition group border border-transparent hover:border-blue-100"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-lg flex items-center justify-center text-xs font-bold mr-3">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 text-sm truncate">{todo}</span>
                </div>
                <button
                  onClick={() => handleDelete(index)}
                  disabled={deleting === index}
                  className="ml-3 px-2.5 py-1 text-xs text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition opacity-0 group-hover:opacity-100 disabled:opacity-50 border border-red-200 hover:border-red-500"
                  title="Delete"
                >
                  {deleting === index ? '...' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
