// app/ai-chat/page.tsx
'use client';

import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';

// =================================================================
// ระบบ Logging
// =================================================================
const logUserAction = (action: string, details: Record<string, unknown> = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        page: 'ai-chat',
        action,
        details,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
    };
    
    console.log('🤖 AI Chat Log:', logEntry);
    
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

// =================================================================
// ไอคอนต่างๆ
// =================================================================
const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <path d="M8 12h8"></path>
        <circle cx="15.5" cy="8.5" r="1.5"></circle>
    </svg>
);

const HeartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
);

// =================================================================
// ข้อมูลและการตอบกลับของ AI
// =================================================================

// ฟังก์ชันสำหรับเรียก AI API
const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
        // ดึง token จาก localStorage
        const token = localStorage.getItem('auth_token');
        if (!token) {
            return 'กรุณาเข้าสู่ระบบใหม่เพื่อใช้งานฟีเจอร์ AI Chat ค่ะ 🔐';
        }

        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ message: userMessage }),
        });

        if (response.status === 401) {
            // Token หมดอายุหรือไม่ถูกต้อง
            localStorage.removeItem('auth_token');
            return 'เซสชันหมดอายุแล้วค่ะ กรุณาเข้าสู่ระบบใหม่เพื่อใช้งาน AI Chat 🔄';
        }

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            return 'ขอโทษค่ะ เกิดข้อผิดพลาดในการตอบกลับ กรุณาลองใหม่อีกครั้งนะคะ 😅';
        }

        const data = await response.json();
        return data.response || 'ขอโทษค่ะ เกิดข้อผิดพลาดในการตอบกลับ 😅';
    } catch (error) {
        console.error('Error calling AI API:', error);
        // Fallback response
        return 'ขอโทษค่ะ ตอนนี้ฉันมีปัญหาทางเทคนิคนิดหน่อย ลองถามใหม่ในอีกสักครู่นะคะ 😊';
    }
};

// =================================================================
// ส่วนหลักของหน้าแชท AI
// =================================================================
interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    emotion?: string;
    intensity?: number;
}

interface ApiMessage {
    id: number;
    role: 'user' | 'model';
    content: string;
    created_at: string;
}

interface EmotionDetection {
    detected: boolean;
    primary: string;
    secondary: string[];
    intensity: number;
}

// ฟังก์ชันตรวจจับอารมณ์จากข้อความ
const detectEmotion = (text: string): EmotionDetection => {
    const lowerText = text.toLowerCase();
    
    const emotionKeywords = {
        sad: ['เศร้า', 'เสียใจ', 'ผิดหวัง', 'ท้อ', 'หดหู่', 'เหงา', 'ร้องไห้', 'น้ำตา'],
        happy: ['ดีใจ', 'มีความสุข', 'สนุก', 'ยินดี', 'ปลื้ม', 'รัก', 'ชื่นชม'],
        angry: ['โกรธ', 'หงุดหงิด', 'รำคาญ', 'งุ่นง่าน', 'เฟี้ยว', 'หัวเสีย'],
        anxious: ['กังวล', 'เครียด', 'กลัว', 'วิตก', 'ห่วง', 'ตื่นเต้น'],
        confused: ['งง', 'สับสน', 'ไม่เข้าใจ', 'ลังเล', 'ไม่รู้'],
        loving: ['รัก', 'หวาน', 'คิดถึง', 'ชอบ', 'หลงรัก', 'ใส่ใจ']
    };

    let primaryEmotion = 'neutral';
    let maxMatches = 0;
    const secondaryEmotions: string[] = [];
    let totalIntensity = 0;

    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
        const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
        if (matches > 0) {
            totalIntensity += matches;
            if (matches > maxMatches) {
                if (primaryEmotion !== 'neutral') {
                    secondaryEmotions.push(primaryEmotion);
                }
                primaryEmotion = emotion;
                maxMatches = matches;
            } else {
                secondaryEmotions.push(emotion);
            }
        }
    });

    const intensity = Math.min(Math.ceil(totalIntensity * 2), 10);

    return {
        detected: primaryEmotion !== 'neutral',
        primary: primaryEmotion,
        secondary: secondaryEmotions.slice(0, 2),
        intensity
    };
};

export default function AiChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // โหลดประวัติการสนทนาจาก API
    const loadChatHistory = async (page: number = 1, append: boolean = false) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                // ถ้าไม่มี token ให้แสดงข้อความต้อนรับ
                setMessages([
                    { 
                        id: 1, 
                        text: 'สวัสดีค่ะ! ฉันชื่อ "ลูกพีช" 🥰\n\nฉันเป็น AI เพื่อนคุยที่เก่งหลายเรื่องเลย! ทั้งให้คำปรึกษาความรัก เล่านิทาน เล่นมุกตลก แปลภาษา คิดเลข แนะนำไอเดียเดท สอนทำอาหาร และเล่นเกมด้วย! 🌟\n\nมีเรื่องอะไรก็เล่าให้ฟังได้นะคะ หรือจะลองกดปุ่มคำแนะนำด่านล่างก็ได้ ฉันพร้อมเป็นเพื่อนคุยเสมอ! ✨', 
                        sender: 'ai', 
                        timestamp: new Date(),
                        emotion: 'happy',
                        intensity: 8
                    },
                ]);
                setIsLoadingHistory(false);
                return;
            }

            if (append) setIsLoadingMore(true);

            const response = await fetch(`/api/ai-chat?page=${page}&limit=30`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.messages && data.messages.length > 0) {
                    // แปลงข้อความจาก API เป็น format ที่ใช้ใน UI
                    const formattedMessages: Message[] = data.messages.map((msg: ApiMessage, index: number) => ({
                        id: (page - 1) * 30 + index + 1,
                        text: msg.content,
                        sender: msg.role === 'user' ? 'user' : 'ai',
                        timestamp: new Date(msg.created_at),
                        // สำหรับข้อความเก่าที่ไม่มีข้อมูลอารมณ์
                        emotion: undefined,
                        intensity: undefined,
                    }));
                    
                    if (append) {
                        setMessages(prevMessages => [...formattedMessages, ...prevMessages]);
                    } else {
                        setMessages(formattedMessages);
                    }

                    // อัปเดต pagination info
                    if (data.pagination) {
                        setTotalPages(data.pagination.totalPages);
                        setCurrentPage(page);
                    }
                } else {
                    // ถ้าไม่มีประวัติให้แสดงข้อความต้อนรับ
                    setMessages([
                        { 
                            id: 1, 
                            text: 'สวัสดีค่ะ! ฉันชื่อ "ลูกพีช" AI ที่ปรึกษาด้านจิตวิทยาความสัมพันธ์ 💕\n\nฉันได้รับการฝึกฝนให้เข้าใจอารมณ์และความรู้สึกของมนุษย์อย่างลึกซึ้ง พร้อมที่จะเป็นเพื่อนคุยและให้คำปรึกษาที่อบอุ่น เข้าใจ และสร้างสรรค์\n\nไม่ว่าคุณจะรู้สึกเศร้า โกรธ กังวล หรือมีความสุข ฉันพร้อมรับฟังและช่วยคุณทำความเข้าใจความรู้สึกเหล่านั้นค่ะ ✨', 
                            sender: 'ai', 
                            timestamp: new Date(),
                            emotion: 'loving',
                            intensity: 5
                        },
                    ]);
                }
            } else {
                // ถ้า API error ให้แสดงข้อความต้อนรับ
                setMessages([
                    { 
                        id: 1, 
                        text: 'สวัสดีค่ะ! ฉันชื่อ "ลูกพีช" AI ที่ปรึกษาด้านจิตวิทยาความสัมพันธ์ 💕\n\nฉันได้รับการฝึกฝนให้เข้าใจอารมณ์และความรู้สึกของมนุษย์อย่างลึกซึ้ง พร้อมที่จะเป็นเพื่อนคุยและให้คำปรึกษาที่อบอุ่น เข้าใจ และสร้างสรรค์\n\nไม่ว่าคุณจะรู้สึกเศร้า โกรธ กังวล หรือมีความสุข ฉันพร้อมรับฟังและช่วยคุณทำความเข้าใจความรู้สึกเหล่านั้นค่ะ ✨', 
                        sender: 'ai', 
                        timestamp: new Date(),
                        emotion: 'loving',
                        intensity: 5
                    },
                ]);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            // ถ้าเกิดข้อผิดพลาดให้แสดงข้อความต้อนรับ
            setMessages([
                { 
                    id: 1, 
                    text: 'สวัสดีค่ะ! ฉันชื่อ "ลูกพีช" AI ที่ปรึกษาด้านจิตวิทยาความสัมพันธ์ 💕\n\nฉันได้รับการฝึกฝนให้เข้าใจอารมณ์และความรู้สึกของมนุษย์อย่างลึกซึ้ง พร้อมที่จะเป็นเพื่อนคุยและให้คำปรึกษาที่อบอุ่น เข้าใจ และสร้างสรรค์\n\nไม่ว่าคุณจะรู้สึกเศร้า โกรธ กังวล หรือมีความสุข ฉันพร้อมรับฟังและช่วยคุณทำความเข้าใจความรู้สึกเหล่านั้นค่ะ ✨', 
                    sender: 'ai', 
                    timestamp: new Date(),
                    emotion: 'loving',
                    intensity: 5
                },
            ]);
        } finally {
            if (append) setIsLoadingMore(false);
            setIsLoadingHistory(false);
        }
    };

    // โหลดข้อความเพิ่มเติม
    const loadMoreMessages = async () => {
        if (currentPage < totalPages && !isLoadingMore) {
            await loadChatHistory(currentPage + 1, true);
        }
    };

    // โหลดประวัติการสนทนาเมื่อ component mount
    useEffect(() => {
        loadChatHistory();
    }, []);

    // ทำให้หน้าจอเลื่อนลงมาล่างสุดเมื่อมีข้อความใหม่
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Log เมื่อเข้าหน้าครั้งแรก
    useEffect(() => {
        if (!isLoadingHistory) {
            logUserAction('page_view', {
                messagesCount: messages.length,
                timestamp: new Date().toISOString()
            });
        }
    }, [isLoadingHistory, messages.length]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() === '' || isLoading) return;

        // ตรวจจับอารมณ์จากข้อความผู้ใช้
        const userEmotion = detectEmotion(input);

        const userMessage: Message = {
            id: Date.now(),
            text: input,
            sender: 'user',
            timestamp: new Date(),
            emotion: userEmotion.detected ? userEmotion.primary : undefined,
            intensity: userEmotion.detected ? userEmotion.intensity : undefined,
        };
        
        // Log ข้อความของผู้ใช้พร้อมข้อมูลอารมณ์
        logUserAction('send_message', {
            messageLength: input.length,
            messageType: 'user',
            emotion: {
                detected: userEmotion.detected,
                primary: userEmotion.primary,
                secondary: userEmotion.secondary,
                intensity: userEmotion.intensity
            },
            hasKeywords: {
                love: input.toLowerCase().includes('รัก'),
                greeting: input.toLowerCase().includes('สวัสดี'),
                activity: input.toLowerCase().includes('ทำ'),
                relationship: input.toLowerCase().includes('ความสัมพันธ์'),
                problem: input.toLowerCase().includes('ปัญหา'),
                help: input.toLowerCase().includes('ช่วย')
            },
            timestamp: new Date().toISOString()
        });
        
        setMessages((prev) => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            // เรียกใช้ AI API
            const aiResponseText = await getAIResponse(currentInput);
            
            // ตรวจจับอารมณ์จากการตอบของ AI
            const aiEmotion = detectEmotion(aiResponseText);
            
            const aiResponse: Message = {
                id: Date.now() + 1,
                text: aiResponseText,
                sender: 'ai',
                timestamp: new Date(),
                emotion: aiEmotion.detected ? aiEmotion.primary : undefined,
                intensity: aiEmotion.detected ? aiEmotion.intensity : undefined,
            };
            
            // Log การตอบกลับของ AI พร้อมข้อมูลอารมณ์
            logUserAction('ai_response', {
                responseLength: aiResponseText.length,
                responseType: 'ai',
                userMessageLength: currentInput.length,
                userEmotion: userEmotion,
                aiEmotion: aiEmotion,
                responseTime: 'realtime',
                timestamp: new Date().toISOString()
            });
            
            setMessages((prev) => [...prev, aiResponse]);
        } catch (error) {
            console.error('Error getting AI response:', error);
            // แสดงข้อความข้อผิดพลาด
            const errorResponse: Message = {
                id: Date.now() + 1,
                text: 'ขอโทษค่ะ เกิดข้อผิดพลาดในการตอบกลับ ลองใหม่อีกครั้งนะคะ 😅',
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };

    // ฟังก์ชันเริ่มแชทใหม่
    const handleNewChat = () => {
        setShowDeleteConfirm(true);
    };

    const confirmNewChat = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (token) {
                const response = await fetch('/api/ai-chat', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    // รีเซ็ตสถานะ pagination
                    setCurrentPage(1);
                    setTotalPages(1);
                }
            }
        } catch (error) {
            console.error('Error deleting chat history:', error);
        }

        // ล้างข้อความทั้งหมด
        setMessages([
            { 
                id: 1, 
                text: 'สวัสดีค่ะ! ฉันชื่อ "ลูกพีช" AI ที่ปรึกษาด้านจิตวิทยาความสัมพันธ์ 💕\n\nฉันได้รับการฝึกฝนให้เข้าใจอารมณ์และความรู้สึกของมนุษย์อย่างลึกซึ้ง พร้อมที่จะเป็นเพื่อนคุยและให้คำปรึกษาที่อบอุ่น เข้าใจ และสร้างสรรค์\n\nไม่ว่าคุณจะรู้สึกเศร้า โกรธ กังวล หรือมีความสุข ฉันพร้อมรับฟังและช่วยคุณทำความเข้าใจความรู้สึกเหล่านั้นค่ะ ✨', 
                sender: 'ai', 
                timestamp: new Date(),
                emotion: 'loving',
                intensity: 5
            },
        ]);
        
        // ล้าง input
        setInput('');
        setShowDeleteConfirm(false);
        
        // Log การเริ่มแชทใหม่
        logUserAction('new_chat_started', {
            timestamp: new Date().toISOString()
        });
    };

    const cancelNewChat = () => {
        setShowDeleteConfirm(false);
    };

    // ฟังก์ชันปุ่มคำแนะนำด่วนที่หลากหลายมากขึ้น
    const quickSuggestions = [
        "เฮ้ย ลูกพีช ฉันเซ็งมากเลย ช่วยฟังหน่อย 😩",
        "เราทะเลาะกันแล้ว งั้นฉันควรทำยังไงดี?",
        "เล่านิทานสั้นๆ ให้ฟังหน่อยค่ะ 📚",
        "เล่นมุกตลกมาสักอัน อยากขำบ้าง 😂",
        "ช่วยแปล 'I love you' เป็นภาษาต่างๆ หน่อย",
        "คำนวณ 15 + 25 × 2 ให้หน่อย 🧮",
        "แนะนำไอเดียเดทหน่อย อยากเซอร์ไพรส์คนรัก 💕",
        "สอนทำอาหารง่ายๆ ที่ทำให้คนรักกินได้มั้ย? 👩‍🍳",
        "เล่นเกมทายปริศนากันเถอะ! 🎮"
    ];

    const getEmotionIcon = (emotion?: string) => {
        const emotionIcons: Record<string, string> = {
            sad: '😢',
            happy: '😊',
            angry: '😠',
            anxious: '😰',
            confused: '😕',
            loving: '🥰',
            neutral: '💭'
        };
        return emotionIcons[emotion || 'neutral'] || '💭';
    };

    const getEmotionColor = (emotion?: string) => {
        const emotionColors: Record<string, string> = {
            sad: 'text-blue-600',
            happy: 'text-yellow-500',
            angry: 'text-red-500',
            anxious: 'text-orange-500',
            confused: 'text-purple-500',
            loving: 'text-pink-500',
            neutral: 'text-gray-500'
        };
        return emotionColors[emotion || 'neutral'] || 'text-gray-500';
    };

    const handleQuickSuggestion = (suggestion: string) => {
        if (isLoading) return;
        
        // Log การคลิกปุ่มแนะนำด่วน
        logUserAction('quick_suggestion_click', {
            suggestion,
            timestamp: new Date().toISOString()
        });
        
        setInput(suggestion);
    };

    const formatTime = (timestamp: Date) => {
        return timestamp.toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <main className="flex flex-col h-screen bg-blue-50">
            {/* โมดัลยืนยันการลบ */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DeleteIcon />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                ลบบทสนทนาทั้งหมด?
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                                การดำเนินการนี้จะลบบทสนทนาทั้งหมดและไม่สามารถกู้คืนได้ 
                                คุณแน่ใจหรือไม่?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={cancelNewChat}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={confirmNewChat}
                                    className="flex-1 px-4 py-2 text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
                                >
                                    ลบทั้งหมด
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ส่วนหัว */}
            <header className="flex items-center p-4 bg-white/90 backdrop-blur-md shadow-lg border-b border-pink-100">
                <Link href="/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors">
                    <BackIcon />
                </Link>
                <div className="text-center flex-grow">
                                        <h1 className="text-xl font-bold text-blue-700">
                        🤖 AI Chat Assistant
                    </h1>
                    {isLoading ? (
                        <p className="text-xs text-pink-500 font-medium animate-pulse flex items-center justify-center gap-1">
                            <HeartIcon />
                            กำลังคิดคำตอบ...
                        </p>
                    ) : (
                        <p className="text-xs text-emerald-500 font-medium flex items-center justify-center gap-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            พร้อมให้คำปรึกษา
                        </p>
                    )}
                </div>
                {/* ปุ่มแชทใหม่ */}
                <div className="flex items-center gap-2">
                    {messages.length > 1 && (
                        <button
                            onClick={handleNewChat}
                            disabled={isLoading}
                            className="flex items-center gap-1 px-3 py-2 text-xs bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-all duration-200 disabled:bg-gray-400 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none"
                            title="เริ่มแชทใหม่"
                        >
                            <RefreshIcon />
                            <span className="hidden sm:inline">แชทใหม่</span>
                        </button>
                    )}
                </div>
            </header>

            {/* พื้นที่แสดงข้อความ */}
            <div className="flex-grow p-4 overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Pagination Controls - แสดงข้อความเก่า */}
                    {currentPage < totalPages && !isLoadingHistory && (
                        <div className="flex justify-center mb-4">
                            <button
                                onClick={loadMoreMessages}
                                disabled={isLoadingMore}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 bg-white/70 backdrop-blur-sm rounded-full border border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoadingMore ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                                        กำลังโหลด...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                        โหลดข้อความเก่า ({totalPages - currentPage} หน้าเหลือ)
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Loading indicator สำหรับโหลดข้อความครั้งแรก */}
                    {isLoadingHistory && (
                        <div className="flex justify-center items-center py-8">
                            <div className="flex items-center gap-3 text-gray-500">
                                <div className="w-6 h-6 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin"></div>
                                <span>กำลังโหลดประวัติการสนทนา...</span>
                            </div>
                        </div>
                    )}
                    {/* แสดงปุ่มล้างทั้งหมดเมื่อมีข้อความมากกว่า 3 ข้อความ */}
                    {messages.length > 3 && !isLoading && (
                        <div className="flex justify-center mb-4">
                            <button
                                onClick={handleNewChat}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white/70 backdrop-blur-sm rounded-full border border-gray-200 hover:border-pink-300 hover:text-pink-600 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <DeleteIcon />
                                ล้างบทสนทนาทั้งหมด
                            </button>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex items-end gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {message.sender === 'ai' && (
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                                    <BotIcon />
                                </div>
                            )}
                            <div className="flex flex-col gap-1 max-w-xs md:max-w-md">
                                <div
                                    className={`px-5 py-3 rounded-2xl relative ${message.sender === 'user'
                                        ? 'bg-blue-500 text-white rounded-br-md shadow-lg'
                                        : 'bg-white text-gray-800 rounded-bl-md shadow-lg border border-pink-100'
                                    }`}
                                >
                                    {/* แสดงไอคอนอารมณ์ */}
                                    {message.emotion && (
                                        <div className={`absolute -top-2 ${message.sender === 'user' ? '-left-2' : '-right-2'} w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-sm`}>
                                            {getEmotionIcon(message.emotion)}
                                        </div>
                                    )}
                                    <p className="leading-relaxed">{message.text}</p>
                                    {/* แสดงระดับความเข้มอารมณ์ */}
                                    {message.emotion && message.intensity && message.intensity > 6 && (
                                        <div className="mt-2 text-xs opacity-60">
                                            <span className={getEmotionColor(message.emotion)}>
                                                ● อารมณ์: {message.emotion} (ระดับ {message.intensity}/10)
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <p className={`text-xs text-gray-400 px-2 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                    {formatTime(message.timestamp)}
                                </p>
                            </div>
                            {message.sender === 'user' && (
                                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                                    <span className="text-sm font-bold">คุณ</span>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {/* แอนิเมชันขณะ AI กำลังพิมพ์ */}
                    {isLoading && (
                        <div className="flex items-end gap-3 justify-start">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                                <BotIcon />
                            </div>
                            <div className="px-5 py-4 rounded-2xl bg-white text-gray-800 rounded-bl-md shadow-lg border border-pink-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-pink-500">🧠 กำลังวิเคราะห์ความรู้สึก...</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></span>
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* แสดงความสามารถของ AI */}
                    {messages.length === 1 && !isLoading && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200 shadow-lg mb-4">
                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                🌟 ความสามารถของลูกพีช
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-white/70 rounded-lg p-3 text-center border border-purple-100">
                                    <div className="text-2xl mb-1">💕</div>
                                    <div className="text-xs font-semibold text-gray-700">ให้คำปรึกษา<br/>ความรัก</div>
                                </div>
                                <div className="bg-white/70 rounded-lg p-3 text-center border border-purple-100">
                                    <div className="text-2xl mb-1">📚</div>
                                    <div className="text-xs font-semibold text-gray-700">เล่านิทาน<br/>เรื่องสั้น</div>
                                </div>
                                <div className="bg-white/70 rounded-lg p-3 text-center border border-purple-100">
                                    <div className="text-2xl mb-1">😂</div>
                                    <div className="text-xs font-semibold text-gray-700">เล่นมุกตลก<br/>เรื่องขำๆ</div>
                                </div>
                                <div className="bg-white/70 rounded-lg p-3 text-center border border-purple-100">
                                    <div className="text-2xl mb-1">🌐</div>
                                    <div className="text-xs font-semibold text-gray-700">แปลภาษา<br/>หลายภาษา</div>
                                </div>
                                <div className="bg-white/70 rounded-lg p-3 text-center border border-purple-100">
                                    <div className="text-2xl mb-1">🧮</div>
                                    <div className="text-xs font-semibold text-gray-700">คิดเลข<br/>คำนวณ</div>
                                </div>
                                <div className="bg-white/70 rounded-lg p-3 text-center border border-purple-100">
                                    <div className="text-2xl mb-1">🎯</div>
                                    <div className="text-xs font-semibold text-gray-700">ไอเดียเดท<br/>ที่เที่ยว</div>
                                </div>
                                <div className="bg-white/70 rounded-lg p-3 text-center border border-purple-100">
                                    <div className="text-2xl mb-1">👩‍🍳</div>
                                    <div className="text-xs font-semibold text-gray-700">สูตรอาหาร<br/>ทำอาหาร</div>
                                </div>
                                <div className="bg-white/70 rounded-lg p-3 text-center border border-purple-100">
                                    <div className="text-2xl mb-1">🎮</div>
                                    <div className="text-xs font-semibold text-gray-700">เล่นเกม<br/>ปริศนา</div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* ปุ่มคำแนะนำด่วน */}
                    {messages.length === 1 && !isLoading && (
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-pink-200 shadow-lg">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                💡 ลองเริ่มต้นสนทนา - เลือกสิ่งที่คุณสนใจ
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {quickSuggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleQuickSuggestion(suggestion)}
                                        className="text-left p-4 bg-amber-50 hover:bg-amber-100 rounded-xl text-sm text-gray-700 transition-all duration-200 border border-amber-200 hover:border-amber-300 hover:shadow-md hover:scale-105 transform"
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="text-base">💭</span>
                                            <span className="leading-relaxed">{suggestion}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-4 text-xs text-gray-500 text-center">
                                💝 ฉันจะใช้ความเข้าใจทางจิตวิทยาเพื่อให้คำปรึกษาที่เหมาะสมกับความรู้สึกของคุณ
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* พื้นที่พิมพ์ข้อความ */}
            <footer className="p-4 bg-white/90 backdrop-blur-md border-t border-pink-100">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="มีอะไรจะเล่าให้ฟังมั้ย? ฉันพร้อมฟังทุกเรื่อง 😊..."
                            className="flex-grow px-5 py-4 bg-white border-2 border-pink-200 rounded-full focus:ring-2 focus:ring-pink-300 focus:border-pink-400 text-gray-800 placeholder-gray-500 shadow-lg transition-all duration-200"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            className="flex-shrink-0 w-14 h-14 flex items-center justify-center text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all duration-200 disabled:bg-gray-400 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                            disabled={isLoading || input.trim() === ''}
                        >
                            <SendIcon />
                        </button>
                    </form>
                    <p className="text-center text-xs text-gray-500 mt-2">
                        � ลูกพีช AI - เข้าใจความรู้สึก วิเคราะห์อารมณ์ ให้คำปรึกษาอย่างลึกซึ้ง
                    </p>
                </div>
            </footer>
        </main>
    );
}
