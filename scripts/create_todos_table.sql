-- สร้างตาราง todos สำหรับ Todo List
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    task TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง index สำหรับ performance ที่ดีขึ้น
CREATE INDEX IF NOT EXISTS idx_todos_created_by ON todos(created_by);
CREATE INDEX IF NOT EXISTS idx_todos_is_completed ON todos(is_completed);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);

-- เพิ่ม RLS (Row Level Security) policy
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Policy สำหรับให้ผู้ใช้เห็นเฉพาะ todos ของตัวเองหรือของคู่รัก
CREATE POLICY "Users can view their own and partner's todos" ON todos
    FOR SELECT USING (
        created_by = auth.uid() OR
        created_by IN (
            SELECT CASE 
                WHEN user1_id = auth.uid() THEN user2_id
                WHEN user2_id = auth.uid() THEN user1_id
                ELSE NULL
            END
            FROM couples 
            WHERE (user1_id = auth.uid() OR user2_id = auth.uid())
        )
    );

-- Policy สำหรับให้ผู้ใช้สร้าง todos ได้
CREATE POLICY "Users can create todos" ON todos
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Policy สำหรับให้ผู้ใช้แก้ไขเฉพาะ todos ของตัวเอง
CREATE POLICY "Users can update their own todos" ON todos
    FOR UPDATE USING (created_by = auth.uid());

-- Policy สำหรับให้ผู้ใช้ลบเฉพาะ todos ของตัวเอง
CREATE POLICY "Users can delete their own todos" ON todos
    FOR DELETE USING (created_by = auth.uid());

-- Function สำหรับอัปเดต updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง trigger สำหรับอัปเดต updated_at
CREATE TRIGGER update_todos_updated_at 
    BEFORE UPDATE ON todos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- เพิ่มความเสียงข้างข้อมูลตัวอย่าง (optional)
COMMENT ON TABLE todos IS 'ตารางสำหรับเก็บรายการงาน (Todo List) ของคู่รัก';
COMMENT ON COLUMN todos.task IS 'รายละเอียดของงาน';
COMMENT ON COLUMN todos.is_completed IS 'สถานะว่าทำเสร็จแล้วหรือไม่';
COMMENT ON COLUMN todos.priority IS 'ระดับความสำคัญ: low, medium, high';
COMMENT ON COLUMN todos.created_by IS 'UUID ของผู้ที่สร้างรายการนี้';
COMMENT ON COLUMN todos.completed_at IS 'วันที่และเวลาที่ทำเสร็จ (ถ้าทำเสร็จแล้ว)';
