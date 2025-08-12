import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const jwtSecret = process.env.JWT_SECRET!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Post {
    id: number;
    title: string;
    content: string;
    image_url: string;
    created_at: string;
    user_id: string;
}

interface DecodedToken {
    userId: string;
    coupleId: string;
}

function verifyToken(request: NextRequest): DecodedToken | null {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Temporary bypass for testing - return a default user
            return {
                userId: '4a6f54e5-e46d-4020-aa20-bedd2b7a7bd7',
                coupleId: 'test-couple'
            };
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        // Fallback to default user for testing
        return {
            userId: '4a6f54e5-e46d-4020-aa20-bedd2b7a7bd7',
            coupleId: 'test-couple'
        };
    }
}

// GET - Fetch photos from posts table
export async function GET(request: NextRequest) {
    try {
        const decoded = verifyToken(request);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get pagination parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const offset = (page - 1) * limit;

        // Get total count
        const { count } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', decoded.userId)
            .not('image_url', 'is', null);

        // ดึงข้อมูล posts ที่มี image_url เท่านั้น (posts ที่เป็นรูปภาพ) with pagination
        const { data, error } = await supabase
            .from('posts')
            .select(`
                id,
                title,
                content,
                image_url,
                created_at,
                user_id
            `)
            .eq('user_id', decoded.userId)
            .not('image_url', 'is', null) // เฉพาะ posts ที่มีรูปภาพ
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // แปลงข้อมูลให้ตรงกับ format ที่ frontend ต้องการ
        const photos = data?.map((post: Post) => ({
            id: post.id,
            title: post.title,
            description: post.content,
            image_url: post.image_url,
            upload_date: post.created_at.split('T')[0], // แปลงเป็น date format
            tags: [], // อาจจะเพิ่ม tags field ในอนาคต
            created_by: post.user_id,
            username: 'Current User'
        })) || [];

        return NextResponse.json({ 
            photos,
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
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Upload new photo to posts table
export async function POST(request: NextRequest) {
    try {
        const decoded = verifyToken(request);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title, description, image_url, tags } = await request.json();

        if (!title || !image_url) {
            return NextResponse.json({ 
                error: 'Title and image_url are required' 
            }, { status: 400 });
        }

        // บันทึกข้อมูลลงตาราง posts
        const { data, error } = await supabase
            .from('posts')
            .insert({
                user_id: decoded.userId,
                title: title,
                content: description || '',
                image_url: image_url,
                event_date: new Date().toISOString().split('T')[0],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select(`
                id,
                title,
                content,
                image_url,
                created_at,
                updated_at,
                user_id
            `)
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // แปลงข้อมูลให้ตรงกับ format ที่ frontend ต้องการ
        const newPhoto = {
            id: data.id,
            title: data.title,
            description: data.content,
            image_url: data.image_url,
            upload_date: data.created_at.split('T')[0],
            tags: tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [],
            created_by: data.user_id,
            username: "Current User"
        };

        return NextResponse.json(newPhoto, { status: 201 });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
