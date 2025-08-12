// app/journal/page.tsx
'use client';

import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';

// =================================================================
// ไอคอนต่างๆ
// =================================================================
const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="m19 6-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
        <path d="m10 11 6 6"></path>
        <path d="m16 11-6 6"></path>
    </svg>
);

// =================================================================
// Interface สำหรับ Journal
// =================================================================
interface JournalEntry {
    id: number;
    entry_date: string;
    content: string;
    created_at: string;
    user_id: string;
}

export default function JournalPage() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentContent, setCurrentContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info';
        message: string;
    } | null>(null);

    const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    }, []);

    const loadEntries = useCallback(async (page: number = 1, append: boolean = false) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                showNotification('error', 'ไม่พบข้อมูลการเข้าสู่ระบบ');
                setLoading(false);
                return;
            }

            // ดึง current user ID จาก token
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentUserId(payload.userId);

            if (append) setIsLoadingMore(true);

            const response = await fetch(`/api/journal?page=${page}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const entriesArray = data.entries || [];
                
                if (append) {
                    setEntries(prevEntries => [...prevEntries, ...entriesArray]);
                } else {
                    setEntries(entriesArray);
                }

                // อัปเดต pagination info
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages);
                    setCurrentPage(page);
                }

                if (!append) {
                    showNotification('success', `โหลดบันทึก ${entriesArray.length} รายการเรียบร้อย`);
                }
            } else if (response.status === 401) {
                localStorage.removeItem('auth_token');
                showNotification('error', 'กรุณาเข้าสู่ระบบใหม่');
                window.location.href = '/login';
                return;
            } else {
                showNotification('error', 'ไม่สามารถโหลดบันทึกได้');
            }
        } catch (error) {
            console.error('Error loading entries:', error);
            showNotification('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
            if (append) setIsLoadingMore(false);
        }
    }, [showNotification]);

    // โหลดข้อมูลเพิ่มเติม
    const loadMoreEntries = async () => {
        if (currentPage < totalPages && !isLoadingMore) {
            await loadEntries(currentPage + 1, true);
        }
    };

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    useEffect(() => {
        const existingEntry = entries.find(e => e.entry_date === selectedDate);
        setCurrentContent(existingEntry ? existingEntry.content : '');
    }, [selectedDate, entries]);

    const handleSave = async () => {
        if (!currentContent.trim()) {
            showNotification('error', 'กรุณาเขียนบันทึกก่อนบันทึก');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                showNotification('error', 'ไม่พบข้อมูลการเข้าสู่ระบบ');
                return;
            }

            const existingEntry = entries.find(e => e.entry_date === selectedDate);

            if (existingEntry) {
                const response = await fetch(`/api/journal/${existingEntry.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        content: currentContent
                    })
                });

                if (response.ok) {
                    setEntries(entries.map(entry => 
                        entry.id === existingEntry.id 
                            ? { ...entry, content: currentContent }
                            : entry
                    ));
                    showNotification('success', 'แก้ไขบันทึกเรียบร้อยแล้ว');
                } else if (response.status === 401) {
                    localStorage.removeItem('auth_token');
                    showNotification('error', 'กรุณาเข้าสู่ระบบใหม่');
                    window.location.href = '/login';
                    return;
                } else {
                    const errorData = await response.json();
                    showNotification('error', errorData.error || 'ไม่สามารถแก้ไขได้');
                }
            } else {
                const response = await fetch('/api/journal', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        entry_date: selectedDate,
                        content: currentContent
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    const data = result.entry || result;
                    setEntries([data, ...entries]);
                    showNotification('success', 'สร้างบันทึกใหม่เรียบร้อยแล้ว');
                } else if (response.status === 401) {
                    localStorage.removeItem('auth_token');
                    showNotification('error', 'กรุณาเข้าสู่ระบบใหม่');
                    window.location.href = '/login';
                    return;
                } else {
                    const errorData = await response.json();
                    showNotification('error', errorData.error || 'ไม่สามารถสร้างบันทึกได้');
                }
            }
        } catch (error) {
            console.error('Error saving entry:', error);
            showNotification('error', 'เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const existingEntry = entries.find(e => e.entry_date === selectedDate);
        if (!existingEntry) {
            showNotification('info', 'ไม่มีบันทึกให้ลบ');
            return;
        }
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        const existingEntry = entries.find(e => e.entry_date === selectedDate);
        if (!existingEntry) return;

        setShowDeleteModal(false);
        setSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                showNotification('error', 'ไม่พบข้อมูลการเข้าสู่ระบบ');
                return;
            }

            const response = await fetch(`/api/journal/${existingEntry.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setEntries(entries.filter(entry => entry.id !== existingEntry.id));
                setCurrentContent('');
                showNotification('success', 'ลบบันทึกเรียบร้อยแล้ว');
            } else if (response.status === 401) {
                localStorage.removeItem('auth_token');
                showNotification('error', 'กรุณาเข้าสู่ระบบใหม่');
                window.location.href = '/login';
                return;
            } else {
                const errorData = await response.json();
                showNotification('error', errorData.error || 'ไม่สามารถลบได้');
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
            showNotification('error', 'เกิดข้อผิดพลาดในการลบ');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-bold transform transition-all duration-300 ${
                    notification.type === 'success' ? 'bg-green-500' :
                    notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`}>
                    {notification.message}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                            🗑️ ยืนยันการลบบันทึก
                        </h3>
                        <p className="text-gray-600 text-center mb-6">
                            คุณแน่ใจหรือไม่ที่จะลบบันทึกวันที่ {formatDate(selectedDate)}?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-bold"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors font-bold"
                            >
                                ลบ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex items-center p-4 bg-white/90 backdrop-blur-md shadow-lg">
                <Link href="/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-amber-600 transition-colors">
                    <BackIcon />
                </Link>
                <h1 className="text-xl font-bold text-center flex-grow bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    📔 บันทึกประจำวัน
                </h1>
            </header>

            {/* Info Banner */}
            <div className="px-4 pt-4">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-gradient-to-r from-pink-100 to-purple-100 border border-pink-200 rounded-xl p-4 mb-4">
                        <p className="text-center text-gray-700 font-medium">
                            💕 คุณและคู่ของคุณสามารถเห็นบันทึกของกันและกันได้ แต่แก้ไขได้เฉพาะบันทึกของตัวเอง
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Entry List Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    📚 บันทึกของเรา
                                </h2>
                                
                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="text-3xl mb-3">⏳</div>
                                        <p className="text-gray-600 font-medium">กำลังโหลดบันทึก...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {/* Current Date (if no entry exists) */}
                                        {!entries.find(e => e.entry_date === selectedDate) && (
                                            <button
                                                onClick={() => setSelectedDate(selectedDate)}
                                                className="w-full text-left p-3 rounded-xl bg-amber-500 text-white font-bold shadow-md"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>{formatDate(selectedDate)}</span>
                                                    <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded-full">วันนี้</span>
                                                </div>
                                            </button>
                                        )}
                                        
                                        {entries.map((entry) => (
                                            <button
                                                key={entry.id}
                                                onClick={() => setSelectedDate(entry.entry_date)}
                                                className={`w-full text-left p-3 rounded-xl transition-all duration-200 font-bold shadow-sm ${
                                                    selectedDate === entry.entry_date 
                                                        ? 'bg-amber-500 text-white shadow-md transform scale-105' 
                                                        : 'bg-gray-100 text-gray-800 hover:bg-amber-100 hover:shadow-md'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-sm">{formatDate(entry.entry_date)}</span>
                                                        <div className="text-xs opacity-80 mt-1">
                                                            {entry.user_id === currentUserId ? '📝 คุณเขียน' : '💕 คู่ของคุณเขียน'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                        
                                        {entries.length === 0 && (
                                            <div className="text-center py-8">
                                                <div className="text-5xl mb-3">📖</div>
                                                <p className="text-gray-600 font-bold text-base">ยังไม่มีบันทึก</p>
                                                <p className="text-gray-500 text-sm mt-1">เริ่มเขียนบันทึกแรกกันเถอะ!</p>
                                            </div>
                                        )}

                                        {/* Load More Button */}
                                        {currentPage < totalPages && (
                                            <div className="pt-3">
                                                <button
                                                    onClick={loadMoreEntries}
                                                    disabled={isLoadingMore}
                                                    className="w-full px-4 py-2 text-sm text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 hover:border-amber-300 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isLoadingMore ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin mx-auto mb-1"></div>
                                                            กำลังโหลด...
                                                        </>
                                                    ) : (
                                                        `โหลดบันทึกเพิ่มเติม (${totalPages - currentPage} หน้าเหลือ)`
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main Editor */}
                        <div className="lg:col-span-2">
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                                {/* Date Selector */}
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        📅 เลือกวันที่
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium text-gray-800 shadow-sm"
                                    />
                                </div>

                                {/* Content Editor */}
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        ✍️ เขียนบันทึกประจำวัน
                                        {entries.find(e => e.entry_date === selectedDate && e.user_id !== currentUserId) && (
                                            <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                                                💕 บันทึกของคู่ (ดูอย่างเดียว)
                                            </span>
                                        )}
                                    </label>
                                    <textarea
                                        value={currentContent}
                                        onChange={(e) => setCurrentContent(e.target.value)}
                                        placeholder={
                                            entries.find(e => e.entry_date === selectedDate && e.user_id !== currentUserId)
                                                ? "นี่คือบันทึกของคู่ของคุณ สามารถอ่านได้แต่ไม่สามารถแก้ไขได้ 💕"
                                                : "เขียนเรื่องราวของวันนี้... ความรู้สึก ประสบการณ์ หรือสิ่งที่อยากจดจำ ✨"
                                        }
                                        readOnly={entries.find(e => e.entry_date === selectedDate && e.user_id !== currentUserId) ? true : false}
                                        rows={12}
                                        className={`w-full px-4 py-4 border-2 rounded-xl resize-none font-medium leading-relaxed shadow-sm ${
                                            entries.find(e => e.entry_date === selectedDate && e.user_id !== currentUserId)
                                                ? 'border-pink-300 bg-pink-50 text-gray-700 cursor-default'
                                                : 'border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-800 placeholder-gray-500'
                                        }`}
                                    />
                                    <div className="mt-2 text-sm text-gray-600 font-medium">
                                        {currentContent.length} ตัวอักษร
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-between items-center">
                                    {entries.find(e => e.entry_date === selectedDate && e.user_id === currentUserId) && (
                                        <button
                                            onClick={handleDelete}
                                            disabled={saving}
                                            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            <DeleteIcon />
                                        </button>
                                    )}
                                    <div className={!entries.find(e => e.entry_date === selectedDate && e.user_id === currentUserId) ? 'ml-auto' : ''}>
                                        {/* แสดงปุ่มบันทึกเฉพาะเมื่อไม่ใช่บันทึกของคู่ */}
                                        {!entries.find(e => e.entry_date === selectedDate && e.user_id !== currentUserId) && (
                                            <button
                                                onClick={handleSave}
                                                disabled={saving || !currentContent.trim()}
                                                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3 rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                                            >
                                                {saving ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        กำลังบันทึก...
                                                    </>
                                                ) : (
                                                    <>
                                                        <SaveIcon />
                                                        บันทึก
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
