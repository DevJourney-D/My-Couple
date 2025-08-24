// app/photo-gallery/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';
import { logUserAction } from '../../utils/logger';

// =================================================================
// Types & Interfaces
// =================================================================
interface Photo {
    id: number;
    title: string;
    description?: string;
    image_url: string;
    upload_date: string;
    tags?: string[];
    created_by: string;
    username: string;
}

interface Notification {
    type: 'success' | 'error';
    message: string;
}

// =================================================================
// ไอคอนต่างๆ
// =================================================================
const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
        <circle cx="12" cy="13" r="3"></circle>
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

// =================================================================
// Main Component
// =================================================================
export default function PhotoGalleryPage() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        tags: '',
        file: null as File | null
    });
    const [notification, setNotification] = useState<Notification | null>(null);

    useEffect(() => {
        logUserAction('photo-gallery', 'page_view', {
            timestamp: new Date().toISOString(),
            route: '/photo-gallery'
        });
    }, []);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const loadPhotos = useCallback(async (page: number = 1, append: boolean = false) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/auth/login';
                return;
            }

            if (append) setIsLoadingMore(true);

            const response = await fetch(`/api/photos?page=${page}&limit=12`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const photosArray = data.photos || data;
                
                if (append) {
                    setPhotos(prevPhotos => [...prevPhotos, ...photosArray]);
                } else {
                    setPhotos(Array.isArray(photosArray) ? photosArray : []);
                }

                // อัปเดต pagination info
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages);
                    setCurrentPage(page);
                }
            } else if (response.status === 401) {
                localStorage.removeItem('auth_token');
                window.location.href = '/auth/login';
            } else {
                showNotification('error', 'ไม่สามารถโหลดรูปภาพได้');
            }
        } catch (error) {
            console.error('Error loading photos:', error);
            showNotification('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
            if (append) setIsLoadingMore(false);
        }
    }, []);

    // โหลดรูปภาพเพิ่มเติม
    const loadMorePhotos = async () => {
        if (currentPage < totalPages && !isLoadingMore) {
            await loadPhotos(currentPage + 1, true);
        }
    };

    useEffect(() => {
        loadPhotos();
    }, [loadPhotos]);

    const handleImageUpload = async () => {
        if (!uploadData.title.trim() || !uploadData.file) {
            showNotification('error', 'กรุณาใส่ชื่อรูปและเลือกไฟล์');
            return;
        }

        setIsUploading(true);
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                showNotification('error', 'กรุณาเข้าสู่ระบบก่อน');
                return;
            }

            // สร้าง FormData สำหรับอัปโหลดไฟล์
            const formData = new FormData();
            formData.append('file', uploadData.file);
            formData.append('title', uploadData.title);
            formData.append('description', uploadData.description);
            formData.append('tags', uploadData.tags);

            const response = await fetch('/api/photos/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                setShowUploadModal(false);
                setUploadData({ title: '', description: '', tags: '', file: null });
                
                // เพิ่มรูปใหม่เข้า state ด้านบน (หน้าแรก)
                if (result.photo) {
                    setPhotos(prevPhotos => [result.photo, ...prevPhotos]);
                }
                
                showNotification('success', 'อัปโหลดรูปภาพเรียบร้อยแล้ว');
            } else {
                const errorData = await response.json();
                showNotification('error', errorData.error || 'ไม่สามารถอัปโหลดได้');
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            showNotification('error', 'เกิดข้อผิดพลาดในการอัปโหลด');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeletePhoto = async () => {
        if (!selectedPhoto) return;

        setIsDeleting(true);
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                showNotification('error', 'กรุณาเข้าสู่ระบบก่อน');
                return;
            }

            const response = await fetch(`/api/photos/${selectedPhoto.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // ลบรูปออกจาก state ทันที
                const updatedPhotos = photos.filter(photo => photo.id !== selectedPhoto.id);
                setPhotos(updatedPhotos);
                setSelectedPhoto(null);
                setShowDeleteConfirm(false);
                
                showNotification('success', 'ลบรูปภาพเรียบร้อยแล้ว');
            } else {
                const errorData = await response.json();
                showNotification('error', errorData.error || 'ไม่สามารถลบรูปได้');
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
            showNotification('error', 'เกิดข้อผิดพลาดในการลบรูป');
        } finally {
            setIsDeleting(false);
        }
    };
    
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            timeZone: 'Asia/Bangkok'
        };
        return date.toLocaleDateString('th-TH', options);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-cyan-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <Link href="/dashboard" className="text-purple-600 hover:text-purple-800 transition-colors">
                            <BackIcon />
                        </Link>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                                <CameraIcon />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Photo Gallery</h1>
                                <p className="text-gray-600">คลังภาพความทรงจำ</p>
                            </div>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                    >
                        <UploadIcon />
                        <span>เพิ่มรูปภาพ</span>
                    </button>
                </div>

                {/* Notification */}
                {notification && (
                    <div className={`mb-4 p-4 rounded-lg ${
                        notification.type === 'success' 
                            ? 'bg-green-100 border border-green-300 text-green-800'
                            : 'bg-red-100 border border-red-300 text-red-800'
                    }`}>
                        {notification.message}
                    </div>
                )}

                {/* Photo Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : photos.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="p-6 bg-gray-100 rounded-full inline-block mb-4">
                            <CameraIcon />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">ยังไม่มีรูปภาพ</h3>
                        <p className="text-gray-500 mb-6">เริ่มต้นสร้างคลังภาพความทรงจำของคุณกันเถอะ</p>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 mx-auto"
                        >
                            <UploadIcon />
                            <span>อัปโหลดรูปแรก</span>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.isArray(photos) && photos.map((photo) => (
                            <div 
                                key={photo.id} 
                                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer"
                                onClick={() => setSelectedPhoto(photo)}
                            >
                                <div className="aspect-square relative overflow-hidden">
                                    <Image
                                        src={photo.image_url}
                                        alt={photo.title}
                                        width={300}
                                        height={300}
                                        className="w-full h-full object-cover"
                                        placeholder="blur"
                                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{photo.title}</h3>
                                    {photo.description && (
                                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{photo.description}</p>
                                    )}
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>{formatDate(photo.upload_date)}</span>
                                        {photo.tags && photo.tags.length > 0 && (
                                            <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                                                {photo.tags[0]}
                                                {photo.tags.length > 1 && ` +${photo.tags.length - 1}`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Load More Button */}
                {currentPage < totalPages && Array.isArray(photos) && photos.length > 0 && (
                    <div className="flex justify-center mt-8">
                        <button
                            onClick={loadMorePhotos}
                            disabled={isLoadingMore}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            {isLoadingMore ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
                                    กำลังโหลด...
                                </>
                            ) : (
                                `โหลดรูปภาพเพิ่มเติม (${totalPages - currentPage} หน้าเหลือ)`
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">อัปโหลดรูปภาพใหม่</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">ชื่อรูปภาพ</label>
                                <input
                                    type="text"
                                    value={uploadData.title}
                                    onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
                                    placeholder="ใส่ชื่อรูปภาพ"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">เลือกไฟล์รูปภาพ</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setUploadData({...uploadData, file});
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 file:mr-4 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                />
                                {uploadData.file && (
                                    <p className="mt-2 text-sm text-gray-700">
                                        ไฟล์ที่เลือก: {uploadData.file.name} ({(uploadData.file.size / 1024 / 1024).toFixed(2)} MB)
                                    </p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">คำอธิบาย</label>
                                <textarea
                                    value={uploadData.description}
                                    onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
                                    rows={3}
                                    placeholder="เล่าเรื่องราวของรูปนี้..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Tags (คั่นด้วยจุลภาค)</label>
                                <input
                                    type="text"
                                    value={uploadData.tags}
                                    onChange={(e) => setUploadData({...uploadData, tags: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
                                    placeholder="ความรัก, ความสุข, วันพิเศษ"
                                />
                            </div>
                        </div>
                        
                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setUploadData({ title: '', description: '', tags: '', file: null });
                                }}
                                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleImageUpload}
                                disabled={isUploading || !uploadData.title.trim() || !uploadData.file}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                            >
                                {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Viewer Modal */}
            {selectedPhoto && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-4xl max-h-[90vh] w-full">
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2"
                        >
                            <CloseIcon />
                        </button>
                        
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="absolute top-4 right-16 text-white hover:text-red-300 z-10 bg-red-600/80 rounded-full p-2 transition-colors"
                        >
                            <DeleteIcon />
                        </button>
                        
                        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                            <div className="relative">
                                <Image
                                    src={selectedPhoto.image_url}
                                    alt={selectedPhoto.title}
                                    width={800}
                                    height={600}
                                    className="w-full max-h-[60vh] object-contain"
                                    placeholder="blur"
                                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                                />
                            </div>
                            
                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedPhoto.title}</h2>
                                {selectedPhoto.description && (
                                    <p className="text-gray-700 mb-4">{selectedPhoto.description}</p>
                                )}
                                
                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <span>อัปโหลดโดย: {selectedPhoto.username}</span>
                                    <span>{formatDate(selectedPhoto.upload_date)}</span>
                                </div>
                                
                                {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {selectedPhoto.tags.map((tag, index) => (
                                            <span 
                                                key={index}
                                                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedPhoto && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">ยืนยันการลบรูปภาพ</h3>
                        
                        <div className="mb-6">
                            <p className="text-gray-700 mb-4">
                                คุณแน่ใจหรือไม่ที่จะลบรูปภาพ &ldquo;<span className="font-semibold">{selectedPhoto.title}</span>&rdquo; ?
                            </p>
                            <p className="text-sm text-red-600">
                                การกระทำนี้ไม่สามารถย้อนกลับได้
                            </p>
                        </div>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                disabled={isDeleting}
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleDeletePhoto}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                            >
                                {isDeleting ? 'กำลังลบ...' : 'ลบรูปภาพ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
