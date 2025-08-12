'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// =================================================================
// Icons
// =================================================================
const BackIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ClockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);

// =================================================================
// Types และ Interface
// =================================================================
type GameStatus = 'waiting' | 'playing' | 'finished';

interface Problem {
    num1: number;
    num2: number;
    operator: string;
    answer: number;
}

interface ApiScore {
    score: number;
    played_at: string;
}

interface HighScore {
    score: number;
    difficulty: 'easy' | 'medium' | 'hard';
    date: string;
    playerName: string;
}

export default function MathGamePage() {
    const [gameStatus, setGameStatus] = useState<GameStatus>('waiting');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [problem, setProblem] = useState<Problem>({ num1: 0, num2: 0, operator: '+', answer: 0 });
    const [userAnswer, setUserAnswer] = useState('');
    const [showCorrect, setShowCorrect] = useState(false);
    const [showIncorrect, setShowIncorrect] = useState(false);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info';
        message: string;
    } | null>(null);
    const [highScores, setHighScores] = useState<HighScore[]>([]);
    const [playerName, setPlayerName] = useState('');

    const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 2000);
    }, []);

    // โหลดคะแนนสูงสุดจาก API
    useEffect(() => {
        const loadHighScores = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    // ถ้าไม่มี token ให้ใช้ localStorage แทน
                    const savedScores = localStorage.getItem('mathGameHighScores');
                    if (savedScores) {
                        setHighScores(JSON.parse(savedScores));
                    }
                    return;
                }

                const response = await fetch('/api/math-game', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    // แปลงข้อมูลจาก API เป็นรูปแบบที่ใช้ใน UI
                    const formattedScores: HighScore[] = data.userHighScores.map((score: ApiScore) => ({
                        score: score.score,
                        difficulty: difficulty, // ใช้ difficulty ปัจจุบัน
                        date: new Date(score.played_at).toLocaleDateString('th-TH'),
                        playerName: playerName || 'ผู้เล่น'
                    }));
                    setHighScores(formattedScores);
                } else {
                    // ถ้า API error ให้ใช้ localStorage แทน
                    const savedScores = localStorage.getItem('mathGameHighScores');
                    if (savedScores) {
                        setHighScores(JSON.parse(savedScores));
                    }
                }
            } catch (error) {
                console.error('Error loading high scores:', error);
                // ถ้าเกิดข้อผิดพลาดให้ใช้ localStorage แทน
                const savedScores = localStorage.getItem('mathGameHighScores');
                if (savedScores) {
                    setHighScores(JSON.parse(savedScores));
                }
            }
        };

        loadHighScores();
        
        const savedPlayerName = localStorage.getItem('mathGamePlayerName');
        if (savedPlayerName) {
            setPlayerName(savedPlayerName);
        }
    }, [difficulty, playerName]);

    // บันทึกคะแนนใหม่
    const saveHighScore = useCallback(async (newScore: number) => {
        const currentPlayerName = playerName.trim() || 'ผู้เล่นไม่ประสงค์ออกนาม';

        try {
            const token = localStorage.getItem('auth_token');
            
            if (token) {
                // บันทึกคะแนนผ่าน API
                const response = await fetch('/api/math-game', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ score: newScore }),
                });

                if (response.ok) {
                    const data = await response.json();
                    // อัปเดตคะแนนสูงสุดจาก API
                    const formattedScores: HighScore[] = data.highScores.map((score: ApiScore) => ({
                        score: score.score,
                        difficulty: difficulty,
                        date: new Date(score.played_at).toLocaleDateString('th-TH'),
                        playerName: currentPlayerName
                    }));
                    setHighScores(formattedScores);
                    
                    // แจ้งเตือนถ้าเป็นคะแนนสูงสุดใหม่
                    if (data.highScores.length > 0 && data.highScores[0].score === newScore) {
                        showNotification('success', '🏆 คะแนนสูงสุดใหม่! ยินดีด้วย!');
                    }
                    
                    localStorage.setItem('mathGamePlayerName', currentPlayerName);
                    return;
                }
            }

            // Fallback ถ้าไม่มี token หรือ API error
            const newHighScore: HighScore = {
                score: newScore,
                difficulty: difficulty,
                date: new Date().toLocaleDateString('th-TH'),
                playerName: currentPlayerName
            };

            const updatedScores = [...highScores, newHighScore]
                .sort((a, b) => b.score - a.score)
                .slice(0, 5); // เก็บแค่ 5 อันดับแรก

            setHighScores(updatedScores);
            localStorage.setItem('mathGameHighScores', JSON.stringify(updatedScores));
            localStorage.setItem('mathGamePlayerName', currentPlayerName);

            // แจ้งเตือนถ้าทำคะแนนสูงสุดใหม่
            if (updatedScores.length > 0 && updatedScores[0].score === newScore) {
                showNotification('success', '🏆 คะแนนสูงสุดใหม่! ยินดีด้วย!');
            }
        } catch (error) {
            console.error('Error saving score:', error);
            // ใช้ localStorage เป็น fallback
            const newHighScore: HighScore = {
                score: newScore,
                difficulty: difficulty,
                date: new Date().toLocaleDateString('th-TH'),
                playerName: currentPlayerName
            };

            const updatedScores = [...highScores, newHighScore]
                .sort((a, b) => b.score - a.score)
                .slice(0, 5);

            setHighScores(updatedScores);
            localStorage.setItem('mathGameHighScores', JSON.stringify(updatedScores));
            localStorage.setItem('mathGamePlayerName', currentPlayerName);
        }
    }, [playerName, difficulty, highScores, showNotification]);

    // ตรวจสอบว่าเป็นคะแนนสูงหรือไม่
    const isHighScore = (score: number) => {
        return highScores.length < 5 || score > Math.min(...highScores.map(h => h.score));
    };

    // ฟังก์ชันสร้างโจทย์ใหม่
    const generateProblem = () => {
        let num1, num2, operator, answer;
        
        if (difficulty === 'easy') {
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
            const operators = ['+', '-'];
            operator = operators[Math.floor(Math.random() * operators.length)];
        } else if (difficulty === 'medium') {
            num1 = Math.floor(Math.random() * 20) + 1;
            num2 = Math.floor(Math.random() * 20) + 1;
            const operators = ['+', '-', '*'];
            operator = operators[Math.floor(Math.random() * operators.length)];
        } else {
            num1 = Math.floor(Math.random() * 50) + 1;
            num2 = Math.floor(Math.random() * 50) + 1;
            const operators = ['+', '-', '*'];
            operator = operators[Math.floor(Math.random() * operators.length)];
        }

        if (operator === '-') {
            if (num2 > num1) {
                [num1, num2] = [num2, num1];
            }
            answer = num1 - num2;
        } else if (operator === '+') {
            answer = num1 + num2;
        } else if (operator === '*') {
            answer = num1 * num2;
        }

        setProblem({ num1, num2, operator, answer: answer! });
    };

    const getDifficultyMultiplier = () => {
        switch (difficulty) {
            case 'easy': return 5;
            case 'medium': return 10;
            case 'hard': return 15;
            default: return 5;
        }
    };

    const startGame = () => {
        setGameStatus('playing');
        setScore(0);
        setTimeLeft(60);
        generateProblem();
    };

    const handleAnswerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const answer = parseInt(userAnswer);
        
        if (answer === problem.answer) {
            setScore(prev => prev + getDifficultyMultiplier());
            setShowCorrect(true);
            showNotification('success', `ถูกต้อง! +${getDifficultyMultiplier()} คะแนน 🎉`);
            setTimeout(() => setShowCorrect(false), 800);
        } else {
            setShowIncorrect(true);
            showNotification('error', `ผิด! คำตอบที่ถูกคือ ${problem.answer}`);
            setTimeout(() => setShowIncorrect(false), 800);
        }
        
        setUserAnswer('');
        setTimeout(() => generateProblem(), 500);
    };

    const resetGame = () => {
        setGameStatus('waiting');
        setScore(0);
        setTimeLeft(60);
        setUserAnswer('');
        setShowCorrect(false);
        setShowIncorrect(false);
    };

    // Timer
    useEffect(() => {
        if (gameStatus === 'playing' && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && gameStatus === 'playing') {
            setGameStatus('finished');
            // บันทึกคะแนนเมื่อเกมจบ
            if (score > 0) {
                saveHighScore(score);
            }
        }
    }, [gameStatus, timeLeft, score, saveHighScore]);

    const getScoreMessage = () => {
        if (score >= 200) return '🏆 เก่งมาก! คุณเป็นนักคณิตศาสตร์ตัวจริง!';
        if (score >= 150) return '🌟 ดีมาก! คะแนนสูงเลย!';
        if (score >= 100) return '👍 ดีแล้ว! ลองเล่นอีกครั้งเพื่อเพิ่มคะแนน!';
        if (score >= 50) return '💪 ไม่เป็นไร! ลองใหม่และจะทำได้ดีขึ้น!';
        return '📚 ฝึกฝนเพิ่มเติมแล้วจะเก่งขึ้นแน่นอน!';
    };

    return (
        <div className="min-h-screen bg-blue-50">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-xl transition-all duration-300 ${
                    notification.type === 'success' ? 'bg-green-500 text-white' :
                    notification.type === 'error' ? 'bg-red-500 text-white' :
                    'bg-blue-500 text-white'
                }`}>
                    <div className="flex items-center gap-2">
                        {notification.type === 'success' && <span className="text-lg">✨</span>}
                        {notification.type === 'error' && <span className="text-lg">🚫</span>}
                        {notification.type === 'info' && <span className="text-lg">💡</span>}
                        <span className="font-bold text-sm">{notification.message}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white/90 backdrop-blur-sm border-b-2 border-blue-200 px-4 py-4 shadow-sm">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 transition-colors p-2 rounded-full hover:bg-blue-50">
                        <BackIcon />
                    </Link>
                    <h1 className="text-2xl font-black text-blue-700">
                        🧮 Math Challenge
                    </h1>
                    <div className="w-10"></div>
                </div>
            </div>

            <div className="px-4 py-6 max-w-lg mx-auto">
                {gameStatus === 'waiting' && (
                    <div className="text-center">
                        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-blue-200">
                            <div className="text-6xl mb-2">🧮</div>
                            <h2 className="text-2xl font-black text-gray-800 mb-2 leading-tight">
                                Math Challenge<br/>
                                <span className="text-blue-600 text-base">สำหรับคู่รัก</span>
                            </h2>
                            <p className="text-base text-gray-700 mb-4 font-bold leading-relaxed">
                                แข่งขันคณิตศาสตร์กับแฟน! 💕<br/>
                                <span className="text-amber-600">ใครจะได้คะแนนสูงสุดใน 60 วินาที? 🏆</span>
                            </p>

                            {/* เลือกระดับความยาก */}
                            <div className="mb-8">
                                <h3 className="text-lg font-black text-gray-800 mb-3">🎯 เลือกระดับความยาก:</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setDifficulty('easy')}
                                        className={`w-full p-3 rounded-xl border-2 transition-all duration-200 font-black text-base ${
                                            difficulty === 'easy'
                                                ? 'border-green-500 bg-green-100 text-green-800 shadow-lg transform scale-105'
                                                : 'border-gray-300 text-gray-800 hover:border-green-400 hover:shadow-md hover:bg-green-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl">😊 ง่าย (+5 คะแนน)</span>
                                            <span className="text-base font-bold">บวก ลบ (1-10)</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setDifficulty('medium')}
                                        className={`w-full p-3 rounded-xl border-2 transition-all duration-200 font-black text-base ${
                                            difficulty === 'medium'
                                                ? 'border-orange-500 bg-orange-100 text-orange-800 shadow-lg transform scale-105'
                                                : 'border-gray-300 text-gray-800 hover:border-orange-400 hover:shadow-md hover:bg-orange-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl">😤 ปานกลาง (+10 คะแนน)</span>
                                            <span className="text-base font-bold">บวก ลบ คูณ (1-20)</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setDifficulty('hard')}
                                        className={`w-full p-3 rounded-xl border-2 transition-all duration-200 font-black text-base ${
                                            difficulty === 'hard'
                                                ? 'border-red-500 bg-red-100 text-red-800 shadow-lg transform scale-105'
                                                : 'border-gray-300 text-gray-800 hover:border-red-400 hover:shadow-md hover:bg-red-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xl">🔥 ยาก (+15 คะแนน)</span>
                                            <span className="text-base font-bold">ตัวเลขใหญ่ขึ้น (1-50)</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* ใส่ชื่อผู้เล่น */}
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-gray-800 mb-4 flex items-center justify-center gap-2">
                                    👤 ชื่อผู้เล่น:
                                </h3>
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder="ใส่ชื่อของคุณ (ไม่บังคับ)"
                                    className="w-full px-4 py-2 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 font-bold text-gray-800 text-base bg-white/80 placeholder-gray-500"
                                />
                                <p className="text-base text-blue-600 mt-3 font-bold">✨ ชื่อจะแสดงในตาราง Top 5 คะแนน</p>
                            </div>

                            {/* แสดงคะแนนสูงสุด 5 อันดับ */}
                            {highScores.length > 0 && (
                                <div className="mb-8 p-6 bg-amber-100 border-3 border-amber-300 rounded-2xl shadow-lg">
                                    <h3 className="text-lg font-black text-gray-800 mb-2 flex items-center justify-center gap-2">
                                        🏆 Top 5 คะแนนสูงสุด
                                    </h3>
                                    <div className="space-y-3">
                                        {highScores.map((score, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white/90 rounded-xl shadow-md border border-amber-200">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-black ${
                                                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                        index === 1 ? 'bg-gray-300 text-gray-700' :
                                                        index === 2 ? 'bg-orange-300 text-orange-900' :
                                                        'bg-blue-200 text-blue-800'
                                                    }`}>
                                                        {index + 1}
                                                    </span>
                                                    <div>
                                                        <div className="font-black text-base text-gray-800">{score.playerName}</div>
                                                        <div className="text-sm text-gray-600 font-bold">
                                                            {score.difficulty === 'easy' ? '😊' : score.difficulty === 'medium' ? '😤' : '🔥'} {score.date}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="font-black text-xl text-blue-600">{score.score}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={startGame}
                                className="bg-blue-600 text-white px-12 py-5 rounded-2xl text-2xl font-black hover:bg-blue-700 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:scale-105 border-2 border-white"
                            >
                                🚀 เริ่มเกม!
                            </button>

                            {/* ปุ่มลบคะแนนทั้งหมด */}
                            {highScores.length > 0 && (
                                <button
                                    onClick={() => {
                                        if (confirm('คุณต้องการลบคะแนนทั้งหมดใช่หรือไม่?')) {
                                            setHighScores([]);
                                            localStorage.removeItem('mathGameHighScores');
                                            showNotification('info', 'ลบคะแนนทั้งหมดเรียบร้อยแล้ว');
                                        }
                                    }}
                                    className="mt-6 text-red-600 hover:text-red-700 text-base font-black underline hover:no-underline transition-all"
                                >
                                    🗑️ ลบคะแนนทั้งหมด
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {gameStatus === 'playing' && (
                    <div className="space-y-6">
                        {/* แสดงผลตอบถูก/ผิด */}
                        {showCorrect && (
                            <div className="text-center p-6 bg-green-200 border-3 border-green-400 rounded-2xl shadow-lg">
                                <span className="text-green-800 font-black text-2xl">
                                    ✨ ถูกต้อง! +{getDifficultyMultiplier()} คะแนน 🎉
                                </span>
                            </div>
                        )}
                        {showIncorrect && (
                            <div className="text-center p-6 bg-red-200 border-3 border-red-400 rounded-2xl shadow-lg">
                                <span className="text-red-800 font-black text-2xl">
                                    💔 ผิด! คำตอบคือ {problem.answer} 
                                </span>
                            </div>
                        )}

                        {/* สถิติเกม */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 border-blue-200">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <ClockIcon />
                                    <span className="font-black text-3xl text-red-600">
                                        {timeLeft}s ⏰
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <StarIcon />
                                    <span className="font-black text-3xl text-amber-600">
                                        {score} คะแนน 🏆
                                    </span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-300 rounded-full h-4 mb-2 border-2 border-gray-400">
                                <div 
                                    className="bg-blue-500 h-4 rounded-full transition-all duration-1000 border border-white"
                                    style={{ width: `${(timeLeft / 60) * 100}%` }}
                                />
                            </div>
                            <p className="text-center text-gray-700 font-bold mt-2">เวลาคงเหลือ</p>
                        </div>

                        {/* โจทย์ */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-10 shadow-2xl text-center border-2 border-amber-200">
                            <div className="text-8xl font-black text-gray-800 mb-8 leading-tight">
                                {problem.num1} {problem.operator} {problem.num2} = ?
                            </div>
                            
                            <form onSubmit={handleAnswerSubmit}>
                                <input
                                    type="number"
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    placeholder="คำตอบ"
                                    className="w-full text-center text-4xl font-black p-6 border-3 border-blue-300 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 mb-6 bg-white/90 placeholder-gray-500"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!userAnswer}
                                    className="w-full bg-blue-600 text-white py-5 rounded-2xl text-2xl font-black hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl border-2 border-white"
                                >
                                    ส่งคำตอบ
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {gameStatus === 'finished' && (
                    <div className="text-center">
                        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg">
                            {isHighScore(score) ? (
                                <div className="text-6xl mb-4">�</div>
                            ) : (
                                <div className="text-6xl mb-4">�🎉</div>
                            )}
                            <h2 className="text-3xl font-bold text-gray-800 mb-4">เกมจบแล้ว!</h2>
                            <div className="text-5xl font-bold text-blue-600 mb-4">{score} คะแนน</div>
                            
                            {/* แสดงข้อมูลผู้เล่น */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                                <div className="text-sm text-gray-600 mb-2">
                                    ผู้เล่น: <span className="font-bold">{playerName || 'ผู้เล่นไม่ประสงค์ออกนาม'}</span>
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                    ระดับ: <span className="font-bold">
                                        {difficulty === 'easy' ? '😊 ง่าย' : 
                                         difficulty === 'medium' ? '😤 ปานกลาง' : '🔥 ยาก'}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                    วันที่: <span className="font-bold">{new Date().toLocaleDateString('th-TH')}</span>
                                </div>
                            </div>

                            {isHighScore(score) && (
                                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                    <h3 className="text-lg font-bold text-yellow-800 mb-2">🎊 คะแนนสูงสุดใหม่!</h3>
                                    <p className="text-yellow-700">คุณติดอันดับ Top 5 แล้ว!</p>
                                </div>
                            )}

                            <p className="text-2xl text-gray-700 mb-10 font-black leading-relaxed">
                                {getScoreMessage()}
                            </p>

                            {/* แสดงคะแนนสูงสุด 5 อันดับ */}
                            {highScores.length > 0 && (
                                <div className="mb-8 p-6 bg-amber-100 border-3 border-amber-300 rounded-2xl shadow-lg">
                                    <h3 className="text-2xl font-black text-gray-800 mb-4 flex items-center justify-center gap-2">
                                        🏆 Top 5 คะแนนสูงสุด
                                    </h3>
                                    <div className="space-y-3">
                                        {highScores.map((highScore, index) => (
                                            <div key={index} className={`flex items-center justify-between p-3 rounded-xl border-2 ${
                                                highScore.score === score && highScore.date === new Date().toLocaleDateString('th-TH')
                                                    ? 'bg-yellow-200 border-yellow-400 shadow-md' 
                                                    : 'bg-white/90 border-amber-200'
                                            }`}>
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-black ${
                                                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                        index === 1 ? 'bg-gray-300 text-gray-700' :
                                                        index === 2 ? 'bg-orange-300 text-orange-900' :
                                                        'bg-blue-200 text-blue-800'
                                                    }`}>
                                                        {index + 1}
                                                    </span>
                                                    <div>
                                                        <div className="font-black text-base text-gray-800">{highScore.playerName}</div>
                                                        <div className="text-sm text-gray-600 font-bold">
                                                            {highScore.difficulty === 'easy' ? '😊' : 
                                                             highScore.difficulty === 'medium' ? '😤' : '🔥'} {highScore.date}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="font-black text-xl text-blue-600">{highScore.score}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-5">
                                <button
                                    onClick={resetGame}
                                    className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white py-5 rounded-2xl text-2xl font-black hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:scale-105 border-2 border-white"
                                >
                                    🔄 เล่นอีกครั้ง ✨
                                </button>
                                <Link href="/dashboard">
                                    <button className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-5 rounded-2xl text-xl font-black hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg border-2 border-white">
                                        🏠 กลับหน้าหลัก
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
