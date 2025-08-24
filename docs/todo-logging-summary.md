# Todo List Logging Summary

## การบันทึก Log ที่เพิ่มเข้ามาใน Todo List

### 1. การดูรายการ (View Actions)
- **เข้าหน้า Todo ครั้งแรก**: `TODO_LIST_VIEWED` - initial_load
- **เปลี่ยน Filter**: `TODO_LIST_VIEWED` - filter_all, filter_pending, filter_completed, filter_overdue
- **เปลี่ยนหน้า Pagination**: `TODO_LIST_VIEWED` - page_1, page_2, etc.

### 2. การจัดการ Modal (Modal Actions)
- **เปิด Add Modal**: `TODO_LIST_VIEWED` - open_add_modal
- **ปิด Add Modal**: `TODO_LIST_VIEWED` - close_add_modal
- **เปิด Edit Modal**: `TODO_LIST_VIEWED` - open_edit_modal
- **ปิด Edit Modal**: `TODO_LIST_VIEWED` - close_edit_modal

### 3. การจัดการ Todo (CRUD Actions)
- **เพิ่ม Todo**: `TODO_CREATED` - บันทึก task, priority, due_date
- **แก้ไข Todo**: `TODO_UPDATED` - บันทึก todo_id และการเปลี่ยนแปลง
- **เสร็จสิ้น Todo**: `TODO_COMPLETED` - บันทึก todo_id และ task
- **ลบ Todo**: `TODO_DELETED` - บันทึก todo_id และ task

### 4. ข้อมูลที่บันทึกใน Log
```json
{
  "user_id": "uuid ของผู้ใช้",
  "action": "ชื่อ action",
  "level": "INFO | SUCCESS | WARNING | ERROR",
  "details": {
    "task": "ชื่องาน",
    "priority": "low | medium | high",
    "due_date": "วันที่ครบกำหนด",
    "todo_id": "ID ของ todo",
    "changes": "การเปลี่ยนแปลง",
    "filter": "ประเภท filter",
    "total_items": "จำนวนรายการทั้งหมด"
  },
  "created_at": "เวลาที่บันทึก"
}
```

### 5. API Endpoint สำหรับ Logging
- **POST /api/logs**: บันทึก log ใหม่
- **GET /api/logs**: ดึงรายการ logs (รองรับ pagination และ filter)

### 6. ประโยชน์ของการบันทึก Log
- ติดตามพฤติกรรมการใช้งานของผู้ใช้
- วิเคราะห์ความนิยมของฟีเจอร์ต่างๆ
- ตรวจสอบปัญหาการใช้งาน
- สถิติการทำงานของระบบ
- ประวัติการทำงานของคู่รัก

### 7. การแสดงผล Confirmation Modal
- แสดงรายละเอียด todo ที่จะลบ
- แสดงความสำคัญและวันที่ครบกำหนด
- แจ้งเตือนว่าไม่สามารถยกเลิกได้
- ดีไซน์สวยงามและมีแอนิเมชัน

### 8. การใช้งาน Logger
```typescript
import { logTodoActions } from '../../utils/logger';

// ตัวอย่างการใช้งาน
logTodoActions.create(task, priority, due_date);
logTodoActions.update(id, changes);
logTodoActions.complete(id, task);
logTodoActions.delete(id, task);
logTodoActions.viewList(action, total);
```
