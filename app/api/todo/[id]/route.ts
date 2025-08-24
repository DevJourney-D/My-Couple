import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// PATCH - อัปเดต todo (toggle complete หรือ update ข้อมูล)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const params = await context.params;
    const todoId = parseInt(params.id);
    const { action, task, priority, due_date } = await request.json();

    console.log(`🔄 Updating todo ${todoId} for user:`, userId);

    // ตรวจสอบว่า todo นี้เป็นของผู้ใช้หรือไม่
    const { data: existingTodo, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .eq('created_by', userId)
      .single();

    if (fetchError || !existingTodo) {
      console.log('❌ Todo not found or access denied');
      return NextResponse.json({ error: 'Todo not found or access denied' }, { status: 404 });
    }

    let updateData: {
      is_completed?: boolean;
      completed_at?: string | null;
      task?: string;
      priority?: string;
      due_date?: string | null;
    } = {};

    if (action === 'toggle') {
      // Toggle completion status
      updateData = {
        is_completed: !existingTodo.is_completed,
        completed_at: !existingTodo.is_completed ? new Date().toISOString() : null
      };
    } else if (action === 'update') {
      // Update task, priority, and due_date
      if (task !== undefined) updateData.task = task.trim();
      if (priority !== undefined) updateData.priority = priority;
      if (due_date !== undefined) {
        // Validate due date if provided
        if (due_date) {
          const dueDate = new Date(due_date + 'T00:00:00.000Z'); // Ensure UTC
          const today = new Date();
          // Adjust for Thailand timezone (UTC+7)
          const thailandToday = new Date(today.getTime() + (7 * 60 * 60 * 1000));
          thailandToday.setHours(0, 0, 0, 0); // Reset time to start of day
          
          if (dueDate < thailandToday) {
            return NextResponse.json({ error: 'Due date cannot be in the past' }, { status: 400 });
          }
        }
        updateData.due_date = due_date || null;
      }
    }

    const { data: updatedTodo, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', todoId)
      .eq('created_by', userId)
      .select()
      .single();

    if (error) {
      console.log('❌ Error updating todo:', error);
      return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
    }

    console.log('✅ Todo updated successfully:', todoId);

    return NextResponse.json({
      success: true,
      todo: updatedTodo
    });

  } catch (error) {
    console.error('❌ Error in PATCH /api/todo/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - ลบ todo
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const params = await context.params;
    const todoId = parseInt(params.id);

    console.log(`🗑️ Deleting todo ${todoId} for user:`, userId);

    // ลบ todo (เฉพาะของผู้ใช้เท่านั้น)
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId)
      .eq('created_by', userId);

    if (error) {
      console.log('❌ Error deleting todo:', error);
      return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
    }

    console.log('✅ Todo deleted successfully:', todoId);

    return NextResponse.json({
      success: true,
      message: 'Todo deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error in DELETE /api/todo/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
