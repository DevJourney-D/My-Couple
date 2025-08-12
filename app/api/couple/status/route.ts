// app/api/couple/status/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { userId } = await request.json();

  try {
    // ตรวจสอบว่ามีคู่หรือไม่
    const { data: couple } = await supabase
      .from('couples')
      .select('id, user1_id, user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single();

    if (couple) {
      // หาคู่ที่ไม่ใช่ตัวเรา
      const partnerId = couple.user1_id === userId ? couple.user2_id : couple.user1_id;
      
      // ดึงข้อมูล username ของคู่จากตาราง custom_users
      const { data: partnerData } = await supabase
        .from('custom_users')
        .select('username')
        .eq('id', partnerId)
        .single();

      return NextResponse.json({ 
        isConnected: true, 
        coupleId: couple.id,
        partnerId: partnerId,
        partnerUsername: partnerData?.username || 'Unknown'
      });
    }

    return NextResponse.json({ isConnected: false });
  } catch (error) {
    console.error('Error checking couple status:', error);
    return NextResponse.json({ isConnected: false });
  }
}
