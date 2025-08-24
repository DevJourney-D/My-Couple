# Todo List Feature 📝💕

ฟีเจอร์ Todo List ใน My-Couple App ที่ออกแบบมาสำหรับคู่รักในการจัดการงานและเป้าหมายร่วมกัน

## ✨ คุณสมบัติหลัก

### 🎯 การจัดการรายการงาน
- ✅ เพิ่มรายการงานใหม่พร้อมระดับความสำคัญ
- ✏️ แก้ไขรายการงานที่มีอยู่
- 🗑️ ลบรายการงานที่ไม่ต้องการ
- ☑️ ทำเครื่องหมายว่าทำเสร็จแล้ว/ยังไม่เสร็จ

### 🎨 ระดับความสำคัญ
- 🟢 **ปกติ (Low)** - งานทั่วไปที่ไม่เร่งด่วน
- 🟡 **สำคัญ (Medium)** - งานที่ควรให้ความสำคัญ  
- 🔴 **เร่งด่วน (High)** - งานที่ต้องทำก่อน

### 📊 ระบบกรองและสถิติ
- 📋 ดูรายการทั้งหมด
- ⏳ ดูรายการที่กำลังดำเนินการ
- ✅ ดูรายการที่เสร็จแล้ว
- 📈 แสดงสถิติการทำงาน (ทั้งหมด/กำลังทำ/เสร็จแล้ว)

### 💑 สำหรับคู่รัก
- 👥 คู่รักสามารถเห็นรายการงานของกันและกันได้
- 🔒 แต่ละคนแก้ไข/ลบได้เฉพาะรายการของตัวเอง
- 💕 ช่วยกันติดตามและสนับสนุนการทำงาน

## 🛠️ เทคโนโลยีที่ใช้

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling และ responsive design
- **React Hooks** - State management (useState, useEffect, useCallback)

### Backend API
- **Next.js API Routes** - RESTful API
- **JWT Authentication** - ระบบยืนยันตัวตน
- **Supabase** - PostgreSQL database

### Database Schema
```sql
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    task TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔐 การรักษาความปลอดภัย

### Row Level Security (RLS)
- ผู้ใช้เห็นได้เฉพาะรายการของตัวเองและคู่รัก
- แก้ไข/ลบได้เฉพาะรายการของตัวเอง
- สร้างรายการใหม่โดยใช้ JWT token ยืนยันตัวตน

## 📱 การออกแบบ UI/UX

### 🎨 ธีมสี
- **สีหลัก**: Gradient Pink-Purple-Rose สำหรับความน่ารัก
- **สีรอง**: เขียว (เสร็จแล้ว), เหลือง (สำคัญ), แดง (เร่งด่วน)
- **พื้นหลัง**: Gradient background พร้อมอนิเมชั่นน่ารักๆ

### ✨ Animation & Effects
- 💖 พื้นหลังมีไอคอน emoji แอนิเมชั่น
- 🎯 Hover effects และ transform scale
- 🌟 Sparkle icons ที่มีแอนิเมชั่น bounce
- 🎉 Notification system สำหรับ feedback

### 📱 Responsive Design
- 📱 Mobile-first approach
- 💻 รองรับทุกขนาดหน้าจอ
- 🎛️ Flexible layout และ components

## 🚀 API Endpoints

### GET /api/todo
ดึงรายการ todos ทั้งหมด
```javascript
// Headers
Authorization: Bearer <jwt_token>

// Response
{
  "success": true,
  "todos": [
    {
      "id": 1,
      "task": "ซื้อของขวัญให้คู่",
      "is_completed": false,
      "priority": "high",
      "created_by": "user-uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "completed_at": null
    }
  ]
}
```

### POST /api/todo
เพิ่มรายการใหม่
```javascript
// Headers
Authorization: Bearer <jwt_token>
Content-Type: application/json

// Body
{
  "task": "ทำอาหารด้วยกัน",
  "priority": "medium"
}

// Response
{
  "success": true,
  "todo": { ... }
}
```

### PATCH /api/todo/[id]
อัปเดตรายการ
```javascript
// Toggle completion
{
  "action": "toggle"
}

// Update task
{
  "action": "update",
  "task": "ข้อความใหม่",
  "priority": "high"
}
```

### DELETE /api/todo/[id]
ลบรายการ
```javascript
// Headers
Authorization: Bearer <jwt_token>

// Response
{
  "success": true,
  "message": "Todo deleted successfully"
}
```

## 🎯 การใช้งาน

1. **เข้าสู่ระบบ** - ใช้ JWT token สำหรับยืนยันตัวตน
2. **เพิ่มรายการ** - คลิกปุ่ม "เพิ่มรายการใหม่" และกรอกข้อมูล
3. **จัดการรายการ** - ใช้ปุ่มแก้ไข/ลบ หรือคลิกเครื่องหมายเพื่อทำเครื่องหมายเสร็จ
4. **กรองรายการ** - ใช้ปุ่มกรองเพื่อดูเฉพาะประเภทที่สนใจ
5. **ดูสถิติ** - ตรวจสอบสถิติการทำงานด้านบน

## 🔧 การติดตั้งและตั้งค่า

1. **Database Setup**
   ```bash
   # รันสคริปต์สร้างตาราง
   psql -d your_database -f scripts/create_todos_table.sql
   ```

2. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_jwt_secret
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🎉 ตัวอย่างการใช้งาน

```typescript
// เพิ่มรายการใหม่
const addTodo = async () => {
  const response = await fetch('/api/todo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      task: 'วางแผนเดทสุดสัปดาห์',
      priority: 'high'
    })
  });
};

// Toggle สถานะ
const toggleComplete = async (id) => {
  const response = await fetch(`/api/todo/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ action: 'toggle' })
  });
};
```

---

✨ **สร้างด้วยความรักสำหรับคู่รักทุกคู่** 💕

พัฒนาโดย My-Couple App Team 🚀
