// app/api/couple-calendar/[id]/route.ts
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

// DELETE - ลบกิจกรรม
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== Couple Calendar DELETE Request ===');
    
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
    const eventId = params.id;

    // ตรวจสอบว่ากิจกรรมนี้เป็นของ user หรือไม่
    const { data: existingEvent, error: checkError } = await supabase
      .from('couple_calendar_events')
      .select('*')
      .eq('id', eventId)
      .eq('created_by', userId)
      .single();

    if (checkError || !existingEvent) {
      console.log('❌ Event not found or unauthorized:', checkError);
      return NextResponse.json({ 
        error: 'Event not found or you do not have permission to delete it' 
      }, { status: 404 });
    }

    // ลบกิจกรรม
    const { error: deleteError } = await supabase
      .from('couple_calendar_events')
      .delete()
      .eq('id', eventId)
      .eq('created_by', userId);

    if (deleteError) {
      console.log('❌ Error deleting event:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete event',
        details: deleteError.message 
      }, { status: 500 });
    }

    console.log('✅ Event deleted successfully:', eventId);

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('❌ Couple Calendar DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
