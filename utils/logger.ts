// Logger utility for tracking user actions
export interface LogEntry {
  user_id?: string;
  action: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  details?: Record<string, unknown>;
}

export const logAction = async (logData: LogEntry) => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(logData)
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
};

// General logging function for any page
export const logUserAction = (page: string, action: string, details: Record<string, unknown> = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    page,
    action,
    details,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
  };
  
  console.log(`📝 ${page.toUpperCase()} Log:`, logEntry);
  
  // เก็บ log ใน localStorage สำหรับ backup
  try {
    const existingLogs = JSON.parse(localStorage.getItem('appLogs') || '[]');
    existingLogs.push(logEntry);
    // เก็บแค่ 1000 logs ล่าสุด
    if (existingLogs.length > 1000) {
      existingLogs.splice(0, existingLogs.length - 1000);
    }
    localStorage.setItem('appLogs', JSON.stringify(existingLogs));
  } catch (error) {
    console.error('Error saving log to localStorage:', error);
  }

  // ส่ง log ไปยัง API
  logAction({
    action: `${page.toUpperCase()}_${action.toUpperCase()}`,
    level: details.level as 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' || 'INFO',
    details: {
      ...details,
      timestamp,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
    }
  });
};

// Todo-specific logging functions
export const logTodoActions = {
  create: (task: string, priority: string, due_date?: string) => 
    logAction({
      action: 'TODO_CREATED',
      level: 'INFO',
      details: { task, priority, due_date }
    }),

  update: (id: number, changes: Record<string, unknown>) => 
    logAction({
      action: 'TODO_UPDATED',
      level: 'INFO',
      details: { todo_id: id, changes }
    }),

  complete: (id: number, task: string) => 
    logAction({
      action: 'TODO_COMPLETED',
      level: 'SUCCESS',
      details: { todo_id: id, task }
    }),

  delete: (id: number, task: string) => 
    logAction({
      action: 'TODO_DELETED',
      level: 'WARNING',
      details: { todo_id: id, task }
    }),

  viewList: (filter: string, total: number) => 
    logAction({
      action: 'TODO_LIST_VIEWED',
      level: 'INFO',
      details: { filter, total_items: total }
    })
};
