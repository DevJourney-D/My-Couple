// app/api/register/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // ค่ามาตรฐานสำหรับความปลอดภัยในการ Hashing

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { username, password, confirmPassword } = await request.json();

  try {
    // 1. ตรวจสอบข้อมูลเบื้องต้น
    if (!username || !password || !confirmPassword) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน' }, { status: 400 });
    }

    // 2. ตรวจสอบว่ามีชื่อผู้ใช้นี้ในระบบแล้วหรือยัง
    const { data: existingUser } = await supabase
      .from('custom_users')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      // บันทึก Log กรณีชื่อผู้ใช้ซ้ำ
      await supabase.from('system_logs').insert({
        action: 'USER_REGISTER_FAIL',
        level: 'WARN',
        details: { reason: 'Username already exists', username: username },
      });
      return NextResponse.json({ error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' }, { status: 409 }); // 409 Conflict
    }

    // 3. เข้ารหัสรหัสผ่าน (Hashing)
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. บันทึกผู้ใช้ใหม่ลงในฐานข้อมูล
    const { data: newUser, error: insertError } = await supabase
      .from('custom_users')
      .insert({
        username: username,
        hashed_password: hashedPassword,
      })
      .select('id') // ขอข้อมูล id ของ user ที่เพิ่งสร้างกลับมา
      .single();

    if (insertError || !newUser) {
      throw new Error(insertError?.message || 'Could not create user.');
    }

    // 5. บันทึก Log กรณีลงทะเบียนสำเร็จ
    await supabase.from('system_logs').insert({
      user_id: newUser.id, // ใช้ id ของ user ใหม่ที่ได้มา
      action: 'USER_REGISTER_SUCCESS',
      level: 'INFO',
      details: { username: username },
    });

    // 6. ส่งข้อความว่าลงทะเบียนสำเร็จ
    return NextResponse.json({ message: 'ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ' }, { status: 201 });

  } catch (error: unknown) {
    console.error('Register Error:', error);
    // บันทึก Log กรณีเกิดข้อผิดพลาดอื่นๆ
    await supabase.from('system_logs').insert({
        action: 'USER_REGISTER_FAIL',
        level: 'ERROR',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
    });
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลงทะเบียน' }, { status: 500 });
  }
}
