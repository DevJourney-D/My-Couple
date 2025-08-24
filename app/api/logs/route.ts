import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST - บันทึก log
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    const { action, level = 'INFO', details } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    console.log('📝 Logging action for user:', userId, { action, level });

    const { data: logEntry, error } = await supabase
      .from('system_logs')
      .insert([{
        user_id: userId,
        action,
        level,
        details
      }])
      .select()
      .single();

    if (error) {
      console.log('❌ Error creating log entry:', error);
      return NextResponse.json({ error: 'Failed to create log entry' }, { status: 500 });
    }

    console.log('✅ Log entry created successfully:', logEntry.id);

    return NextResponse.json({
      success: true,
      log: logEntry
    });

  } catch (error) {
    console.error('❌ Error in POST /api/logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - ดึงรายการ logs (สำหรับหน้า logs)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    // Get pagination parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const level = url.searchParams.get('level');
    const offset = (page - 1) * limit;

    console.log('🔍 Fetching logs for user:', userId, { page, limit, level });

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
      console.log('💑 User has partner, fetching couple logs');
    } else {
      console.log('👤 User is single, fetching personal logs');
    }

    // Build query
    let query = supabase
      .from('system_logs')
      .select('*')
      .in('user_id', userIds);

    // Apply level filter if provided
    if (level) {
      query = query.eq('level', level);
    }

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .in('user_id', userIds);

    if (countError) {
      console.log('❌ Error counting logs:', countError);
      return NextResponse.json({ error: 'Failed to count logs' }, { status: 500 });
    }

    // Get paginated logs
    const { data: logs, error: logsError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      console.log('❌ Error fetching logs:', logsError);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    console.log('✅ Retrieved logs:', logs?.length || 0, 'items');

    return NextResponse.json({
      success: true,
      logs: logs || [],
      total: totalCount || 0,
      page,
      limit,
      totalPages: Math.ceil((totalCount || 0) / limit)
    });

  } catch (error) {
    console.error('❌ Error in GET /api/logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
