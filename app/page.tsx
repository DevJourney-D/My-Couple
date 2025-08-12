// app/page.tsx
'use client'; // ต้องใช้ 'use client' เพื่อจัดการ State และ Form

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ไอคอนรูปหัวใจเล็กๆ สำหรับตกแต่ง
const HeartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-blue-600"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }

      // เก็บ token ใน localStorage ก่อน redirect
      if (data.token) {
        window.localStorage.setItem('auth_token', data.token);
      }

      // ถ้าสำเร็จ ให้พาไปหน้า dashboard
      router.push('/dashboard');

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-blue-50 p-4">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white rounded-2xl shadow-lg border border-blue-200">

        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <HeartIcon />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">
            Our Special Place
          </h1>
          <p className="mt-2 text-amber-600">
            ลงชื่อเข้าสู่พื้นที่ส่วนตัวของเรา
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="relative block w-full px-4 py-3 text-gray-900 placeholder-gray-500 border border-blue-200 rounded-xl appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Username"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-4 py-3 text-gray-900 placeholder-gray-500 border border-blue-200 rounded-xl appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="text-right text-sm">
            <Link href="/forgot-password" className="font-medium text-amber-600 hover:text-blue-600">
              ลืมรหัสผ่าน?
            </Link>
          </div>
          
          {/* แสดงข้อความ Error */}
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </div>
        </form>

        <div className="text-sm text-center pt-4 border-t border-blue-200">
          <p className="text-gray-600">
            ยังไม่มีบัญชี?{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-amber-600">
              ลงทะเบียนที่นี่
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
