-- Add due_date column to todos table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'todos' AND column_name = 'due_date'
    ) THEN
        ALTER TABLE todos ADD COLUMN due_date DATE;
        
        -- Add comment to the column
        COMMENT ON COLUMN todos.due_date IS 'วันที่ครบกำหนดของงาน (ไม่บังคับ)';
        
        -- Create index for better performance on due date queries
        CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
        CREATE INDEX IF NOT EXISTS idx_todos_due_date_completed ON todos(due_date, is_completed);
        
        -- Log the change
        RAISE NOTICE 'Successfully added due_date column to todos table';
    ELSE
        RAISE NOTICE 'due_date column already exists in todos table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'todos' 
ORDER BY ordinal_position;
