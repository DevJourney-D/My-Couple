// app/couple-calendar/page.tsx
'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';

// =================================================================
// ระบบ Logging น่ารักๆ
// =================================================================
const logUserAction = (action: string, details: Record<string, unknown> = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        page: 'couple-calendar',
        action,
        details,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
    };
    
    console.log('📅💕 Couple Calendar Log:', logEntry);
    
    try {
        const existingLogs = JSON.parse(localStorage.getItem('appLogs') || '[]');
        existingLogs.push(logEntry);
        if (existingLogs.length > 1000) {
            existingLogs.splice(0, existingLogs.length - 1000);
        }
        localStorage.setItem('appLogs', JSON.stringify(existingLogs));
    } catch (error) {
        console.error('Error saving log:', error);
    }
};

// =================================================================
// ไอคอนสุดน่ารัก 💖
// =================================================================
const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const HeartIcon = ({ className = "text-pink-500 animate-pulse" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const SparkleIcon = ({ delay = "0s" }) => (
    <span 
        className="text-2xl animate-bounce inline-block"
        style={{ animationDelay: delay }}
    >
        ✨
    </span>
);

// =================================================================
// Interface สำหรับกิจกรรมคู่รัก
// =================================================================
interface CoupleEvent {
    id: number;
    title: string;
    date: string;
    description?: string;
    type: 'anniversary' | 'date' | 'special' | 'birthday' | 'surprise';
    emoji: string;
    color: string;
    created_by: string;
    created_at: string;
}

// =================================================================
// ปฏิทินคู่รักสุดน่ารัก 💕✨
// =================================================================
export default function CoupleCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CoupleEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<CoupleEvent>>({ 
        title: '', 
        date: '', 
        description: '', 
        type: 'date',
        emoji: '💕',
        color: 'from-pink-400 to-rose-500'
    });
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info';
        message: string;
    } | null>(null);

    // แสดง notification
    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    // ดึงข้อมูลกิจกรรม
    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                showNotification('error', 'ไม่พบข้อมูลการเข้าสู่ระบบ');
                return;
            }

            // ดึง current user ID จาก token
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentUserId(payload.userId);

            const response = await fetch('/api/couple-calendar', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setEvents(data.events || []);
            } else {
                const errorData = await response.json();
                showNotification('error', errorData.error || 'ไม่สามารถดึงข้อมูลได้');
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            showNotification('error', 'เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    // Log เมื่อเข้าหน้าครั้งแรก
    useEffect(() => {
        fetchEvents();
        logUserAction('page_view', {
            timestamp: new Date().toISOString(),
            currentMonth: currentDate.toISOString().substring(0, 7)
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Log เมื่อเปลี่ยนเดือน
    useEffect(() => {
        logUserAction('month_change', {
            currentMonth: currentDate.toISOString().substring(0, 7),
            totalEvents: events.length
        });
    }, [currentDate, events.length]);

    // ฟังก์ชันช่วยเหลือสำหรับปฏิทิน
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const today = new Date();
    
    const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

    const eventTypeConfigs = {
        anniversary: { emoji: '💕', color: 'from-pink-400 to-rose-500', name: 'วันครบรอบ' },
        birthday: { emoji: '🎂', color: 'from-purple-400 to-pink-500', name: 'วันเกิด' },
        date: { emoji: '🌹', color: 'from-rose-400 to-red-500', name: 'เดทน่ารัก' },
        special: { emoji: '✨', color: 'from-yellow-400 to-orange-500', name: 'วันพิเศษ' },
        surprise: { emoji: '🎁', color: 'from-indigo-400 to-purple-500', name: 'เซอร์ไพรส์' }
    };

    const getEventsForDate = (day: number) => {
        const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(event => event.date === dateString);
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
        
        logUserAction('navigate_month', {
            direction,
            newMonth: newDate.toISOString().substring(0, 7)
        });
    };

    const handleAddEvent = async () => {
        if (newEvent.title && newEvent.date && newEvent.type) {
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    showNotification('error', 'ไม่พบข้อมูลการเข้าสู่ระบบ');
                    return;
                }

                const config = eventTypeConfigs[newEvent.type];
                const response = await fetch('/api/couple-calendar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: newEvent.title,
                        date: newEvent.date,
                        description: newEvent.description || '',
                        type: newEvent.type,
                        emoji: config.emoji,
                        color: config.color
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    setEvents(prev => [...prev, result.event]);
                    setNewEvent({ title: '', date: '', description: '', type: 'date', emoji: '💕', color: 'from-pink-400 to-rose-500' });
                    setShowAddEvent(false);
                    showNotification('success', 'เพิ่มกิจกรรมเรียบร้อยแล้ว 💕');
                    
                    logUserAction('add_event', {
                        eventTitle: result.event.title,
                        eventDate: result.event.date,
                        eventType: result.event.type
                    });
                } else {
                    const errorData = await response.json();
                    showNotification('error', errorData.error || 'ไม่สามารถเพิ่มกิจกรรมได้');
                }
            } catch (error) {
                console.error('Error adding event:', error);
                showNotification('error', 'เกิดข้อผิดพลาดในการเพิ่มกิจกรรม');
            }
        } else {
            showNotification('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
        }
    };

    // ลบกิจกรรม
    const deleteEvent = async (eventId: number) => {
        if (!confirm('ต้องการลบกิจกรรมนี้หรือไม่?')) return;
        
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                showNotification('error', 'ไม่พบข้อมูลการเข้าสู่ระบบ');
                return;
            }

            const response = await fetch(`/api/couple-calendar/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setEvents(prev => prev.filter(event => event.id !== eventId));
                showNotification('success', 'ลบกิจกรรมเรียบร้อยแล้ว');
            } else {
                const errorData = await response.json();
                showNotification('error', errorData.error || 'ไม่สามารถลบกิจกรรมได้');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            showNotification('error', 'เกิดข้อผิดพลาดในการลบกิจกรรม');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-cyan-50 p-4 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-black">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 via-rose-50 to-cyan-50 relative overflow-hidden">
            {/* พื้นหลังน่ารักสุดๆ */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(25)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute animate-float opacity-30"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 3}s`,
                            fontSize: `${10 + Math.random() * 12}px`,
                        }}
                    >
                        {['💕', '💖', '💗', '💘', '💝', '🌸', '✨', '🌺', '🦋', '🎀', '💐', '🌷', '🌹', '💜', '💛'][Math.floor(Math.random() * 15)]}
                    </div>
                ))}
            </div>

            <div className="container mx-auto px-4 py-6 relative z-10">
                {/* Header สุดน่ารัก */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/dashboard" className="flex items-center space-x-3 text-pink-600 hover:text-pink-800 transition-all bg-white/80 backdrop-blur-sm rounded-full px-5 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 border border-pink-200">
                        <BackIcon />
                        <span className="font-bold text-lg">กลับหน้าหลัก</span>
                        <HeartIcon className="text-pink-400" />
                    </Link>
                    
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <SparkleIcon delay="0s" />
                            <CalendarIcon />
                            <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-pink-500 via-purple-500 via-rose-500 to-blue-500 bg-clip-text text-transparent">
                                Couple Calendar
                            </h1>
                            <CalendarIcon />
                            <SparkleIcon delay="0.5s" />
                        </div>
                        <p className="text-xl text-gray-600 font-bold mb-2">ปฏิทินความรักสำหรับคู่รักน้อย 💖</p>
                        <p className="text-lg text-gray-500 font-medium mb-2">คุณและคู่ของคุณสามารถเห็นปฏิทินร่วมกันได้ 👫💕</p>
                        <div className="flex items-center justify-center gap-3 text-lg">
                            <SparkleIcon delay="1s" />
                            <span className="text-gray-500 font-medium">สร้างความทรงจำดีๆ ร่วมกัน</span>
                            <SparkleIcon delay="1.5s" />
                        </div>
                    </div>
                    
                    <button
                        onClick={() => setShowAddEvent(true)}
                        className="flex items-center space-x-3 bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-2xl transform hover:scale-110 transition-all border-2 border-white font-bold"
                    >
                        <PlusIcon />
                        <span>เพิ่มกิจกรรม</span>
                        <HeartIcon className="text-pink-200" />
                    </button>
                </div>

                {/* Calendar Section สุดน่ารัก */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border-4 border-pink-200 relative overflow-hidden">
                    {/* พื้นหลังน่ารักใน Calendar */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-purple-100"></div>
                    </div>
                    
                    <div className="relative z-10">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-8">
                            <button
                                onClick={() => navigateMonth('prev')}
                                className="p-4 bg-gradient-to-r from-pink-400 via-purple-400 to-rose-400 text-white rounded-full hover:from-pink-500 hover:via-purple-500 hover:to-rose-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-110 border-2 border-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            
                            <div className="text-center">
                                <h2 className="text-4xl font-black bg-gradient-to-r from-pink-600 via-purple-600 to-rose-600 bg-clip-text text-transparent mb-2">
                                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </h2>
                                <div className="flex items-center justify-center gap-3">
                                    <HeartIcon className="text-pink-500" />
                                    <span className="text-gray-600 font-bold text-lg">ปฏิทินแห่งความรัก</span>
                                    <HeartIcon className="text-purple-500" />
                                </div>
                            </div>
                            
                            <button
                                onClick={() => navigateMonth('next')}
                                className="p-4 bg-gradient-to-r from-pink-400 via-purple-400 to-rose-400 text-white rounded-full hover:from-pink-500 hover:via-purple-500 hover:to-rose-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-110 border-2 border-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Days of week header */}
                        <div className="grid grid-cols-7 gap-3 mb-6">
                            {dayNames.map((day, index) => (
                                <div key={day} className={`text-center font-black py-4 rounded-2xl text-lg shadow-md ${
                                    index === 0 ? 'bg-gradient-to-r from-red-200 to-rose-300 text-red-700' : 
                                    index === 6 ? 'bg-gradient-to-r from-blue-200 to-indigo-300 text-blue-700' : 
                                    'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700'
                                }`}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-3">
                            {/* Empty cells */}
                            {Array.from({ length: firstDayOfMonth }, (_, i) => (
                                <div key={`empty-${i}`} className="h-28"></div>
                            ))}

                            {/* Calendar days */}
                            {Array.from({ length: daysInMonth }, (_, i) => {
                                const day = i + 1;
                                const dayEvents = getEventsForDate(day);
                                const isToday = today.getDate() === day && 
                                               today.getMonth() === currentDate.getMonth() && 
                                               today.getFullYear() === currentDate.getFullYear();
                                
                                return (
                                    <div
                                        key={day}
                                        className={`h-28 p-3 rounded-2xl border-3 transition-all cursor-pointer hover:shadow-xl transform hover:scale-105 relative ${
                                            isToday 
                                                ? 'bg-gradient-to-br from-pink-200 via-purple-200 to-rose-200 border-pink-500 shadow-xl ring-4 ring-pink-300 ring-opacity-50'
                                                : dayEvents.length > 0
                                                    ? 'bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 border-rose-400 hover:from-rose-100 hover:via-pink-100 hover:to-purple-100'
                                                    : 'bg-white border-gray-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-pink-50'
                                        }`}
                                        onClick={() => {
                                            const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                            setNewEvent({ ...newEvent, date: dateString });
                                            setShowAddEvent(true);
                                            logUserAction('select_date', { selectedDate: dateString });
                                        }}
                                    >
                                        {/* วันที่ */}
                                        <div className={`text-lg font-black mb-2 flex items-center gap-1 ${
                                            isToday ? 'text-pink-800' : 'text-gray-700'
                                        }`}>
                                            {day}
                                            {isToday && <span className="text-pink-500 animate-bounce">💖</span>}
                                        </div>
                                        
                                        {/* Events */}
                                        <div className="flex-1 overflow-hidden">
                                            {dayEvents.slice(0, 2).map((event) => (
                                                <div
                                                    key={event.id}
                                                    className={`text-xs px-2 py-1 rounded-lg mb-1 truncate border-2 bg-gradient-to-r ${event.color} text-white shadow-md font-bold`}
                                                    title={event.title}
                                                >
                                                    <span className="mr-1">{event.emoji}</span>
                                                    {event.title}
                                                </div>
                                            ))}
                                            {dayEvents.length > 2 && (
                                                <div className="text-xs text-purple-600 font-black bg-purple-100 px-2 py-1 rounded-lg border border-purple-300">
                                                    +{dayEvents.length - 2} อีก... ✨
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Cute corner decoration */}
                                        {dayEvents.length > 0 && (
                                            <div className="absolute top-1 right-1">
                                                <HeartIcon className="text-pink-400 w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Event List Section */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-4 border-purple-200 relative overflow-hidden">
                    {/* พื้นหลังน่ารัก */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100"></div>
                    </div>
                    
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent mb-6 flex items-center justify-center gap-3">
                            <span className="text-3xl animate-bounce">🗓️</span>
                            กิจกรรมของเราในเดือนนี้
                            <span className="text-3xl animate-bounce" style={{ animationDelay: '0.5s' }}>💕</span>
                        </h3>
                        
                        {events.filter(event => {
                            const eventDate = new Date(event.date);
                            return eventDate.getMonth() === currentDate.getMonth() && 
                                   eventDate.getFullYear() === currentDate.getFullYear();
                        }).length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2">
                                {events
                                    .filter(event => {
                                        const eventDate = new Date(event.date);
                                        return eventDate.getMonth() === currentDate.getMonth() && 
                                               eventDate.getFullYear() === currentDate.getFullYear();
                                    })
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                    .map((event) => (
                                        <div key={event.id} className={`p-6 rounded-3xl border-3 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 relative overflow-hidden bg-gradient-to-r ${event.color} text-white`}>
                                            {/* Cute sparkle decorations */}
                                            <div className="absolute top-2 right-2 text-lg opacity-70 animate-ping">✨</div>
                                            <div className="absolute bottom-2 left-2 text-sm opacity-50">💖</div>
                                            
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-3xl animate-bounce">{event.emoji}</span>
                                                        <h4 className="text-xl font-black">{event.title}</h4>
                                                    </div>
                                                    {/* ปุ่มลบ - แสดงเฉพาะรายการของตัวเอง */}
                                                    {event.created_by === currentUserId && (
                                                        <button
                                                            onClick={() => deleteEvent(event.id)}
                                                            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"></path>
                                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {/* แสดงผู้สร้าง */}
                                                <p className="text-sm mb-2 opacity-90">
                                                    {event.created_by === currentUserId ? '📝 คุณสร้าง' : '💕 คู่ของคุณสร้าง'}
                                                </p>
                                                
                                                <p className="text-lg font-bold mb-2 flex items-center gap-2">
                                                    <span className="text-xl">📅</span>
                                                    {new Date(event.date).toLocaleDateString('th-TH', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                {event.description && (
                                                    <p className="text-base opacity-90 flex items-center gap-2">
                                                        <span className="text-lg">💭</span>
                                                        {event.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="text-9xl mb-8 animate-bounce">📅</div>
                                <h4 className="text-3xl font-black text-gray-600 mb-4">ยังไม่มีกิจกรรมในเดือนนี้</h4>
                                <p className="text-gray-500 mb-10 text-xl">มาวางแผนทำกิจกรรมน่ารักๆ ด้วยกันกันเถอะ! 💕</p>
                                <button
                                    onClick={() => setShowAddEvent(true)}
                                    className="bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 text-white px-10 py-5 rounded-full font-black text-xl hover:from-pink-600 hover:via-purple-600 hover:to-rose-600 transition-all shadow-xl hover:shadow-2xl transform hover:scale-110 border-2 border-white"
                                >
                                    เพิ่มกิจกรรมแรก ✨
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Event Modal สุดน่ารัก */}
            {showAddEvent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-10 max-w-lg w-full shadow-2xl border-4 border-pink-200 relative overflow-hidden">
                        {/* พื้นหลังน่ารักใน Modal */}
                        <div className="absolute inset-0 opacity-5">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-200 to-purple-200"></div>
                            {[...Array(15)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute animate-pulse"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        fontSize: '1.5rem',
                                        animationDelay: `${Math.random() * 3}s`,
                                    }}
                                >
                                    💖
                                </div>
                            ))}
                        </div>
                        
                        <div className="relative z-10">
                            <h3 className="text-4xl font-black bg-gradient-to-r from-pink-600 via-purple-600 to-rose-600 bg-clip-text text-transparent mb-8 text-center flex items-center justify-center gap-4">
                                <SparkleIcon delay="0s" />
                                เพิ่มกิจกรรมใหม่
                                <SparkleIcon delay="0.5s" />
                            </h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-lg font-black text-gray-700 mb-3 flex items-center gap-2">
                                        <span className="text-2xl animate-bounce">📝</span>
                                        ชื่อกิจกรรม
                                    </label>
                                    <input
                                        type="text"
                                        value={newEvent.title || ''}
                                        onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                                        className="w-full px-5 py-4 border-3 border-pink-300 rounded-2xl focus:ring-4 focus:ring-pink-200 focus:border-pink-500 transition-all font-bold text-lg"
                                        placeholder="เช่น เดทดูหนัง, วันครบรอบ, วันเกิด... 💕"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-lg font-black text-gray-700 mb-3 flex items-center gap-2">
                                        <span className="text-2xl animate-bounce">📅</span>
                                        วันที่
                                    </label>
                                    <input
                                        type="date"
                                        value={newEvent.date || ''}
                                        onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                                        className="w-full px-5 py-4 border-3 border-pink-300 rounded-2xl focus:ring-4 focus:ring-pink-200 focus:border-pink-500 transition-all font-bold text-lg"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-lg font-black text-gray-700 mb-3 flex items-center gap-2">
                                        <span className="text-2xl animate-bounce">🎨</span>
                                        ประเภทกิจกรรม
                                    </label>
                                    <select
                                        value={newEvent.type || 'date'}
                                        onChange={(e) => setNewEvent({...newEvent, type: e.target.value as CoupleEvent['type']})}
                                        className="w-full px-5 py-4 border-3 border-pink-300 rounded-2xl focus:ring-4 focus:ring-pink-200 focus:border-pink-500 transition-all font-bold text-lg"
                                    >
                                        <option value="date">🌹 เดทน่ารัก</option>
                                        <option value="anniversary">💕 วันครบรอบ</option>
                                        <option value="birthday">🎂 วันเกิด</option>
                                        <option value="special">✨ วันพิเศษ</option>
                                        <option value="surprise">🎁 เซอร์ไพรส์</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-lg font-black text-gray-700 mb-3 flex items-center gap-2">
                                        <span className="text-2xl animate-bounce">💭</span>
                                        รายละเอียด (ไม่บังคับ)
                                    </label>
                                    <textarea
                                        value={newEvent.description || ''}
                                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                                        className="w-full px-5 py-4 border-3 border-pink-300 rounded-2xl focus:ring-4 focus:ring-pink-200 focus:border-pink-500 transition-all font-bold"
                                        rows={4}
                                        placeholder="เล่าเรื่องราวหรือแผนสำหรับวันนี้... 💖"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-5 mt-10">
                                <button
                                    onClick={() => setShowAddEvent(false)}
                                    className="flex-1 px-6 py-4 bg-gray-300 text-gray-700 rounded-2xl font-black text-lg hover:bg-gray-400 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleAddEvent}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 text-white rounded-2xl font-black text-lg hover:from-pink-600 hover:via-purple-600 hover:to-rose-600 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 border-2 border-white"
                                >
                                    เพิ่มกิจกรรม ✨
                                </button>
                            </div>
                        </div>
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

            {/* Custom CSS for cute animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-25px) rotate(15deg); }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
}
