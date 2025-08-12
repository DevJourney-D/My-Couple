// app/api/bucket-list/[id]/route.ts
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

interface UpdateData {
  is_completed: boolean;
  completed_at?: string | null;
}

// PATCH - อัพเดทสถานะรายการ (เสร็จแล้ว/ยังไม่เสร็จ)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Bucket List PATCH Request ===');
    
    const resolvedParams = await params;
    const itemId = resolvedParams.id;
    console.log('📝 Item ID:', itemId);

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

    // ดึงข้อมูลรายการปัจจุบัน
    const { data: currentItem, error: fetchError } = await supabase
      .from('bucket_list_items')
      .select('*')
      .eq('id', itemId)
      .eq('created_by', userId)
      .single();

    if (fetchError || !currentItem) {
      console.log('❌ Item not found:', fetchError);
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // รับข้อมูลจาก request body
    const body = await request.json();
    const { completed } = body;

    // สลับสถานะการเสร็จสิ้น
    const newCompletedStatus = completed;
    const updateData: UpdateData = {
      is_completed: newCompletedStatus
    };

    // ถ้าเสร็จแล้ว ให้บันทึกวันที่เสร็จ
    if (newCompletedStatus) {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from('bucket_list_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Error updating item:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update item',
        details: updateError.message 
      }, { status: 500 });
    }

    console.log('✅ Item updated successfully:', itemId);

    return NextResponse.json({
      success: true,
      message: 'Item updated successfully',
      item: updatedItem
    });

  } catch (error) {
    console.error('❌ Bucket List PATCH error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - ลบรายการ
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Bucket List DELETE Request ===');
    
    const resolvedParams = await params;
    const itemId = resolvedParams.id;
    console.log('📝 Item ID:', itemId);

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

    // ตรวจสอบว่ารายการนี้เป็นของผู้ใช้หรือไม่
    const { data: item, error: fetchError } = await supabase
      .from('bucket_list_items')
      .select('*')
      .eq('id', itemId)
      .eq('created_by', userId)
      .single();

    if (fetchError || !item) {
      console.log('❌ Item not found:', fetchError);
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // ลบรายการ
    const { error: deleteError } = await supabase
      .from('bucket_list_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.log('❌ Error deleting item:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete item',
        details: deleteError.message 
      }, { status: 500 });
    }

    console.log('✅ Item deleted successfully:', itemId);

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error('❌ Bucket List DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
