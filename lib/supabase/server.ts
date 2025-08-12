import { createClient } from '@supabase/supabase-js';

// สร้างฟังก์ชันเพื่อไม่ให้ client ถูกสร้างขึ้นใหม่ทุกครั้งที่เรียกใช้
export const createSupabaseServerClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // ใช้ service role key สำหรับ server
    );
};