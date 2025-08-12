// app/api/signup/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { username, password } = await request.json();

  try {
    if (!username || !password) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }, { status: 400 });
    }

    // ตรวจสอบว่ามี username ซ้ำหรือไม่
    const { data: existingUser } = await supabase
      .from('custom_users')
      .select('id')
      .eq('username', username)
      .single();
    if (existingUser) {
      // Log กรณีสมัครสมาชิกไม่สำเร็จ (username ซ้ำ)
      await supabase.from('system_logs').insert({
        action: 'USER_SIGNUP_FAIL',
        level: 'WARN',
        details: { reason: 'Username already exists', username },
      });
      return NextResponse.json({ error: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // สร้าง user
    const { data: newUser, error: createError } = await supabase
      .from('custom_users')
      .insert({ username, hashed_password: hashedPassword })
      .select()
      .single();
    if (createError || !newUser) {
      // Log กรณีสมัครสมาชิกไม่สำเร็จ (insert error)
      await supabase.from('system_logs').insert({
        action: 'USER_SIGNUP_FAIL',
        level: 'ERROR',
        details: { reason: 'Insert error', username, error: createError?.message },
      });
      return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' }, { status: 500 });
    }

    // Log กรณีสมัครสมาชิกสำเร็จ
    await supabase.from('system_logs').insert({
      user_id: newUser.id,
      action: 'USER_SIGNUP_SUCCESS',
      level: 'INFO',
    });

    return NextResponse.json({ message: 'สมัครสมาชิกสำเร็จ' });
  } catch (error) {
    // Log กรณีเกิดข้อผิดพลาดร้ายแรง
    await supabase.from('system_logs').insert({
      action: 'USER_SIGNUP_FAIL',
      level: 'ERROR',
      details: { username, error: (error as Error).message },
    });
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' }, { status: 500 });
  }
}
