// app/forgot-password/page.tsx
'use client'; // ต้องใช้ 'use client' เพื่อให้ฟังก์ชันในปุ่มทำงานได้

import Link from 'next/link';
import { useState, useEffect } from 'react'; // Import useState และ useEffect

// =================================================================
// ระบบ Logging
// =================================================================
const logUserAction = (action: string, details: Record<string, unknown> = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        page: 'forgot-password',
        action,
        details,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
    };
    
    console.log('🔑 Forgot Password Log:', logEntry);
    
    // เก็บ log ใน localStorage
    try {
        const existingLogs = JSON.parse(localStorage.getItem('appLogs') || '[]');
        existingLogs.push(logEntry);
        // เก็บแค่ 1000 logs ล่าสุด
        if (existingLogs.length > 1000) {
            existingLogs.splice(0, existingLogs.length - 1000);
        }
        localStorage.setItem('appLogs', JSON.stringify(existingLogs));
    } catch (error) {
        console.error('Error saving log:', error);
    }
};

// ไอคอนสำหรับปุ่มคัดลอก
const ClipboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
);

// ไอคอนสำหรับแจ้งเตือน
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);


export default function ForgotPasswordPage() {
    const email = 'devj.contact@gmail.com';
    const [isCopied, setIsCopied] = useState(false); // สร้าง state สำหรับควบคุมการแสดงผล

    // Log เมื่อเข้าหน้าครั้งแรก
    useEffect(() => {
        logUserAction('page_view', {
            timestamp: new Date().toISOString()
        });
    }, []);

    const handleCopy = () => {
        // Log การคลิกปุ่มคัดลอก
        logUserAction('copy_email', {
            email,
            timestamp: new Date().toISOString()
        });
        
        // สร้าง input ชั่วคราวเพื่อใช้ copy to clipboard
        const textarea = document.createElement('textarea');
        textarea.value = email;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        // แสดงการแจ้งเตือนและซ่อนหลังจาก 3 วินาที
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 3000);
        
        // Log การแสดงผลสำเร็จ
        logUserAction('copy_success', {
            email,
            timestamp: new Date().toISOString()
        });
    };

    return (
        <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-pink-100 p-4">

            {/* Notification Toast: ส่วนของการแจ้งเตือนที่สวยงาม */}
            <div
                className={`fixed top-5 right-5 flex items-center gap-3 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg transition-all duration-500 ease-in-out
          ${isCopied ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
        `}
            >
                <CheckIcon />
                <span>คัดลอกอีเมลแล้ว!</span>
            </div>

            <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white rounded-2xl shadow-lg text-center">

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    ลืมรหัสผ่าน?
                </h1>

                <p className="text-gray-600">
                    ไม่ต้องกังวล! กรุณาติดต่อผู้ดูแลระบบเพื่อทำการรีเซ็ตรหัสผ่านของคุณ
                </p>

                <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-gray-700">อีเมลสำหรับติดต่อ:</p>
                    <p className="font-mono text-lg text-blue-600 my-2">{email}</p>
                    <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        <ClipboardIcon />
                        คัดลอกอีเมล
                    </button>
                </div>

                <div className="text-sm">
                    <Link href="/" className="font-medium text-pink-500 hover:text-pink-600">
                        &larr; กลับไปหน้าเข้าสู่ระบบ
                    </Link>
                </div>

            </div>
        </main>
    );
}
