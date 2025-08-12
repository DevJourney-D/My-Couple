// app/api/couple-calendar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

// GET - ดึงรายการกิจกรรมปฏิทินของคู่รัก
export async function GET(request: NextRequest) {
  try {
    console.log('=== Couple Calendar GET Request ===');
    
    // ตรวจสอบ Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // ตรวจสอบ JWT token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      console.log('✅ Token verified for user:', decoded.userId);
    } catch (error) {
      console.log('❌ Invalid token:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    // ดึงข้อมูลคู่รักของ user
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'connected')
      .single();

    if (coupleError || !coupleData) {
      console.log('❌ No couple found or error:', coupleError);
      // ถ้าไม่มีคู่ ให้ดึงเฉพาะของตัวเอง
      const { data: events, error: eventsError } = await supabase
        .from('couple_calendar_events')
        .select('*')
        .eq('created_by', userId)
        .order('date', { ascending: true });
      
      if (eventsError) {
        console.log('❌ Error fetching events:', eventsError);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
      }
      
      console.log('✅ Retrieved events (single user):', events?.length || 0, 'events');
      return NextResponse.json({
        success: true,
        events: events || []
      });
    }

    // หา partner ID
    const partnerId = coupleData.user1_id === userId ? coupleData.user2_id : coupleData.user1_id;
    
    // ดึงรายการกิจกรรมของทั้งคู่
    const { data: events, error: eventsError } = await supabase
      .from('couple_calendar_events')
      .select('*')
      .in('created_by', [userId, partnerId])
      .order('date', { ascending: true });

    if (eventsError) {
      console.log('❌ Error fetching events:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    console.log('✅ Retrieved events:', events?.length || 0, 'events');
    
    return NextResponse.json({
      success: true,
      events: events || []
    });

  } catch (error) {
    console.error('❌ Couple Calendar GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - สร้างกิจกรรมใหม่
export async function POST(request: NextRequest) {
  try {
    console.log('=== Couple Calendar POST Request ===');
    
    // ตรวจสอบ Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // ตรวจสอบ JWT token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      console.log('✅ Token verified for user:', decoded.userId);
    } catch (error) {
      console.log('❌ Invalid token:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    // รับข้อมูลจาก request body
    const body = await request.json();
    const { title, date, description, type, emoji, color } = body;

    console.log('📅 Request data:', { title, date, description, type, emoji, color });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!title || !date || !type) {
      console.log('❌ Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required fields: title, date, and type are required' 
      }, { status: 400 });
    }

    // สร้างกิจกรรมใหม่
    const { data: newEvent, error: eventError } = await supabase
      .from('couple_calendar_events')
      .insert([
        {
          title,
          date,
          description: description || '',
          type,
          emoji: emoji || '💕',
          color: color || 'from-pink-400 to-rose-500',
          created_by: userId,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (eventError) {
      console.log('❌ Error creating event:', eventError);
      return NextResponse.json({ 
        error: 'Failed to create event',
        details: eventError.message 
      }, { status: 500 });
    }

    console.log('✅ Event created successfully:', newEvent.id);

    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      event: newEvent
    });

  } catch (error) {
    console.error('❌ Couple Calendar POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
