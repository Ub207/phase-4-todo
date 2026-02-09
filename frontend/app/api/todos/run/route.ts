import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const task = body.task;

  if (!task) {
    return NextResponse.json({ error: 'Task is required' }, { status: 400 });
  }

  return NextResponse.json({
    task,
    result: `AI features are not available yet. Your task "${task}" has been noted.`,
  });
}
