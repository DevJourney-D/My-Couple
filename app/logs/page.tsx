'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { getAppLogs, clearAppLogs, getLogStats, LogEntry } from '../../utils/logViewer';

const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const LogIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
        <path d="m10 11 0 6"></path>
        <path d="m14 11 0 6"></path>
        <path d="M5 6l1-2a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1l1 2"></path>
    </svg>
);

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState<{
        total: number;
        byPage: Record<string, number>;
        byAction: Record<string, number>;
        lastWeek: number;
        today: number;
    } | null>(null);
    const [selectedPage, setSelectedPage] = useState<string>('all');
    const [selectedAction, setSelectedAction] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50); // แสดง 50 รายการต่อหน้า

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = () => {
        setIsLoading(true);
        try {
            const allLogs = getAppLogs();
            const logStats = getLogStats();
            setLogs(allLogs);
            setStats(logStats);
        } catch (error) {
            console.error('Error loading logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearLogs = () => {
        if (confirm('คุณแน่ใจหรือไม่ที่จะลบ logs ทั้งหมด?')) {
            clearAppLogs();
            loadLogs();
        }
    };

    const getPageIcon = (page: string) => {
        switch (page) {
            case 'math-game': return '🧮';
            case 'ai-chat': return '🤖';
            case 'date-spinner': return '🎡';
            case 'timeline': return '📝';
            case 'journal': return '📖';
            case 'bucket-list': return '🎯';
            case 'forgot-password': return '🔑';
            case 'register': return '📝';
            case 'login': return '🔐';
            default: return '📄';
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'page_view': return 'bg-blue-100 text-blue-800';
            case 'user_interaction': return 'bg-green-100 text-green-800';
            case 'error': return 'bg-red-100 text-red-800';
            case 'success': return 'bg-emerald-100 text-emerald-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredLogs = logs.filter(log => {
        const pageMatch = selectedPage === 'all' || log.page === selectedPage;
        const actionMatch = selectedAction === 'all' || log.action === selectedAction;
        return pageMatch && actionMatch;
    });

    // เรียงลำดับ logs จากใหม่ไปเก่า และคำนวณ pagination
    const sortedLogs = filteredLogs.reverse();
    const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedLogs = sortedLogs.slice(startIndex, endIndex);

    // Reset หน้าเมื่อ filter เปลี่ยน
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedPage, selectedAction]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-100 to-pink-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-100 to-pink-100 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 bg-white/50 px-3 py-2 rounded-lg">
                            <BackIcon />
                            <span className="font-medium">กลับหน้าหลัก</span>
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <LogIcon />
                            📊 App Logs Viewer
                        </h1>
                    </div>
                    <button
                        onClick={handleClearLogs}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        <TrashIcon />
                        ลบ Logs ทั้งหมด
                    </button>
                </header>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">📊 Total Logs</h3>
                            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">📅 Today</h3>
                            <p className="text-3xl font-bold text-green-600">{stats.today}</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">📈 Last 7 Days</h3>
                            <p className="text-3xl font-bold text-purple-600">{stats.lastWeek}</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">📄 Pages</h3>
                            <p className="text-3xl font-bold text-pink-600">{Object.keys(stats.byPage).length}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg mb-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">🔍 Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">หน้า</label>
                            <select
                                value={selectedPage}
                                onChange={(e) => setSelectedPage(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                            >
                                <option value="all">All Pages</option>
                                {stats && Object.keys(stats.byPage).map(page => (
                                    <option key={page} value={page}>
                                        {getPageIcon(page)} {page} ({stats.byPage[page]})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                            <select
                                value={selectedAction}
                                onChange={(e) => setSelectedAction(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                            >
                                <option value="all">All Actions</option>
                                {stats && Object.keys(stats.byAction).map(action => (
                                    <option key={action} value={action}>
                                        {action} ({stats.byAction[action]})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-700">
                            📋 Logs ({filteredLogs.length})
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">รายการต่อหน้า:</label>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value={200}>200</option>
                                </select>
                            </div>
                            {totalPages > 1 && (
                                <div className="text-sm text-gray-600">
                                    หน้า {currentPage} จาก {totalPages}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pagination Controls - Top */}
                    {totalPages > 1 && (
                        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ← ก่อนหน้า
                                </button>
                                
                                <div className="flex items-center gap-2">
                                    {/* แสดงหมายเลขหน้า */}
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = index + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = index + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + index;
                                        } else {
                                            pageNum = currentPage - 2 + index;
                                        }
                                        
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-3 py-1 text-sm rounded-lg ${
                                                    currentPage === pageNum
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        Page
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
                                {paginatedLogs.map((log, index) => (
                                    <tr key={startIndex + index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(log.timestamp).toLocaleString('th-TH')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className="flex items-center gap-2">
                                                {getPageIcon(log.page)}
                                                {log.page}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <details className="max-w-xs">
                                                <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                                    View Details
                                                </summary>
                                                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </details>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls - Bottom */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    แสดงรายการ {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} จาก {filteredLogs.length} รายการ
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

                    {filteredLogs.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📋</div>
                            <p className="text-gray-500 text-lg font-medium">ไม่พบ logs ที่ตรงกับเงื่อนไข</p>
                            <p className="text-gray-400 text-sm mt-2">ลองเปลี่ยน filter หรือล้าง filter ทั้งหมด</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
