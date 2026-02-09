// Shared in-memory todo storage for API routes
// Note: This resets on each serverless cold start, which is expected for this demo

let todoList: string[] = [];

export function getTodos(): string[] {
  return todoList;
}

export function addTodo(task: string): string[] {
  todoList.push(task);
  return todoList;
}

export function deleteTodo(index: number): { deleted: string | null; todos: string[] } {
  if (index >= 0 && index < todoList.length) {
    const deleted = todoList.splice(index, 1)[0];
    return { deleted, todos: todoList };
  }
  return { deleted: null, todos: todoList };
}
