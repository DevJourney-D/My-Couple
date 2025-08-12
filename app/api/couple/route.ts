// ใช้ invitation code เพื่อจับคู่
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { userId, code } = await request.json();

  try {
    // ตรวจสอบ invitation
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('code', code)
      .eq('is_used', false)
      .single();
    if (invError || !invitation) {
      // Log กรณีรหัสคำเชิญไม่ถูกต้อง
      await supabase.from('system_logs').insert({
        user_id: userId,
        action: 'COUPLE_CONNECT_FAIL',
        level: 'WARN',
        details: { reason: 'Invalid invitation code', code },
      });
      return NextResponse.json({ error: 'รหัสคำเชิญไม่ถูกต้องหรือถูกใช้แล้ว' }, { status: 400 });
    }

  // ตรวจสอบว่าผู้ใช้ทั้งสองยังไม่มีคู่
  const { data: couple1 } = await supabase
    .from('couples')
    .select('id')
    .or(`user1_id.eq.${invitation.created_by},user2_id.eq.${invitation.created_by}`)
    .single();
  const { data: couple2 } = await supabase
    .from('couples')
    .select('id')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .single();
  if (couple1 || couple2) {
    // Log กรณีบัญชีมีคู่แล้ว
    await supabase.from('system_logs').insert({
      user_id: userId,
      action: 'COUPLE_CONNECT_FAIL',
      level: 'WARN',
      details: { reason: 'User already has couple', invited_by: invitation.created_by },
    });
    return NextResponse.json({ error: 'บัญชีนี้มีคู่แล้ว' }, { status: 400 });
  }

  // สร้างข้อมูลคู่รัก
  const { data: couple, error: coupleError } = await supabase
    .from('couples')
    .insert({ user1_id: invitation.created_by, user2_id: userId })
    .select()
    .single();
  if (coupleError || !couple) {
    // Log กรณีเกิดข้อผิดพลาดในการสร้างคู่รัก
    await supabase.from('system_logs').insert({
      user_id: userId,
      action: 'COUPLE_CONNECT_FAIL',
      level: 'ERROR',
      details: { error: coupleError?.message, invited_by: invitation.created_by },
    });
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการจับคู่' }, { status: 500 });
  }

  // อัปเดต invitation ว่าใช้แล้ว
  await supabase
    .from('invitations')
    .update({ is_used: true })
    .eq('id', invitation.id);

  // Log กรณีเชื่อมต่อสำเร็จ
  await supabase.from('system_logs').insert({
    user_id: userId,
    action: 'COUPLE_CONNECT_SUCCESS',
    level: 'INFO',
    details: { couple_id: couple.id, invited_by: invitation.created_by },
  });

  return NextResponse.json({ message: 'เชื่อมต่อสำเร็จ!' });

  } catch (error) {
    // Log กรณีเกิดข้อผิดพลาดร้ายแรง
    await supabase.from('system_logs').insert({
      user_id: userId,
      action: 'COUPLE_CONNECT_FAIL',
      level: 'ERROR',
      details: { error: (error as Error).message, code },
    });
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' }, { status: 500 });
  }
}
