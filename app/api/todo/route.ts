import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET - ดึงรายการ todos ทั้งหมดของคู่รัก (รองรับ pagination และ filter)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    // Get pagination and filter parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const filter = url.searchParams.get('filter') || 'all';
    const offset = (page - 1) * limit;

    console.log('🔍 Fetching todos for user:', userId, { page, limit, filter });

    // ตรวจสอบว่าผู้ใช้เป็นส่วนหนึ่งของคู่รักหรือไม่
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single();

    if (coupleError && coupleError.code !== 'PGRST116') {
      console.log('❌ Error checking couple status:', coupleError);
      return NextResponse.json({ error: 'Failed to check couple status' }, { status: 500 });
    }

    let userIds = [userId];
    if (coupleData) {
      const partnerId = coupleData.user1_id === userId ? coupleData.user2_id : coupleData.user1_id;
      userIds = [userId, partnerId];
      console.log('� User has partner, fetching couple todos');
    } else {
      console.log('👤 User is single, fetching personal todos');
    }

    // Build query based on filter
    let query = supabase
      .from('todos')
      .select('*')
      .in('created_by', userIds);

    // Apply filters
    if (filter === 'pending') {
      query = query.eq('is_completed', false);
    } else if (filter === 'completed') {
      query = query.eq('is_completed', true);
    } else if (filter === 'overdue') {
      // Calculate today in Thailand timezone
      const today = new Date();
      const thailandToday = new Date(today.getTime() + (7 * 60 * 60 * 1000));
      const todayString = thailandToday.toISOString().split('T')[0];
      
      query = query
        .eq('is_completed', false)
        .not('due_date', 'is', null)
        .lt('due_date', todayString);
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('todos')
      .select('*', { count: 'exact', head: true })
      .in('created_by', userIds);

    if (countError) {
      console.log('❌ Error counting todos:', countError);
      return NextResponse.json({ error: 'Failed to count todos' }, { status: 500 });
    }

    // Get paginated todos
    const { data: todos, error: todosError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (todosError) {
      console.log('❌ Error fetching todos:', todosError);
      return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
    }

    console.log('✅ Retrieved todos:', todos?.length || 0, 'items');

    return NextResponse.json({
      success: true,
      todos: todos || [],
      total: totalCount || 0,
      page,
      limit,
      totalPages: Math.ceil((totalCount || 0) / limit)
    });

  } catch (error) {
    console.error('❌ Error in GET /api/todo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - เพิ่ม todo ใหม่ (รองรับ due_date)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const { task, priority = 'medium', due_date } = await request.json();

    if (!task || task.trim() === '') {
      return NextResponse.json({ error: 'Task is required' }, { status: 400 });
    }

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

    console.log('📝 Adding new todo for user:', userId);

    const { data: newTodo, error } = await supabase
      .from('todos')
      .insert([{
        task: task.trim(),
        priority,
        due_date: due_date || null,
        is_completed: false,
        created_by: userId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.log('❌ Error adding todo:', error);
      return NextResponse.json({ error: 'Failed to add todo' }, { status: 500 });
    }

    console.log('✅ Todo added successfully:', newTodo.id);

    return NextResponse.json({
      success: true,
      todo: newTodo
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error in POST /api/todo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
