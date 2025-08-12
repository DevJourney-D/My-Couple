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

// POST - Upload image file to Supabase Storage
export async function POST(request: NextRequest) {
    try {
        const decoded = verifyToken(request);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const tags = formData.get('tags') as string;

        if (!file || !title) {
            return NextResponse.json({ 
                error: 'File and title are required' 
            }, { status: 400 });
        }

        // ตรวจสอบประเภทไฟล์
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ 
                error: 'Only image files are allowed' 
            }, { status: 400 });
        }

        // ตรวจสอบขนาดไฟล์ (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ 
                error: 'File size must be less than 5MB' 
            }, { status: 400 });
        }

        // สร้างชื่อไฟล์ที่ไม่ซ้ำ
        const fileExt = file.name.split('.').pop();
        const fileName = `${decoded.userId}_${Date.now()}.${fileExt}`;
        
        // ตรวจสอบและสร้าง bucket หากไม่มี
        const { data: buckets } = await supabase.storage.listBuckets();
        const photosBucket = buckets?.find(bucket => bucket.name === 'photos');
        
        if (!photosBucket) {
            const { error: bucketError } = await supabase.storage.createBucket('photos', {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            });
            
            if (bucketError) {
                console.error('Bucket creation error:', bucketError);
                // ไม่ return error เพราะ bucket อาจมีอยู่แล้ว
            }
        }
        
        // อัปโหลดไฟล์ไปยัง Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(fileName, file);

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({ 
                error: 'Failed to upload image' 
            }, { status: 500 });
        }

        // ดึง public URL ของไฟล์ที่อัปโหลด
        const { data: urlData } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName);

        const imageUrl = urlData.publicUrl;

        // บันทึกข้อมูลลงตาราง posts
        const { data, error } = await supabase
            .from('posts')
            .insert({
                user_id: decoded.userId,
                title: title,
                content: description || '',
                image_url: imageUrl,
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
