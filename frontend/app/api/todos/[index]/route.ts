import { NextResponse } from 'next/server';
import { deleteTodo } from '@/lib/todoStore';

export async function DELETE(
  _request: Request,
  { params }: { params: { index: string } }
) {
  const index = parseInt(params.index, 10);

  if (isNaN(index)) {
    return NextResponse.json({ error: 'Invalid index' }, { status: 400 });
  }

  const { deleted, todos } = deleteTodo(index);

  if (deleted === null) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  return NextResponse.json({
    message: `Task '${deleted}' deleted successfully!`,
    todos,
  });
}
