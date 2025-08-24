'use client';

import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';

// =================================================================
// Interface definitions for Log data
// =================================================================
interface LogEntry {
    id: string;
    user_id: string;
    action: string;
    details: Record<string, unknown>;
    level: 'info' | 'warning' | 'error' | 'debug';
    created_at: string;
}

interface LogStats {
    total: number;
    info: number;
    warning: number;
    error: number;
    debug: number;
    today: number;
    lastWeek: number;
    byAction: Record<string, number>;
}

// =================================================================
// Icon Components
// =================================================================
const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const LogDocumentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/>
        <polyline points="1 20 1 14 7 14"/>
        <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
);

// =================================================================
// Main Logs Page Component
// =================================================================
export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState<LogStats | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<string>('all');
    const [selectedAction, setSelectedAction] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    // Fetch logs from API
    const loadLogs = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setError('กรุณาเข้าสู่ระบบก่อนดู logs');
                setIsLoading(false);
                return;
            }

            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
            });

            if (selectedLevel !== 'all') {
                queryParams.append('level', selectedLevel);
            }

            const response = await fetch(`/api/logs?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.log('Error response:', errorText);
                
                if (response.status === 401) {
                    setError('การยืนยันตัวตนหมดอายุ กรุณาเข้าสู่ระบบใหม่');
                    // Redirect to login after 2 seconds
                    setTimeout(() => {
                        window.location.href = '/auth/login';
                    }, 2000);
                    return;
                } else {
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
            }

            const data = await response.json();
            setLogs(data.logs || []);
            setTotalPages(data.totalPages || 1);
            
            // Calculate stats
            if (data.logs) {
                const statsData = calculateStats(data.logs);
                setStats(statsData);
            }

        } catch (error) {
            console.error('Error loading logs:', error);
            setError(`ไม่สามารถโหลดข้อมูล logs ได้: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, itemsPerPage, selectedLevel]);

    // Calculate statistics from logs
    const calculateStats = (logsData: LogEntry[]): LogStats => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const stats: LogStats = {
            total: logsData.length,
            info: 0,
            warning: 0,
            error: 0,
            debug: 0,
            today: 0,
            lastWeek: 0,
            byAction: {}
        };

        logsData.forEach(log => {
            // Count by level
            stats[log.level]++;

            // Count by action
            stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

            // Count by date
            const logDate = new Date(log.created_at);
            if (logDate >= today) {
                stats.today++;
            }
            if (logDate >= lastWeek) {
                stats.lastWeek++;
            }
        });

        return stats;
    };

    // Load logs when component mounts or filters change
    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedLevel, selectedAction]);

    // Helper functions
    const getLevelColor = (level: string) => {
        switch (level) {
            case 'info': return 'bg-blue-100 text-blue-800';
            case 'warning': return 'bg-yellow-100 text-yellow-800';
            case 'error': return 'bg-red-100 text-red-800';
            case 'debug': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'info': return 'ℹ️';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'debug': return '🐛';
            default: return '📝';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Filter logs by action if selected
    const filteredLogs = selectedAction === 'all' 
        ? logs 
        : logs.filter(log => log.action === selectedAction);

    if (isLoading && logs.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">กำลังโหลดข้อมูล logs...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 transition-colors">
                            <BackIcon />
                            <span className="font-medium">กลับหน้าหลัก</span>
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <LogDocumentIcon />
                            System Logs
                        </h1>
                    </div>
                    <button
                        onClick={loadLogs}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        <RefreshIcon />
                        รีเฟรช
                    </button>
                </header>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">❌</span>
                            <p className="font-medium">{error}</p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={loadLogs}
                                className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
                            >
                                ลองอีกครั้ง
                            </button>
                            {error.includes('เข้าสู่ระบบ') && (
                                <Link 
                                    href="/auth/login"
                                    className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded transition-colors"
                                >
                                    เข้าสู่ระบบ
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">📊 Total Logs</h3>
                            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">📅 Today</h3>
                            <p className="text-2xl font-bold text-green-600">{stats.today}</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">📈 Last 7 Days</h3>
                            <p className="text-2xl font-bold text-purple-600">{stats.lastWeek}</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">❌ Errors</h3>
                            <p className="text-2xl font-bold text-red-600">{stats.error}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">🔍 Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Log Level</label>
                            <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Levels</option>
                                <option value="info">ℹ️ Info ({stats?.info || 0})</option>
                                <option value="warning">⚠️ Warning ({stats?.warning || 0})</option>
                                <option value="error">❌ Error ({stats?.error || 0})</option>
                                <option value="debug">🐛 Debug ({stats?.debug || 0})</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                            <select
                                value={selectedAction}
                                onChange={(e) => setSelectedAction(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Actions</option>
                                {stats && Object.keys(stats.byAction).map(action => (
                                    <option key={action} value={action}>
                                        {action} ({stats.byAction[action]})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">รายการต่อหน้า</label>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-700">
                            📋 Logs ({filteredLogs.length})
                        </h3>
                        {totalPages > 1 && (
                            <div className="text-sm text-gray-600">
                                หน้า {currentPage} จาก {totalPages}
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls - Top */}
                    {totalPages > 1 && (
                        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ← ก่อนหน้า
                                </button>
                                
                                <span className="px-4 py-1 text-sm bg-blue-500 text-white rounded-lg">
                                    {currentPage} / {totalPages}
                                </span>
                                
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ถัดไป →
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Level
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Details
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(log.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(log.level)}`}>
                                                    {getLevelIcon(log.level)}
                                                    {log.level}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {log.action}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <details className="max-w-xs">
                                                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                                                        View Details
                                                    </summary>
                                                    <pre className="mt-2 text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-32">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                </details>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                            ไม่พบข้อมูล logs
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls - Bottom */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    แสดงรายการหน้า {currentPage} จากทั้งหมด {totalPages} หน้า
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        หน้าแรก
                                    </button>
                                    
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ← ก่อนหน้า
                                    </button>
                                    
                                    <span className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg">
                                        {currentPage} / {totalPages}
                                    </span>
                                    
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ถัดไป →
                                    </button>
                                    
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        หน้าสุดท้าย
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
