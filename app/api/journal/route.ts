import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const jwtSecret = process.env.JWT_SECRET!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DecodedToken {
    userId: string;
    coupleId: string;
}

function verifyToken(request: NextRequest): DecodedToken | null {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

// GET - Fetch journal entries for the user (ไม่ใช้ couple_id เพราะ schema ไม่มี)
export async function GET(request: NextRequest) {
    try {
        const decoded = verifyToken(request);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get pagination parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // Get total count
        const { count } = await supabase
            .from('journal_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', decoded.userId)
            .is('deleted_at', null);

        // Get paginated entries
        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', decoded.userId)
            .is('deleted_at', null) // ไม่แสดงรายการที่ถูก soft delete
            .order('entry_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ 
            entries: data || [],
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

// POST - Create new journal entry (แก้ไขตาม schema จริง)
export async function POST(request: NextRequest) {
    try {
        const decoded = verifyToken(request);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { entry_date, content } = body; // ไม่ใช้ mood เพราะ schema ไม่มี

        if (!entry_date || !content) {
            return NextResponse.json({ 
                error: 'Entry date and content are required' 
            }, { status: 400 });
        }

        // Check if entry already exists for this date (ไม่นับรายการที่ถูก soft delete)
        const { data: existingEntry } = await supabase
            .from('journal_entries')
            .select('id')
            .eq('user_id', decoded.userId)
            .eq('entry_date', entry_date)
            .is('deleted_at', null)
            .single();

        if (existingEntry) {
            return NextResponse.json({ 
                error: 'Entry for this date already exists. Use PATCH to update.' 
            }, { status: 409 });
        }

        const { data, error } = await supabase
            .from('journal_entries')
            .insert({
                user_id: decoded.userId,
                entry_date,
                content
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ entry: data }, { status: 201 });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
