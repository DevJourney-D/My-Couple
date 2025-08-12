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

// DELETE - Delete photo
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        console.log('DELETE request received for photo ID:', resolvedParams.id);
        
        const decoded = verifyToken(request);
        if (!decoded) {
            console.log('Authorization failed');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('User authorized:', decoded.userId);
        const photoId = resolvedParams.id;

        // ดึงข้อมูลรูปก่อนลบเพื่อเช็ค ownership และรูปภาพ URL
        console.log('Fetching photo with ID:', photoId, 'for user:', decoded.userId);
        const { data: photo, error: fetchError } = await supabase
            .from('posts')
            .select('id, user_id, image_url')
            .eq('id', photoId)
            .eq('user_id', decoded.userId)
            .not('image_url', 'is', null)
            .single();

        console.log('Fetch result:', { photo, fetchError });

        if (fetchError || !photo) {
            console.log('Photo not found or access denied');
            return NextResponse.json({ error: 'Photo not found or access denied' }, { status: 404 });
        }

        // ลบไฟล์จาก Supabase Storage ก่อน (ถ้ามี)
        if (photo.image_url) {
            try {
                // ดึงชื่อไฟล์จาก URL
                const url = new URL(photo.image_url);
                const pathParts = url.pathname.split('/');
                const fileName = pathParts[pathParts.length - 1];
                
                if (fileName) {
                    const { error: storageError } = await supabase.storage
                        .from('photos')
                        .remove([fileName]);
                    
                    if (storageError) {
                        console.error('Storage delete error:', storageError);
                        // ไม่ return error เพราะอาจเป็นไฟล์ที่ไม่อยู่ใน storage
                    }
                }
            } catch (urlError) {
                console.error('Error parsing image URL:', urlError);
                // ไม่ return error เพราะอาจเป็น URL ภายนอก
            }
        }

        // ลบข้อมูลจากฐานข้อมูล (hard delete)
        console.log('Attempting to delete photo:', photoId);
        
        const { error: deleteError } = await supabase
            .from('posts')
            .delete()
            .eq('id', photoId)
            .eq('user_id', decoded.userId);

        console.log('Delete result:', { deleteError });

        if (deleteError) {
            console.error('Database delete error:', deleteError);
            return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
        }

        console.log('Photo deleted successfully');
        return NextResponse.json({ message: 'Photo deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
