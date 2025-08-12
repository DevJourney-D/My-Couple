// สร้าง invitation code
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function generateCode() {
  // ตัวอย่าง: สุ่มรหัส 7 ตัว เช่น A4B-C8D
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
    if (i === 2) code += '-';
  }
  return code;
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  
  try {
    const body = await request.json();
    console.log('Received request body:', body); // Debug
    const { userId } = body;
    
    if (!userId) {
      console.log('Missing userId in request'); // Debug
      return NextResponse.json({ error: 'กรุณาส่ง userId' }, { status: 400 });
    }

    // ตรวจสอบว่า user มีอยู่จริงในฐานข้อมูล หรือสร้างใหม่
    console.log('Checking if user exists:', userId); // Debug
    const { data: userExists, error: userError } = await supabase
      .from('custom_users')
      .select('id')
      .eq('id', userId)
      .single();
    
    console.log('User check result:', { userExists, userError }); // Debug
    
    if (userError || !userExists) {
      console.log('User not found, creating new user...'); // Debug
      // สร้าง user ใหม่ (เฉพาะสำหรับทดสอบ)
      const { data: newUser, error: createError } = await supabase
        .from('custom_users')
        .insert({ 
          id: userId, 
          username: `user_${userId.substring(0, 8)}`, 
          hashed_password: 'temp_password_hash' 
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Failed to create user:', createError);
        return NextResponse.json({ error: 'ไม่สามารถสร้างผู้ใช้ได้' }, { status: 400 });
      }
      console.log('Created new user:', newUser);
    }
    // ตรวจสอบว่าผู้ใช้ยังไม่มีคู่
    const { data: couple } = await supabase
      .from('couples')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single();
    if (couple) {
      // Log กรณีมีคู่แล้ว
      await supabase.from('system_logs').insert({
        user_id: userId,
        action: 'INVITATION_CREATE_FAIL',
        level: 'WARN',
        details: { reason: 'User already has couple' },
      });
      return NextResponse.json({ error: 'คุณมีคู่แล้ว' }, { status: 400 });
    }

  // สร้างรหัสคำเชิญ
  let code;
  let exists = true;
  while (exists) {
    code = generateCode();
    const { data: found } = await supabase
      .from('invitations')
      .select('id')
      .eq('code', code)
      .single();
    exists = !!found;
  }

  // บันทึก invitation
  console.log('Inserting invitation with code:', code, 'for userId:', userId); // Debug
  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({ code, created_by: userId })
    .select()
    .single();
  
  console.log('Insert result:', { invitation, error }); // Debug
  
  if (error || !invitation) {
    console.error('Insert error details:', error); // Debug
    // Log กรณีเกิดข้อผิดพลาดในการสร้าง invitation
    await supabase.from('system_logs').insert({
      user_id: userId,
      action: 'INVITATION_CREATE_FAIL',
      level: 'ERROR',
      details: { error: error?.message },
    });
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }

  // Log กรณีสร้าง invitation สำเร็จ
  await supabase.from('system_logs').insert({
    user_id: userId,
    action: 'INVITATION_CREATE_SUCCESS',
    level: 'INFO',
    details: { code },
  });

  return NextResponse.json({ code });

  } catch (error) {
    console.error('API Error:', error); // Debug
    // Log กรณีเกิดข้อผิดพลาดร้ายแรง
    try {
      await supabase.from('system_logs').insert({
        action: 'INVITATION_CREATE_FAIL',
        level: 'ERROR',
        details: { error: (error as Error).message },
      });
    } catch (logError) {
      console.error('Log Error:', logError);
    }
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างคำเชิญ' }, { status: 500 });
  }
}
