// app/api/bucket-list/route.ts
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

// GET - ดึงรายการ bucket list ทั้งหมดของคู่รัก
export async function GET(request: NextRequest) {
  try {
    console.log('=== Bucket List GET Request ===');
    
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

    // ดึงรายการ bucket list ของ user
    const { data: items, error: itemsError } = await supabase
      .from('bucket_list_items')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.log('❌ Error fetching items:', itemsError);
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    console.log('✅ Retrieved items:', items?.length || 0, 'items');
    
    return NextResponse.json({
      success: true,
      items: items || []
    });

  } catch (error) {
    console.error('❌ Bucket List GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - สร้างรายการ bucket list ใหม่
export async function POST(request: NextRequest) {
  try {
    console.log('=== Bucket List POST Request ===');
    
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
    const { title, description, category } = body;

    console.log('📝 Request data:', { title, description, category });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!title) {
      console.log('❌ Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required fields: title is required' 
      }, { status: 400 });
    }

    // สร้างรายการใหม่
    const { data: newItem, error: itemError } = await supabase
      .from('bucket_list_items')
      .insert([
        {
          task: title,
          is_completed: false,
          created_by: userId,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
    if (itemError) {
      console.log('❌ Error creating item:', itemError);
      return NextResponse.json({ 
        error: 'Failed to create item',
        details: itemError.message 
      }, { status: 500 });
    }

    console.log('✅ Item created successfully:', newItem.id);

    return NextResponse.json({
      success: true,
      message: 'Item created successfully',
      item: newItem
    });

  } catch (error) {
    console.error('❌ Bucket List POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
