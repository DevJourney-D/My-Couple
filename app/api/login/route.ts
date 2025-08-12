// app/api/login/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { username, password } = await request.json();

  try {
    // 1. ตรวจสอบว่ามี username และ password ส่งมาหรือไม่
    if (!username || !password) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }, { status: 400 });
    }

    // 2. ค้นหาผู้ใช้ในฐานข้อมูล
    const { data: user, error: userError } = await supabase
      .from('custom_users')
      .select('*')
      .eq('username', username)
      .single();

    if (userError || !user) {
      // บันทึก Log กรณีหาชื่อผู้ใช้ไม่เจอ
      await supabase.from('system_logs').insert({
        action: 'USER_LOGIN_FAIL',
        level: 'WARN',
        details: { reason: 'User not found', username: username },
      });
      return NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // 3. เปรียบเทียบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);

    if (!isPasswordValid) {
      // บันทึก Log กรณีรหัสผ่านผิด
      await supabase.from('system_logs').insert({
        user_id: user.id,
        action: 'USER_LOGIN_FAIL',
        level: 'WARN',
        details: { reason: 'Invalid password', username: username },
      });
      return NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // 4. สร้าง JSON Web Token (JWT)
    const secretKey = process.env.JWT_SECRET || 'YOUR_SUPER_SECRET_KEY';
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      secretKey,
      { expiresIn: '24h' } // Token หมดอายุใน 24 ชั่วโมง
    );

  // 5. ส่ง token กลับใน response (ไม่ใช้ cookie)
  const response = NextResponse.json({ message: 'เข้าสู่ระบบสำเร็จ', token });
    
    // 6. บันทึก Log กรณีเข้าสู่ระบบสำเร็จ
    await supabase.from('system_logs').insert({
        user_id: user.id,
        action: 'USER_LOGIN_SUCCESS',
        level: 'INFO',
    });

    return response;

  } catch (error) {
    console.error('Login Error:', error);
    // บันทึก Log กรณีเกิดข้อผิดพลาดร้ายแรง
    await supabase.from('system_logs').insert({
        action: 'USER_LOGIN_FAIL',
        level: 'ERROR',
        details: { username: username, error: (error as Error).message },
    });
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }, { status: 500 });
  }
}
