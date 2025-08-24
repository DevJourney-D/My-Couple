// app/timeline/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';
import { logUserAction } from '@/utils/logger';

// =================================================================
// ไอคอนต่างๆ
// =================================================================
const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

// Interface สำหรับโพสต์
interface TimelinePost {
  id: number;
  title: string;
  content?: string;
  event_date: string;
  image_url?: string;
  created_at: string;
  user_id: string;
  custom_users?: {
    username: string;
  };
}

// =================================================================
// หน้าไทม์ไลน์
// =================================================================
export default function TimelinePage() {
    const [posts, setPosts] = useState<TimelinePost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Log page view
    useEffect(() => {
        logUserAction('timeline', 'page_view', {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
        });
    }, []);

    const loadPosts = useCallback(async (page: number = 1, append: boolean = false) => {
        try {
            setError(null);
            const token = localStorage.getItem('auth_token');
            if (!token) {
                console.error('No auth token found - please login again');
                setError('กรุณาเข้าสู่ระบบก่อน');
                return;
            }

            if (append) {
                setIsLoadingMore(true);
                logUserAction('timeline', 'load_more_posts', {
                    page: page,
                    current_posts_count: posts.length
                });
            } else {
                logUserAction('timeline', 'load_posts', {
                    page: page
                });
            }

            const response = await fetch(`/api/timeline?page=${page}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                // Token หมดอายุ
                localStorage.removeItem('auth_token');
                console.error('Token expired - please login again');
                setError('เซสชันหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
                return;
            }

            if (response.ok) {
                const data = await response.json();
                
                if (append) {
                    setPosts(prevPosts => [...prevPosts, ...(data.posts || [])]);
                } else {
                    setPosts(data.posts || []);
                }

                // อัปเดต pagination info
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages);
                    setCurrentPage(page);
                }
            } else {
                console.error('Failed to load posts');
                setError('ไม่สามารถโหลดโพสต์ได้');
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
            if (append) setIsLoadingMore(false);
        }
    }, [posts]);

    // Load timeline posts on component mount
    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    // โหลดโพสต์เพิ่มเติม
    const loadMorePosts = async () => {
        if (currentPage < totalPages && !isLoadingMore) {
            await loadPosts(currentPage + 1, true);
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
        <div className="min-h-screen bg-amber-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200 px-4 py-4">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <Link href="/dashboard" className="text-amber-600 hover:text-amber-700 transition-colors">
                        <BackIcon />
                    </Link>
                                        <h1 className="text-xl font-bold text-blue-700">
                        💕 ไทม์ไลน์ความรัก
                    </h1>
                    <div className="w-6"></div> {/* Spacer */}
                </div>
            </div>

            {/* Timeline Content */}
            <div className="px-4 py-6 max-w-4xl mx-auto">
                {loading ? (
                    <div className="text-center py-16">
                        <div className="text-4xl mb-4">⏳</div>
                        <p className="text-gray-500">กำลังโหลดความทรงจำ...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h3 className="text-lg font-semibold text-red-600 mb-2">เกิดข้อผิดพลาด</h3>
                        <p className="text-gray-500 mb-6">{error}</p>
                        <button
                            onClick={() => {
                                setError(null);
                                loadPosts();
                            }}
                            className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-all duration-200 shadow-lg"
                        >
                            ลองใหม่อีกครั้ง
                        </button>
                    </div>
                ) : posts.length > 0 ? (
                    <div className="relative">
                        {/* Center timeline line */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-blue-300 h-full"></div>
                        
                        {posts.map((post, index) => {
                            const isLeft = index % 2 === 0;
                            return (
                                <div key={post.id} className={`relative mb-12 flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
                                    {/* Timeline point */}
                                    <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center z-10">
                                        <HeartIcon />
                                    </div>
                                    
                                    {/* Memory Card */}
                                    <div className={`w-5/12 ${isLeft ? 'mr-auto pr-8' : 'ml-auto pl-8'}`}>
                                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-pink-100 relative">
                                            {/* Speech bubble arrow */}
                                            <div className={`absolute top-6 ${isLeft ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'} w-0 h-0 border-l-8 border-r-8 border-t-8 ${isLeft ? 'border-l-transparent border-r-white' : 'border-l-white border-r-transparent'} border-t-transparent`}></div>
                                            
                                            <div className="mb-3">
                                                <h3 className="text-lg font-bold text-gray-800 mb-1">{post.title}</h3>
                                                {post.custom_users?.username && (
                                                    <p className="text-sm text-pink-600 font-medium">
                                                        โดย {post.custom_users.username}
                                                    </p>
                                                )}
                                                <span className="text-sm text-purple-600 font-medium">{formatDate(post.event_date)}</span>
                                            </div>
                                            
                                            {post.content && (
                                                <p className="text-gray-600 mb-4 leading-relaxed">{post.content}</p>
                                            )}
                                            
                                            {post.image_url && (
                                                <div className="rounded-xl overflow-hidden mb-3">
                                                    <Image 
                                                        src={post.image_url} 
                                                        alt={post.title} 
                                                        width={400} 
                                                        height={300} 
                                                        className="rounded-lg w-full h-auto object-cover"
                                                        unoptimized={true}
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            
                                            <div className="text-xs text-gray-400">
                                                เพิ่มเมื่อ {formatDate(post.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Load More Button */}
                        {currentPage < totalPages && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={loadMorePosts}
                                    disabled={isLoadingMore}
                                    className="px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
                                            กำลังโหลด...
                                        </>
                                    ) : (
                                        `โหลดความทรงจำเพิ่มเติม (${totalPages - currentPage} หน้าเหลือ)`
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">💭</div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">ยังไม่มีความทรงจำ</h3>
                        <p className="text-gray-500">ยังไม่มีโพสต์ในไทม์ไลน์</p>
                    </div>
                )}
            </div>
        </div>
    );
}