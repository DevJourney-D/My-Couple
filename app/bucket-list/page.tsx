'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// =================================================================
// ไอคอนต่างๆ
// =================================================================
const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3l8-8" />
        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9s4.03-9 9-9c2.39 0 4.68.94 6.36 2.64" />
    </svg>
);

const CircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

// Interface สำหรับ Bucket List (ตรงตาม database schema)
interface BucketItem {
    id: number;
    task: string;
    is_completed: boolean;
    completed_at?: string;
    created_at: string;
    created_by: string;
}

export default function BucketListPage() {
    const [showModal, setShowModal] = useState(false);
    const [items, setItems] = useState<BucketItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        task: ''
    });
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info';
        message: string;
    } | null>(null);

    // แสดง notification
    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    // ดึงข้อมูล bucket list
    const fetchBucketList = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                showNotification('error', 'ไม่พบข้อมูลการเข้าสู่ระบบ');
                return;
            }

            const response = await fetch('/api/bucket-list', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setItems(data.items || []);
            } else {
                const errorData = await response.json();
                showNotification('error', errorData.error || 'ไม่สามารถดึงข้อมูลได้');
            }
        } catch (error) {
            console.error('Error fetching bucket list:', error);
            showNotification('error', 'เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBucketList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.task.trim()) {
            showNotification('error', 'กรุณาใส่ชื่อรายการ');
            return;
        }
        
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                showNotification('error', 'ไม่พบข้อมูลการเข้าสู่ระบบ');
                return;
            }

            const response = await fetch('/api/bucket-list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: formData.task  // API ยังคาดหวัง 'title' แต่จะเก็บเป็น 'task' ในฐานข้อมูล
                })
            });

            if (response.ok) {
                const result = await response.json();
                setItems(prev => [result.item, ...prev]);
                setFormData({ task: '' });
                setShowModal(false);
                showNotification('success', 'เพิ่มรายการใหม่เรียบร้อยแล้ว');
            } else {
                const errorData = await response.json();
                showNotification('error', errorData.error || 'ไม่สามารถเพิ่มรายการได้');
            }
        } catch (error) {
            console.error('Error adding item:', error);
            showNotification('error', 'เกิดข้อผิดพลาดในการเพิ่มรายการ');
        }
    };

    // สลับสถานะการเสร็จสิ้น
    const toggleComplete = async (item: BucketItem) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                showNotification('error', 'ไม่พบข้อมูลการเข้าสู่ระบบ');
                return;
            }

            const response = await fetch(`/api/bucket-list/${item.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    completed: !item.is_completed
                })
            });

            if (response.ok) {
                const result = await response.json();
                setItems(prev => prev.map(i => i.id === item.id ? result.item : i));
                showNotification('success', 
                    !item.is_completed ? 'ยินดีด้วย! เสร็จสิ้นรายการแล้ว 🎉' : 'เปลี่ยนเป็นยังไม่เสร็จแล้ว'
                );
            } else {
                const errorData = await response.json();
                showNotification('error', errorData.error || 'ไม่สามารถอัพเดทสถานะได้');
            }
        } catch (error) {
            console.error('Error toggling complete:', error);
            showNotification('error', 'เกิดข้อผิดพลาดในการอัพเดทสถานะ');
        }
    };

    // ลบรายการ
    const deleteItem = async (itemId: number) => {
        if (!confirm('ต้องการลบรายการนี้หรือไม่?')) return;
        
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                showNotification('error', 'ไม่พบข้อมูลการเข้าสู่ระบบ');
                return;
            }

            const response = await fetch(`/api/bucket-list/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setItems(prev => prev.filter(item => item.id !== itemId));
                showNotification('success', 'ลบรายการเรียบร้อยแล้ว');
            } else {
                const errorData = await response.json();
                showNotification('error', errorData.error || 'ไม่สามารถลบรายการได้');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            showNotification('error', 'เกิดข้อผิดพลาดในการลบรายการ');
        }
    };

    // กรองรายการ
    const filteredItems = items.filter(item => {
        if (filter === 'completed') return item.is_completed;
        if (filter === 'pending') return !item.is_completed;
        return true;
    });

    const completedCount = items.filter(item => item.is_completed).length;

    if (loading) {
        return (
        <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-4 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-black">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blue-50 p-4">
            {/* Header */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-lg border border-white/30">
                <div className="flex items-center justify-between mb-4">
                    <Link href="/dashboard" className="p-2 hover:bg-white/50 rounded-full transition-colors">
                        <BackIcon />
                    </Link>
                                        <h1 className="text-2xl font-black text-blue-700">
                        ✨ สิ่งที่อยากทำด้วยกัน
                    </h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-105"
                    >
                        <PlusIcon />
                    </button>
                </div>

                {/* สถิติและตัวกรอง */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="text-sm font-black text-gray-600">
                        เสร็จแล้ว {completedCount} จาก {items.length} รายการ
                    </div>
                    
                    <div className="flex gap-2">
                        {[
                            { key: 'all', label: 'ทั้งหมด', color: 'bg-gray-100 text-gray-800' },
                            { key: 'pending', label: 'ยังไม่เสร็จ', color: 'bg-orange-100 text-orange-800' },
                            { key: 'completed', label: 'เสร็จแล้ว', color: 'bg-green-100 text-green-800' }
                        ].map(filterOption => (
                            <button
                                key={filterOption.key}
                                onClick={() => setFilter(filterOption.key as typeof filter)}
                                className={`px-4 py-2 rounded-full text-sm font-black transition-all ${
                                    filter === filterOption.key 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : filterOption.color + ' hover:shadow-md'
                                }`}
                            >
                                {filterOption.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* รายการ Bucket List */}
            <div className="space-y-4">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📝</div>
                        <p className="text-gray-600 font-black text-lg">
                            {filter === 'all' ? 'ยังไม่มีรายการ เริ่มเพิ่มกันเลย!' :
                             filter === 'pending' ? 'ไม่มีรายการที่ยังไม่เสร็จ' :
                             'ยังไม่มีรายการที่เสร็จแล้ว'}
                        </p>
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className={`bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border transition-all hover:shadow-xl ${
                                item.is_completed ? 'border-green-500 bg-green-50/70' : 'border-purple-500'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Checkbox */}
                                <button
                                    onClick={() => toggleComplete(item)}
                                    className={`p-2 rounded-full transition-all transform hover:scale-110 ${
                                        item.is_completed
                                            ? 'text-green-600 hover:bg-green-100'
                                            : 'text-purple-600 hover:bg-purple-100'
                                    }`}
                                >
                                    {item.is_completed ? <CheckCircleIcon /> : <CircleIcon />}
                                </button>

                                {/* เนื้อหา */}
                                <div className="flex-1">
                                    <h3 className={`text-lg font-black mb-2 ${
                                        item.is_completed ? 'text-gray-600 line-through' : 'text-gray-800'
                                    }`}>
                                        {item.task}
                                    </h3>

                                    {/* วันที่เสร็จสิ้น */}
                                    {item.is_completed && item.completed_at && (
                                        <p className="text-sm text-green-600 font-black">
                                            ✅ เสร็จเมื่อ {new Date(item.completed_at).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    )}
                                </div>

                                {/* ปุ่มลบ */}
                                <button
                                    onClick={() => deleteItem(item.id)}
                                    className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-all transform hover:scale-110"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal เพิ่มรายการ */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-gray-800">เพิ่มรายการใหม่</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label className="block text-sm font-black text-gray-700 mb-2">
                                    สิ่งที่อยากทำ *
                                </label>
                                <input
                                    type="text"
                                    value={formData.task}
                                    onChange={(e) => setFormData({...formData, task: e.target.value})}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-black"
                                    placeholder="เช่น เดินทางไปญี่ปุ่น, เรียนภาษาใหม่..."
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-black transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-black transition-all transform hover:scale-105"
                                >
                                    เพิ่มรายการ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Notification */}
            {notification && (
                <div className="fixed top-4 right-4 z-50">
                    <div className={`p-4 rounded-lg shadow-lg font-black ${
                        notification.type === 'success' ? 'bg-green-500 text-white' :
                        notification.type === 'error' ? 'bg-red-500 text-white' :
                        'bg-blue-500 text-white'
                    }`}>
                        {notification.message}
                    </div>
                </div>
            )}
        </div>
    );
}
