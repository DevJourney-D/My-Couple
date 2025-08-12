// app/dashboard/page.tsx
'use client'; // เปลี่ยนเป็น Client Component เพื่อใช้ State

import Link from 'next/link';
import React, { useState } from 'react'; // Import useState

// =================================================================
// ไอคอนสำหรับแต่ละฟีเจอร์ (เหมือนเดิม)
// =================================================================

const TimelineIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="2" x2="12" y2="3" />
    </svg>
);
const MathGameIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="8" y1="8" x2="16" y2="16" /><line x1="16" y1="8" x2="8" y2="16" />
    </svg>
);
const BucketListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" />
    </svg>
);
const JournalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
);
const AiChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);
const DateNightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
);
const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
);
const LogsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);
const PhotoGalleryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="9" cy="9" r="2"></circle>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
    </svg>
);
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

// =================================================================
// คอมโพเนนต์การ์ดสำหรับแต่ละฟีเจอร์
// =================================================================
interface FeatureCardProps {
    href: string;
    icon: React.ReactNode;
    title: string;
    description: string;
}

const FeatureCard = ({ href, icon, title, description }: FeatureCardProps) => (
    <Link href={href} className="group block">
        <div className="p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 h-full">
            <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl mb-4 shadow-md">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    </Link>
);

// =================================================================
// คอมโพเนนต์ใหม่: ส่วนของคำเชิญ
// =================================================================
const InvitationSection = () => {
    const [invitationCode, setInvitationCode] = useState<string | null>(null);
    const [inputCode, setInputCode] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // ดึง userId จาก token JWT
    function getUserIdFromToken() {
        try {
            const token = window.localStorage.getItem('auth_token');
            if (!token) {
                console.log('No token found in localStorage');
                return null;
            }
            console.log('Token found:', token.substring(0, 50) + '...');
            
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Decoded payload:', payload);
            
            const userId = payload.userId;
            console.log('Extracted userId:', userId, 'type:', typeof userId);
            
            return userId;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    // สร้างรหัสคำเชิญจริง
    const handleGenerateCode = async () => {
        setLoading(true);
        setMessage('');
        
        // Test: ใช้ userId จาก token หรือใช้ test value
        const userId = getUserIdFromToken();
        console.log('userId from token:', userId);
        
        // Temporary fix: ใช้ userId ที่รู้ว่ามีอยู่ในฐานข้อมูล (สำหรับทดสอบ)
        const testUserId = '4af5465-e46d-4020-ae2b-bc6b277bd7'; // ใช้ UUID format ที่ถูกต้อง
        const finalUserId = userId || testUserId;
        
        console.log('Using userId:', finalUserId);
        
        if (!finalUserId) {
            setMessage('ไม่พบข้อมูลผู้ใช้');
            setLoading(false);
            return;
        }
        console.log('Creating invitation for userId:', finalUserId); // Debug
        try {
            const res = await fetch('/api/invitation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: finalUserId }),
            });
            const data = await res.json();
            console.log('API Response:', res.status, data); // Debug
            if (res.ok && data.code) {
                setInvitationCode(data.code);
                setMessage('สร้างรหัสสำเร็จ!');
            } else {
                setMessage(data.error || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
        setLoading(false);
    };

    // ใช้รหัสคำเชิญเพื่อจับคู่
    const handleConnect = async () => {
        setLoading(true);
        setMessage('');
        const userId = getUserIdFromToken();
        if (!userId) {
            setMessage('ไม่พบข้อมูลผู้ใช้');
            setLoading(false);
            return;
        }
        console.log('Connecting userId:', userId, 'with code:', inputCode); // Debug
        try {
            const res = await fetch('/api/couple', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, code: inputCode }),
            });
            const data = await res.json();
            console.log('API Response:', res.status, data); // Debug
            if (res.ok) {
                setMessage(data.message || 'เชื่อมต่อสำเร็จ!');
                // อัปเดตสถานะการเชื่อมต่อ
                window.location.reload(); // รีเฟรชหน้าเพื่ออัปเดตสถานะ
            } else {
                setMessage(data.error || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
        setLoading(false);
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8 mb-8 text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">เชื่อมต่อกับคนรักของคุณ</h2>
            <p className="text-gray-600 mb-6">สร้างหรือใช้รหัสคำเชิญเพื่อเริ่มใช้งานฟีเจอร์ทั้งหมดด้วยกัน</p>
            {message && <div className="mb-4 text-blue-600 font-semibold">{message}</div>}
            <div className="grid sm:grid-cols-2 gap-6">
                {/* ฝั่งกรอกรหัส */}
                <div className="bg-blue-50 p-4 rounded-xl flex flex-col justify-center">
                    <h3 className="font-semibold text-gray-700 mb-2">มีรหัสคำเชิญแล้ว?</h3>
                    <input
                        type="text"
                        placeholder="กรอกรหัสที่นี่"
                        value={inputCode}
                        onChange={e => setInputCode(e.target.value)}
                        className="w-full px-4 py-3 text-center text-lg font-mono tracking-wider bg-white border-2 border-blue-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                    />
                    <button onClick={handleConnect} disabled={loading} className="w-full mt-2 px-4 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">
                        {loading ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ'}
                    </button>
                </div>

                {/* ฝั่งสร้างรหัส */}
                <div className="bg-amber-50 p-4 rounded-xl flex flex-col justify-center">
                    <h3 className="font-semibold text-gray-700 mb-2">ต้องการรหัสคำเชิญ?</h3>
                    {invitationCode ? (
                        <div className="text-center">
                            <p className="text-gray-600">แชร์รหัสนี้ให้คนรักของคุณ:</p>
                            <p className="font-mono text-2xl font-bold text-amber-600 my-2 tracking-widest bg-white p-2 rounded-lg">
                                {invitationCode}
                            </p>
                        </div>
                    ) : (
                        <button onClick={handleGenerateCode} disabled={loading} className="w-full px-4 py-3 text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors">
                            {loading ? 'กำลังสร้าง...' : 'สร้างรหัสของฉัน'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


// =================================================================
// หน้าหลัก (Dashboard)
// =================================================================
export default function DashboardPage() {
    // ในสถานการณ์จริง ค่านี้จะมาจากฐานข้อมูล
    const [isConnected, setIsConnected] = useState(false);
    const [partnerUsername, setPartnerUsername] = useState<string>('');
    const [currentUsername, setCurrentUsername] = useState<string>('');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // ดึง userId จาก token JWT
    function getUserIdFromToken() {
        try {
            const token = window.localStorage.getItem('auth_token');
            if (!token) {
                console.log('No token found in localStorage');
                return null;
            }
            console.log('Token found:', token.substring(0, 50) + '...');
            
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Decoded payload:', payload);
            
            const userId = payload.userId;
            console.log('Extracted userId:', userId, 'type:', typeof userId);
            
            return userId;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    // ตรวจสอบ token และสถานะการเชื่อมต่อเมื่อโหลดหน้า
    React.useEffect(() => {
        const token = window.localStorage.getItem('auth_token');
        if (!token) {
            window.location.href = '/';
            return;
        }
        
        // ดึง username ปัจจุบันจาก token
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.username) {
                setCurrentUsername(payload.username);
            }
        } catch (error) {
            console.error('Error decoding token for username:', error);
        }
        
        // ตรวจสอบสถานะการเชื่อมต่อ
        const checkStatus = async () => {
            const userId = getUserIdFromToken();
            if (!userId) return;

            try {
                const res = await fetch('/api/couple/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId }),
                });
                const data = await res.json();
                if (res.ok && data.isConnected) {
                    setIsConnected(true);
                    // ถ้ามีข้อมูลคู่ที่เชื่อมต่อ ให้เก็บ username ของเขา
                    if (data.partnerUsername) {
                        setPartnerUsername(data.partnerUsername);
                    }
                }
            } catch (error) {
                console.error('Error checking connection status:', error);
            }
        };
        
        checkStatus();
    }, []);

    // ฟังก์ชัน logout
    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = async () => {
        try {
            // เรียก logout API เพื่อล้าง cookies
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });
        } catch (error) {
            console.error('Error calling logout API:', error);
        } finally {
            // ล้าง localStorage และ redirect
            window.localStorage.removeItem('auth_token');
            window.location.href = '/';
        }
    };

    const cancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    const features = [
        { href: '/timeline', icon: <TimelineIcon />, title: 'ไทม์ไลน์ความรัก', description: 'บันทึกและย้อนดูความทรงจำดีๆ ของเรา' },
        { href: '/math-game', icon: <MathGameIcon />, title: 'เกมคณิตศาสตร์', description: 'มาลับสมอง ประลองปัญญากันหน่อย' },
        { href: '/bucket-list', icon: <BucketListIcon />, title: 'สิ่งที่อยากทำด้วยกัน', description: 'วางแผนและทำความฝันของเราให้เป็นจริง' },
        { href: '/journal', icon: <JournalIcon />, title: 'สมุดบันทึก', description: 'เขียนความรู้สึกและเรื่องราวถึงกันและกัน' },
        { href: '/ai-chat', icon: <AiChatIcon />, title: 'คุยกับ AI', description: 'เพื่อนคุยแก้เหงา ถามตอบได้ทุกเรื่อง' },
        { href: '/date-spinner', icon: <DateNightIcon />, title: 'วงล้อสุ่มเดท', description: 'ตัดสินใจไม่ได้? ให้วงล้อช่วยเลือกเดทให้' },
        { href: '/photo-gallery', icon: <PhotoGalleryIcon />, title: 'แกลลอรี่รูปภาพ', description: 'เก็บรวบรวมและแชร์ความทรงจำดีๆ ของเรา' },
        { href: '/couple-calendar', icon: <CalendarIcon />, title: 'ปฏิทินคู่รัก', description: 'จัดการเดทและครบรอบสำคัญของเรา' },
        { href: '/logs', icon: <LogsIcon />, title: '📊 App Logs', description: 'ดูประวัติการใช้งานและสถิติต่างๆ' },
    ];

    return (
        <main className="min-h-screen bg-blue-50 p-4 sm:p-8">
            <div className="max-w-5xl mx-auto">
                {/* ส่วนหัว */}
                <header className="flex justify-between items-center mb-8 sm:mb-12">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Our Dashboard</h1>
                        <p className="text-gray-500 mt-1">
                            {isConnected ? (
                                <span>
                                    ยินดีต้อนรับ <span className="font-semibold text-blue-600">{currentUsername}</span>
                                    {partnerUsername && (
                                        <span> และ <span className="font-semibold text-amber-600">{partnerUsername}</span></span>
                                    )} สู่พื้นที่ของเรา! 💕
                                </span>
                            ) : (
                                <span>สวัสดี <span className="font-semibold text-gray-700">{currentUsername}</span>! เลือกกิจกรรมที่อยากทำกันเลย!</span>
                            )}
                        </p>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-xl shadow hover:bg-gray-50 transition-colors">
                        <LogoutIcon />
                        <span className="hidden sm:inline">ออกจากระบบ</span>
                    </button>
                </header>

                {/* แสดงส่วนของคำเชิญถ้ายังไม่ได้เชื่อมต่อ */}
                {!isConnected && <InvitationSection />}

                {/* ตารางฟีเจอร์ (อาจจะซ่อนหรือแสดงผลจางๆ ถ้ายังไม่เชื่อมต่อ) */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${!isConnected ? 'opacity-40 pointer-events-none' : ''}`}>
                    {features.map((feature) => (
                        <FeatureCard key={feature.href} {...feature} />
                    ))}
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                            🚪 ยืนยันการออกจากระบบ
                        </h3>
                        <p className="text-gray-600 text-center mb-6">
                            คุณแน่ใจหรือไม่ที่จะออกจากระบบ?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={cancelLogout}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-bold"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="flex-1 px-4 py-2 text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors font-bold"
                            >
                                ออกจากระบบ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
