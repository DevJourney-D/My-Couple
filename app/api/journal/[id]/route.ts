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

// GET - Get specific journal entry (แก้ไขตาม schema: ใช้ user_id แทน couple_id)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const decoded = verifyToken(request);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('id', resolvedParams.id)
            .eq('user_id', decoded.userId)
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH - Update journal entry (แก้ไข: ใช้ user_id และไม่ใช้ mood field)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const decoded = verifyToken(request);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { entry_date, content } = body;

        if (!entry_date || !content) {
            return NextResponse.json({ 
                error: 'Entry date and content are required' 
            }, { status: 400 });
        }

        const resolvedParams = await params;
        // Verify the entry belongs to this user
        const { data: existingEntry } = await supabase
            .from('journal_entries')
            .select('user_id')
            .eq('id', resolvedParams.id)
            .eq('user_id', decoded.userId)
            .single();

        if (!existingEntry) {
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }

        const { data, error } = await supabase
            .from('journal_entries')
            .update({
                entry_date,
                content,
                updated_at: new Date().toISOString()
            })
            .eq('id', resolvedParams.id)
            .eq('user_id', decoded.userId)
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Soft delete journal entry (ส่งเข้า deleted_at แทนการลบจริง)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const decoded = verifyToken(request);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        // Verify the entry belongs to this user
        const { data: existingEntry } = await supabase
            .from('journal_entries')
            .select('id')
            .eq('id', resolvedParams.id)
            .eq('user_id', decoded.userId)
            .single();

        if (!existingEntry) {
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }

        // Soft delete: อัปเดต deleted_at แทนการลบจริง
        const { error } = await supabase
            .from('journal_entries')
            .update({
                deleted_at: new Date().toISOString()
            })
            .eq('id', resolvedParams.id)
            .eq('user_id', decoded.userId);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
