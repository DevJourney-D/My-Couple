'use client';

import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { logTodoActions } from '../../utils/logger';

// =================================================================
// ไอคอนต่างๆ สำหรับ ToDo List
// =================================================================

const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const TodoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
        <path d="m10 11 0 6"></path>
        <path d="m14 11 0 6"></path>
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

// =================================================================
// Interface สำหรับ ToDo Item
// =================================================================
interface TodoItem {
    id: number;
    task: string;
    is_completed: boolean;
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
    created_by: string;
    created_at: string;
    completed_at?: string;
}

// =================================================================
// ToDo List Page
// =================================================================
export default function TodoPage() {
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
    const [newTodo, setNewTodo] = useState({
        task: '',
        priority: 'medium' as 'low' | 'medium' | 'high',
        due_date: ''
    });
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Confirmation modal state
    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        todo: TodoItem | null;
        action: 'delete';
    }>({
        isOpen: false,
        todo: null,
        action: 'delete'
    });

    // Priority configurations
    const priorityConfigs = {
        low: { emoji: '🟢', color: 'from-green-500 to-green-600', name: 'ปกติ', textColor: 'text-green-700', bgColor: 'bg-green-50' },
        medium: { emoji: '🟡', color: 'from-yellow-500 to-orange-500', name: 'สำคัญ', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
        high: { emoji: '🔴', color: 'from-red-500 to-red-600', name: 'เร่งด่วน', textColor: 'text-red-700', bgColor: 'bg-red-50' }
    };

    // Get today's date in Thailand timezone (YYYY-MM-DD format)
    const getTodayString = () => {
        const today = new Date();
        // Adjust for Thailand timezone (UTC+7)
        const thailandTime = new Date(today.getTime() + (7 * 60 * 60 * 1000));
        return thailandTime.toISOString().split('T')[0];
    };

    // Show notification
    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    // Handle modal actions with logging
    const handleShowAddModal = () => {
        setShowAddModal(true);
        logTodoActions.viewList('open_add_modal', totalItems);
    };

    const handleCloseAddModal = () => {
        setShowAddModal(false);
        logTodoActions.viewList('close_add_modal', totalItems);
    };

    const handleShowEditModal = (todo: TodoItem) => {
        setEditingTodo(todo);
        logTodoActions.viewList('open_edit_modal', totalItems);
    };

    const handleCloseEditModal = () => {
        setEditingTodo(null);
        logTodoActions.viewList('close_edit_modal', totalItems);
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        logTodoActions.viewList(`page_${newPage}`, totalItems);
    };

    // Check if todo is overdue
    const isOverdue = (todo: TodoItem) => {
        if (!todo.due_date || todo.is_completed) return false;
        const dueDate = new Date(todo.due_date + 'T00:00:00.000Z');
        const today = new Date();
        // Adjust for Thailand timezone (UTC+7)
        const thailandToday = new Date(today.getTime() + (7 * 60 * 60 * 1000));
        thailandToday.setHours(0, 0, 0, 0);
        return dueDate < thailandToday;
    };

    // Get due date status
    const getDueDateStatus = (todo: TodoItem) => {
        if (!todo.due_date || todo.is_completed) return null;

        const dueDate = new Date(todo.due_date + 'T00:00:00.000Z');
        const today = new Date();
        // Adjust for Thailand timezone (UTC+7)
        const thailandToday = new Date(today.getTime() + (7 * 60 * 60 * 1000));
        thailandToday.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - thailandToday.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { status: 'overdue', text: `เกินกำหนด ${Math.abs(diffDays)} วัน`, color: 'text-red-600 bg-red-50' };
        } else if (diffDays === 0) {
            return { status: 'today', text: 'ครบกำหนดวันนี้', color: 'text-orange-600 bg-orange-50' };
        } else if (diffDays <= 3) {
            return { status: 'soon', text: `อีก ${diffDays} วัน`, color: 'text-yellow-600 bg-yellow-50' };
        } else {
            return { status: 'future', text: `อีก ${diffDays} วัน`, color: 'text-gray-600 bg-gray-50' };
        }
    };

    // Fetch todos with pagination
    const fetchTodos = useCallback(async (page = 1) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                showNotification('error', 'ไม่พบข้อมูลการเข้าสู่ระบบ');
                return;
            }

            const response = await fetch(`/api/todo?page=${page}&limit=${itemsPerPage}&filter=${filter}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTodos(data.todos || []);
                setTotalItems(data.total || 0);

                // Log the view action
                logTodoActions.viewList(filter, data.total || 0);
            } else {
                showNotification('error', 'ไม่สามารถโหลดรายการได้');
            }
        } catch (error) {
            console.error('Error fetching todos:', error);
            showNotification('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage, filter]);

    // Add new todo
    const handleAddTodo = async () => {
        if (!newTodo.task.trim()) return;

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                showNotification('error', 'ไม่พบข้อมูลการเข้าสู่ระบบ');
                return;
            }

            const response = await fetch('/api/todo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    task: newTodo.task,
                    priority: newTodo.priority,
                    due_date: newTodo.due_date || null
                })
            });

            if (response.ok) {
                const result = await response.json();
                setTodos(prev => [result.todo, ...prev]);

                // Log the creation
                logTodoActions.create(newTodo.task, newTodo.priority, newTodo.due_date);

                setNewTodo({ task: '', priority: 'medium', due_date: '' });
                handleCloseAddModal();
                showNotification('success', 'เพิ่มรายการใหม่เรียบร้อยแล้ว');
                fetchTodos(currentPage); // Refresh current page
            } else {
                const errorData = await response.json();
                showNotification('error', errorData.error || 'ไม่สามารถเพิ่มรายการได้');
            }
        } catch (error) {
            console.error('Error adding todo:', error);
            showNotification('error', 'เกิดข้อผิดพลาดในการเพิ่มรายการ');
        }
    };

    // Toggle todo completion
    const toggleComplete = async (id: number) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                showNotification('error', 'ไม่พบข้อมูลการเข้าสู่ระบบ');
                return;
            }

            const todo = todos.find(t => t.id === id);
            if (!todo) return;

            const response = await fetch(`/api/todo/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'toggle' })
            });

            if (response.ok) {
                const result = await response.json();
                setTodos(prev => prev.map(todo =>
                    todo.id === id ? result.todo : todo
                ));

                // Log the completion/toggle action
                if (result.todo.is_completed) {
                    logTodoActions.complete(id, todo.task);
                }

                showNotification('success', result.todo.is_completed ? 'ทำเสร็จแล้ว! 🎉' : 'เปลี่ยนสถานะแล้ว');
            } else {
                showNotification('error', 'ไม่สามารถอัปเดตสถานะได้');
            }
        } catch (error) {
            console.error('Error toggling todo:', error);
            showNotification('error', 'เกิดข้อผิดพลาดในการอัปเดต');
        }
    };

    // Show delete confirmation
    const showDeleteConfirmation = (todo: TodoItem) => {
        setConfirmModal({
            isOpen: true,
            todo,
            action: 'delete'
        });
    };

    // Delete todo
    const deleteTodo = async (todo: TodoItem) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                showNotification('error', 'ไม่พบข้อมูลการเข้าสู่ระบบ');
                return;
            }

            const response = await fetch(`/api/todo/${todo.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setTodos(prev => prev.filter(t => t.id !== todo.id));

                // Log the deletion
                logTodoActions.delete(todo.id, todo.task);

                showNotification('success', 'ลบรายการเรียบร้อยแล้ว');
                fetchTodos(currentPage); // Refresh current page
            } else {
                showNotification('error', 'ไม่สามารถลบรายการได้');
            }
        } catch (error) {
            console.error('Error deleting todo:', error);
            showNotification('error', 'เกิดข้อผิดพลาดในการลบ');
        }
    };

    useEffect(() => {
        fetchTodos(currentPage);
        
        // Log page visit on first load
        if (currentPage === 1) {
            logTodoActions.viewList('initial_load', 0);
        }
    }, [fetchTodos, currentPage]);

    useEffect(() => {
        setCurrentPage(1); // Reset to first page when filter changes
        fetchTodos(1);
        
        // Log filter change
        logTodoActions.viewList(`filter_${filter}`, totalItems);
    }, [filter, fetchTodos, totalItems]);

    // Filter todos
    const filteredTodos = todos.filter(todo => {
        if (filter === 'pending') return !todo.is_completed;
        if (filter === 'completed') return todo.is_completed;
        if (filter === 'overdue') return isOverdue(todo);
        return true;
    });

    // Pagination calculations
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    // Statistics
    const stats = {
        total: totalItems,
        completed: todos.filter(todo => todo.is_completed).length,
        pending: todos.filter(todo => !todo.is_completed).length,
        overdue: todos.filter(todo => isOverdue(todo)).length
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl animate-spin mb-4">⏳</div>
                    <p className="text-xl font-bold text-gray-600">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 relative overflow-hidden">
            {/* พื้นหลังทางการ */}
            <div className="absolute inset-0 opacity-5">
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            fontSize: `${Math.random() * 1.5 + 1}rem`,
                            animationDelay: `${Math.random() * 3}s`,
                        }}
                    >
                        {['📋', '✅', '📊', '🎯', '📈'][Math.floor(Math.random() * 5)]}
                    </div>
                ))}
            </div>

            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${notification.type === 'success'
                        ? 'bg-green-100 border-green-300 text-green-700'
                        : 'bg-red-100 border-red-300 text-red-700'
                    }`}>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{notification.type === 'success' ? '✅' : '❌'}</span>
                        <span className="font-semibold">{notification.message}</span>
                    </div>
                </div>
            )}

            <div className="relative z-10 container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className='flex items-center justify-between mb-4'>
                        <Link href="/dashboard" className="inline-flex items-center space-x-3 text-blue-600 hover:text-blue-800 transition-all bg-white/90 backdrop-blur-sm rounded-lg px-6 py-3 shadow-md hover:shadow-lg transform hover:scale-105 border border-blue-200 mb-6">
                            <BackIcon />
                            <span className="font-semibold text-lg">กลับหน้าหลัก</span>
                        </Link>
                    </div>
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <TodoIcon />
                        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
                            Todo List
                        </h1>
                        <TodoIcon />
                    </div>
                    <p className="text-xl text-gray-700 font-semibold mb-2">ระบบจัดการงานและเป้าหมาย</p>
                    <p className="text-lg text-gray-600 font-medium">จัดการงานและติดตามความคืบหน้าอย่างมีประสิทธิภาพ</p>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-blue-200">
                        <div className="text-center">
                            <div className="text-3xl mb-2">📊</div>
                            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                            <div className="text-sm font-semibold text-gray-600">ทั้งหมด</div>
                        </div>
                    </div>
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-orange-200">
                        <div className="text-center">
                            <div className="text-3xl mb-2">⏳</div>
                            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                            <div className="text-sm font-semibold text-gray-600">กำลังทำ</div>
                        </div>
                    </div>
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-green-200">
                        <div className="text-center">
                            <div className="text-3xl mb-2">✅</div>
                            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                            <div className="text-sm font-semibold text-gray-600">เสร็จแล้ว</div>
                        </div>
                    </div>
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-red-200">
                        <div className="text-center">
                            <div className="text-3xl mb-2">⚠️</div>
                            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                            <div className="text-sm font-semibold text-gray-600">เกินกำหนด</div>
                        </div>
                    </div>
                </div>

                {/* Add Button and Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <button
                        onClick={handleShowAddModal}
                        className="flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border border-blue-500 font-semibold"
                    >
                        <PlusIcon />
                        <span>เพิ่มรายการใหม่</span>
                    </button>

                    {/* Filter buttons */}
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { key: 'all', label: 'ทั้งหมด' },
                            { key: 'pending', label: 'กำลังทำ' },
                            { key: 'completed', label: 'เสร็จแล้ว' },
                            { key: 'overdue', label: 'เกินกำหนด' }
                        ].map((filterOption) => (
                            <button
                                key={filterOption.key}
                                onClick={() => setFilter(filterOption.key as typeof filter)}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${filter === filterOption.key
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-white/90 text-gray-700 hover:bg-white border border-gray-200'
                                    }`}
                            >
                                {filterOption.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pagination Info */}
                {totalItems > 0 && (
                    <div className="text-center mb-4">
                        <p className="text-gray-600">
                            แสดง {startIndex + 1}-{Math.min(endIndex, filteredTodos.length)} จาก {totalItems} รายการ
                        </p>
                    </div>
                )}

                {/* Todo List */}
                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-8 border border-gray-200 relative overflow-hidden mb-6">
                    {/* พื้นหลังทางการใน Todo List */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-gray-50"></div>
                    </div>

                    <div className="relative z-10">
                        {filteredTodos.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-8xl mb-8">📋</div>
                                <h4 className="text-3xl font-bold text-gray-700 mb-4">
                                    {filter === 'all' ? 'ยังไม่มีรายการ' :
                                        filter === 'pending' ? 'ไม่มีงานที่กำลังดำเนินการ' :
                                            filter === 'completed' ? 'ไม่มีงานที่เสร็จแล้ว' :
                                                'ไม่มีงานที่เกินกำหนด'}
                                </h4>
                                <p className="text-gray-500 mb-10 text-xl">
                                    {filter === 'all' ? 'เริ่มต้นเพิ่มรายการงานของคุณ' :
                                        filter === 'pending' ? 'ยอดเยี่ยม! ไม่มีงานค้างแล้ว' :
                                            filter === 'completed' ? 'เริ่มทำงานเพื่อบรรลุเป้าหมายของคุณ' :
                                                'ดีมาก! ไม่มีงานที่เกินกำหนด'}
                                </p>
                                {filter === 'all' && (
                                    <button
                                        onClick={handleShowAddModal}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-lg font-semibold text-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border border-blue-500"
                                    >
                                        เพิ่มรายการแรก
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredTodos.map((todo) => {
                                    const priorityConfig = priorityConfigs[todo.priority];
                                    const dueDateStatus = getDueDateStatus(todo);
                                    const isOverdueItem = isOverdue(todo);

                                    return (
                                        <div key={todo.id} className={`p-6 rounded-lg border shadow-lg hover:shadow-xl transition-all relative overflow-hidden ${todo.is_completed
                                                ? 'bg-gray-50 border-gray-300'
                                                : isOverdueItem
                                                    ? 'bg-red-50 border-red-300'
                                                    : 'bg-white border-blue-200'
                                            }`}>
                                            {/* Priority indicator */}
                                            <div className={`absolute top-3 right-3 px-3 py-1 rounded-md text-xs font-semibold ${priorityConfig.textColor} ${priorityConfig.bgColor} border`}>
                                                <span className="mr-1">{priorityConfig.emoji}</span>
                                                {priorityConfig.name}
                                            </div>

                                            <div className="flex items-start gap-4">
                                                {/* Checkbox */}
                                                <button
                                                    onClick={() => toggleComplete(todo.id)}
                                                    className={`flex-shrink-0 w-6 h-6 rounded border-2 transition-all ${todo.is_completed
                                                            ? 'bg-green-500 border-green-500'
                                                            : 'border-blue-400 hover:border-blue-500'
                                                        }`}
                                                >
                                                    {todo.is_completed && (
                                                        <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </button>

                                                {/* Task content */}
                                                <div className="flex-1">
                                                    <p className={`text-lg font-semibold ${todo.is_completed
                                                            ? 'text-gray-500 line-through'
                                                            : 'text-gray-800'
                                                        }`}>
                                                        {todo.task}
                                                    </p>

                                                    {/* Due date display */}
                                                    {todo.due_date && (
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <CalendarIcon />
                                                            <span className={`text-sm font-medium px-2 py-1 rounded ${dueDateStatus ? dueDateStatus.color : 'text-gray-600'
                                                                }`}>
                                                                {dueDateStatus ? dueDateStatus.text :
                                                                    `ครบกำหนด: ${new Date(todo.due_date).toLocaleDateString('th-TH')}`}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                        <span>สร้างเมื่อ: {new Date(todo.created_at).toLocaleDateString('th-TH')}</span>
                                                        {todo.completed_at && (
                                                            <span>เสร็จเมื่อ: {new Date(todo.completed_at).toLocaleDateString('th-TH')}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action buttons */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleShowEditModal(todo)}
                                                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all"
                                                    >
                                                        <EditIcon />
                                                    </button>
                                                    <button
                                                        onClick={() => showDeleteConfirmation(todo)}
                                                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <DeleteIcon />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <button
                            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeftIcon />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${currentPage === page
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRightIcon />
                        </button>
                    </div>
                )}
            </div>

            {/* Add Todo Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-xl border border-gray-200 relative overflow-hidden">
                        {/* พื้นหลังทางการใน Modal */}
                        <div className="absolute inset-0 opacity-5">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-gray-50"></div>
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-6 text-center">
                                เพิ่มรายการใหม่
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-lg font-semibold text-gray-700 mb-3">
                                        รายการงาน
                                    </label>
                                    <input
                                        type="text"
                                        value={newTodo.task}
                                        onChange={(e) => setNewTodo({ ...newTodo, task: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-700"
                                        placeholder="เช่น ประชุมทีม, ทำรายงาน, วางแผนโปรเจกต์..."
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-lg font-semibold text-gray-700 mb-3">
                                        ระดับความสำคัญ
                                    </label>
                                    <select
                                        value={newTodo.priority}
                                        onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as 'low' | 'medium' | 'high' })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-700"
                                    >
                                        {Object.entries(priorityConfigs).map(([key, config]) => (
                                            <option key={key} value={key}>
                                                {config.emoji} {config.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-lg font-semibold text-gray-700 mb-3">
                                        วันที่ครบกำหนด (ไม่บังคับ)
                                    </label>
                                    <input
                                        type="date"
                                        value={newTodo.due_date}
                                        onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-700"
                                        min={getTodayString()}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={handleCloseAddModal}
                                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleAddTodo}
                                    disabled={!newTodo.task.trim()}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    เพิ่มรายการ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Todo Modal */}
            {editingTodo && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-xl border border-gray-200 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-6 text-center">
                                แก้ไขรายการ
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-lg font-semibold text-gray-700 mb-3">
                                        รายการงาน
                                    </label>
                                    <input
                                        type="text"
                                        value={editingTodo.task}
                                        onChange={(e) => setEditingTodo({ ...editingTodo, task: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-lg font-semibold text-gray-700 mb-3">
                                        ระดับความสำคัญ
                                    </label>
                                    <select
                                        value={editingTodo.priority}
                                        onChange={(e) => setEditingTodo({ ...editingTodo, priority: e.target.value as 'low' | 'medium' | 'high' })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                                    >
                                        {Object.entries(priorityConfigs).map(([key, config]) => (
                                            <option key={key} value={key}>
                                                {config.emoji} {config.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-lg font-semibold text-gray-700 mb-3">
                                        วันที่ครบกำหนด (ไม่บังคับ)
                                    </label>
                                    <input
                                        type="date"
                                        value={editingTodo.due_date || ''}
                                        onChange={(e) => setEditingTodo({ ...editingTodo, due_date: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                                        min={getTodayString()}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={handleCloseEditModal}
                                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const token = localStorage.getItem('auth_token');
                                            const response = await fetch(`/api/todo/${editingTodo.id}`, {
                                                method: 'PATCH',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({
                                                    action: 'update',
                                                    task: editingTodo.task,
                                                    priority: editingTodo.priority,
                                                    due_date: editingTodo.due_date || null
                                                })
                                            });

                                            if (response.ok) {
                                                const result = await response.json();
                                                setTodos(prev => prev.map(todo =>
                                                    todo.id === editingTodo.id ? result.todo : todo
                                                ));
                                                
                                                // Log the update
                                                logTodoActions.update(editingTodo.id, {
                                                    task: editingTodo.task,
                                                    priority: editingTodo.priority,
                                                    due_date: editingTodo.due_date
                                                });

                                                handleCloseEditModal();
                                                showNotification('success', 'อัปเดตรายการเรียบร้อยแล้ว');
                                            } else {
                                                showNotification('error', 'ไม่สามารถอัปเดตรายการได้');
                                            }
                                        } catch (error) {
                                            console.error('Error updating todo:', error);
                                            showNotification('error', 'เกิดข้อผิดพลาดในการอัปเดต');
                                        }
                                    }}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    บันทึก
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, todo: null, action: 'delete' })}
                onConfirm={() => {
                    if (confirmModal.todo) {
                        deleteTodo(confirmModal.todo);
                    }
                }}
                title="ยืนยันการลบรายการ"
                message="คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
                confirmText="ลบรายการ"
                cancelText="ยกเลิก"
                type="danger"
                item={confirmModal.todo ? {
                    task: confirmModal.todo.task,
                    priority: confirmModal.todo.priority,
                    due_date: confirmModal.todo.due_date
                } : undefined}
            />
        </div>
    );
}
