'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [credentials, setCredentials] = useState({
        email: 'test@example.com',
        password: 'password123'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('auth_token', data.token);
                router.push('/dashboard');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        } finally {
            setLoading(false);
        }
    };

    // สำหรับการทดสอบ - สร้าง token แบบชั่วคราว
    const handleTestLogin = () => {
        const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0YTZmNTRlNS1lNDZkLTQwMjAtYWEyMC1iZWRkMmI3YTdiZDciLCJjb3VwbGVJZCI6InRlc3QiLCJpYXQiOjE3MzQ5Nzc5NDUsImV4cCI6MTczNTA2NDM0NX0.eyjlc2VSWUhLJmPX5TqfgXVC39.eyjlc2VSWUhLJmPX5TqfgXVC39';
        localStorage.setItem('auth_token', testToken);
        router.push('/photo-gallery');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-cyan-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">เข้าสู่ระบบ</h1>
                
                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                        <input
                            type="email"
                            value={credentials.email}
                            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
                        <input
                            type="password"
                            value={credentials.password}
                            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all font-medium"
                    >
                        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                        onClick={handleTestLogin}
                        className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-all font-medium"
                    >
                        ใช้ Test Token (สำหรับทดสอบ)
                    </button>
                </div>
            </div>
        </div>
    );
}
