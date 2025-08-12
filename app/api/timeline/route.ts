// app/api/timeline/route.ts
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

// GET - ดึงโพสต์ทั้งหมดของคู่รัก
export async function GET(request: NextRequest) {
  try {
    console.log('=== Timeline GET Request ===');
    
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

    // ตรวจสอบว่า user อยู่ในคู่รักหรือไม่
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single();

    if (coupleError || !coupleData) {
      console.log('❌ User not in couple or couple not found:', coupleError);
      return NextResponse.json({ error: 'User not in couple' }, { status: 404 });
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get total count (เฉพาะโพสต์ที่ยังไม่ถูกลบ)
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .in('user_id', [coupleData.user1_id, coupleData.user2_id]);

    // ดึงโพสต์ทั้งหมดของทั้งคู่รัก with pagination (เฉพาะที่ยังไม่ถูกลบ)
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('user_id', [coupleData.user1_id, coupleData.user2_id])
      .order('event_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) {
      console.log('❌ Error fetching posts:', postsError);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    // ดึงข้อมูลผู้ใช้สำหรับคู่รัก
    const { data: users, error: usersError } = await supabase
      .from('custom_users')
      .select('id, username')
      .in('id', [coupleData.user1_id, coupleData.user2_id]);

    if (usersError) {
      console.log('❌ Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // จับคู่ข้อมูลโพสต์กับผู้ใช้
    const postsWithUsers = posts?.map(post => {
      const user = users?.find(u => u.id === post.user_id);
      return {
        ...post,
        custom_users: user ? { username: user.username } : null
      };
    }) || [];

    console.log('✅ Retrieved posts:', postsWithUsers?.length || 0, 'posts');
    
    return NextResponse.json({
      success: true,
      posts: postsWithUsers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page * limit < (count || 0),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Timeline GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - สร้างโพสต์ใหม่
export async function POST(request: NextRequest) {
  try {
    console.log('=== Timeline POST Request ===');
    
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
    const { title, content, event_date } = body;

    console.log('📝 Request data:', { title, content, event_date });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!title || !event_date) {
      console.log('❌ Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required fields: title and event_date are required' 
      }, { status: 400 });
    }

    // สร้างโพสต์ใหม่ (ไม่ใช้ couple_id เพราะ posts table ไม่มี)
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert([
        {
          title,
          content: content || null,
          event_date,
          user_id: userId,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (postError) {
      console.log('❌ Error creating post:', postError);
      return NextResponse.json({ 
        error: 'Failed to create post',
        details: postError.message 
      }, { status: 500 });
    }

    console.log('✅ Post created successfully:', newPost.id);

    return NextResponse.json({
      success: true,
      message: 'Post created successfully',
      post: newPost
    });

  } catch (error) {
    console.error('❌ Timeline POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
