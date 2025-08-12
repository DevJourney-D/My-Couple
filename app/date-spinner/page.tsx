'use client';

import { useState } from 'react';

interface DateIdea {
  id: number;
  idea: string;
}

export default function DateSpinner() {
  const [ideas, setIdeas] = useState<DateIdea[]>([
    { id: 1, idea: 'ไปดูหนัง' },
    { id: 2, idea: 'ไปกินข้าว' },
    { id: 3, idea: 'เดินเล่นในสวน' },
    { id: 4, idea: 'ไปคาเฟ่' },
    { id: 5, idea: 'ไปตลาดนัด' },
  ]);
  const [newIdea, setNewIdea] = useState('');
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [paperPosition, setPaperPosition] = useState({ x: 0, y: 0 });
  const [showPaper, setShowPaper] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const addIdea = () => {
    if (newIdea.trim() && ideas.length < 10) {
      const newItem = {
        id: Date.now(),
        idea: newIdea.trim(),
      };
      setIdeas([...ideas, newItem]);
      setNewIdea('');
    }
  };

  const removeIdea = (id: number) => {
    setIdeas(ideas.filter(idea => idea.id !== id));
  };

  const drawRandomIdea = () => {
    if (ideas.length === 0) return;
    
    setIsAnimating(true);
    setShowPaper(true);
    
    // Animation: Paper rolling and dropping
    setTimeout(() => {
      setPaperPosition({ x: Math.random() * 100 - 50, y: 0 });
    }, 100);
    
    setTimeout(() => {
      setPaperPosition({ x: Math.random() * 20 - 10, y: 200 });
    }, 800);
    
    // Shake the bottle
    setTimeout(() => {
      setIsShaking(true);
    }, 1200);
    
    // Show result
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * ideas.length);
      setSelectedIdea(ideas[randomIndex].idea);
      setIsShaking(false);
      setShowPaper(false);
      setIsAnimating(false);
      setPaperPosition({ x: 0, y: 0 });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              fontSize: `${Math.random() * 20 + 10}px`,
            }}
          >
            {['💕', '💖', '✨', '🌸', '💝'][Math.floor(Math.random() * 5)]}
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            กลับหน้าหลัก
          </button>
          <h1 className="text-6xl font-bold mb-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            🧚‍♀️ ขวดมหัศจรรย์สุ่มเดท
          </h1>
          <p className="text-xl text-gray-600 font-medium">โยนกระดาษความปรารถนาลงขวดแล้วเขย่าเพื่อค้นหาเดทในฝัน! ✨</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Side - Magical Bottle */}
          <div className="flex flex-col items-center justify-center relative">
            
            {/* Animated Paper Dropping */}
            {showPaper && (
              <div 
                className="absolute z-30 transition-all duration-700 ease-out transform"
                style={{
                  transform: `translate(${paperPosition.x}px, ${paperPosition.y}px) rotate(${paperPosition.x * 3}deg)`,
                  top: '30px',
                  left: '50%',
                  marginLeft: '-30px'
                }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-300 rounded-full shadow-2xl border-4 border-yellow-400 flex items-center justify-center text-2xl font-bold transform hover:rotate-12 transition-transform animate-bounce">
                  💌
                </div>
              </div>
            )}

            {/* Ultra Cute Glass Bottle */}
            <div className={`relative transition-all duration-500 ${isShaking ? 'animate-wiggle' : ''}`}>
              
              {/* Bottle Container with Sparkles */}
              <div className="relative flex flex-col items-center">
                
                {/* Magical Sparkles around bottle */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-ping"
                      style={{
                        left: `${10 + i * 8}%`,
                        top: `${20 + (i % 3) * 25}%`,
                        animationDelay: `${i * 0.3}s`,
                        fontSize: '1.5rem'
                      }}
                    >
                      ✨
                    </div>
                  ))}
                </div>
                
                {/* Adorable Cork with ribbon */}
                <div className="relative mb-2">
                  <div className="w-20 h-10 bg-gradient-to-b from-pink-400 via-rose-500 to-pink-600 rounded-t-2xl shadow-xl border-4 border-pink-700 relative">
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-12 h-3 bg-pink-300 rounded-full opacity-80"></div>
                    {/* Cute ribbon bow */}
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-3xl">🎀</div>
                  </div>
                </div>
                
                {/* Elegant Bottle Neck with lace pattern */}
                <div className="w-16 h-16 bg-gradient-to-b from-purple-200 via-lavender-300 to-purple-300 border-4 border-purple-400 shadow-xl mb-3 relative rounded-lg">
                  <div className="absolute top-3 left-3 w-3 h-8 bg-white/50 rounded-full"></div>
                  {/* Lace pattern */}
                  <div className="absolute inset-1 border-2 border-white/30 rounded-lg border-dashed"></div>
                </div>
                
                {/* Main Bottle Body - Heart Shaped! */}
                <div className="relative">
                  {/* Heart-shaped bottle outline */}
                  <div className="w-48 h-80 relative">
                    {/* Heart shape using CSS */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-200/90 via-cyan-200/80 to-purple-300/90 shadow-2xl border-4 border-blue-300"
                         style={{
                           borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                           transform: 'rotate(-45deg)',
                           transformOrigin: 'center',
                         }}>
                    </div>
                    <div className="absolute top-0 left-12 w-24 h-24 bg-gradient-to-br from-blue-200/90 via-cyan-200/80 to-purple-300/90 rounded-full border-4 border-blue-300"></div>
                    <div className="absolute top-0 right-12 w-24 h-24 bg-gradient-to-br from-blue-200/90 via-cyan-200/80 to-purple-300/90 rounded-full border-4 border-blue-300"></div>
                    
                    {/* Content inside heart bottle */}
                    <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }}>
                      
                      {/* Magical Shimmer Effect */}
                      <div className="absolute top-12 left-8 w-8 h-48 bg-white/40 rounded-full transform -rotate-12 animate-pulse"></div>
                      <div className="absolute top-20 right-12 w-4 h-24 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      
                      {/* Enchanted Liquid */}
                      <div className="absolute bottom-0 left-0 right-0 h-4/5 bg-gradient-to-t from-pink-300/60 via-purple-200/50 to-blue-200/40 rounded-b-full">
                        {/* Liquid surface with rainbow effect */}
                        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-pink-400/50 via-purple-400/50 to-blue-400/50 rounded-full animate-pulse"></div>
                        
                        {/* Floating magical papers */}
                        {ideas.slice(0, 5).map((idea, index) => (
                          <div 
                            key={index}
                            className={`absolute transition-all duration-1000 ${isShaking ? 'animate-bounce' : 'animate-float'}`}
                            style={{
                              bottom: `${20 + index * 30}px`,
                              left: `${30 + (index % 2) * 80}px`,
                              transform: `rotate(${index * 25 - 45}deg) scale(0.9)`,
                              animationDelay: `${index * 0.3}s`,
                              zIndex: 15
                            }}
                          >
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-300 rounded-xl shadow-lg border-2 border-yellow-400 flex items-center justify-center text-sm font-bold transform hover:scale-110 transition-transform">
                                💝
                              </div>
                              {/* Glowing effect */}
                              <div className="absolute inset-0 w-10 h-10 bg-yellow-300/50 rounded-xl blur-sm animate-pulse"></div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Rainbow bubbles */}
                        <div className="absolute inset-0">
                          {[...Array(15)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute rounded-full animate-float"
                              style={{
                                left: `${10 + (i * 6)}%`,
                                top: `${30 + (i * 4)}%`,
                                width: `${8 + Math.random() * 8}px`,
                                height: `${8 + Math.random() * 8}px`,
                                background: `hsl(${i * 25}, 70%, 80%)`,
                                animationDelay: `${i * 0.4}s`,
                                opacity: 0.7
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Cute face on bottle */}
                      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 text-4xl">
                        😊
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottle Base with rainbow shadow */}
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-52 h-8 bg-gradient-to-r from-pink-400/30 via-purple-400/30 via-blue-400/30 to-cyan-400/30 rounded-full blur-lg"></div>
                </div>
              </div>
            </div>

            {/* Magical Shake Button */}
            <button
              onClick={drawRandomIdea}
              disabled={ideas.length === 0 || isAnimating}
              className={`mt-12 px-12 py-6 rounded-full font-bold text-2xl shadow-2xl transform transition-all duration-300 relative overflow-hidden ${
                ideas.length === 0 || isAnimating
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed scale-90'
                  : 'bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 to-cyan-500 text-white hover:scale-110 active:scale-95 animate-pulse'
              }`}
            >
              {/* Button sparkle effect */}
              {!isAnimating && ideas.length > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              )}
              
              {isAnimating ? (
                <span className="flex items-center gap-4">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  กำลังเสกมายากล...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  🌟 เขย่าขวดมหัศจรรย์! 🌟
                </span>
              )}
            </button>

            {/* Magical Result Display */}
            {selectedIdea && !isAnimating && (
              <div className="mt-10 p-8 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-3xl shadow-2xl border-4 border-pink-200 max-w-sm text-center transform animate-bounce relative overflow-hidden">
                {/* Sparkle background */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-ping"
                      style={{
                        left: `${10 + i * 12}%`,
                        top: `${10 + (i % 3) * 30}%`,
                        animationDelay: `${i * 0.2}s`,
                        fontSize: '1rem'
                      }}
                    >
                      ✨
                    </div>
                  ))}
                </div>
                
                <div className="relative z-10">
                  <div className="text-4xl mb-4">🎊✨🎉</div>
                  <div className="text-xl font-semibold text-gray-700 mb-3">🔮 คำทำนายเดทมหัศจรรย์ 🔮</div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 p-4 bg-white/80 rounded-2xl shadow-lg border-2 border-pink-200">
                    {selectedIdea}
                  </div>
                  <div className="text-lg text-gray-600 font-medium">💖 ขอให้มีความสุขเป็นกอบเป็นกำ! 💖</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Idea Management */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-pink-200 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-purple-100"></div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                🌈 จัดการไอเดียเดท 🌈
              </h2>

              {/* Add New Idea Section */}
              <div className="mb-8 p-6 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 rounded-2xl shadow-lg border-2 border-pink-200">
                <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  🎯 เพิ่มไอเดียใหม่ ✨
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newIdea}
                    onChange={(e) => setNewIdea(e.target.value)}
                    placeholder="เช่น ไปดูหนัง, ไปคาเฟ่น่ารัก, ปิกนิคในสวน... 💕"
                    className="flex-1 px-6 py-4 border-3 border-pink-300 rounded-2xl focus:outline-none focus:border-purple-400 transition-all shadow-lg text-gray-700 placeholder-gray-400 bg-white/90"
                    onKeyPress={(e) => e.key === 'Enter' && addIdea()}
                    maxLength={50}
                  />
                  <button
                    onClick={addIdea}
                    disabled={!newIdea.trim() || ideas.length >= 10}
                    className={`px-8 py-4 rounded-2xl font-bold transition-all shadow-lg ${
                      !newIdea.trim() || ideas.length >= 10
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 text-white hover:from-green-500 hover:via-emerald-600 hover:to-teal-700 transform hover:scale-105 active:scale-95'
                    }`}
                  >
                    ➕ เพิ่ม
                  </button>
                </div>
                <div className="text-sm text-gray-500 mt-3 text-center font-medium">
                  📝 {ideas.length}/10 ไอเดีย {ideas.length >= 10 && '(เต็มแล้ว! 🎉)'}
                </div>
              </div>

              {/* Ideas List */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                <h3 className="text-xl font-semibold text-gray-700 mb-4 sticky top-0 bg-white/90 backdrop-blur-sm py-3 rounded-xl shadow-md border border-pink-200 text-center">
                  📋 รายการไอเดียทั้งหมด ✨
                </h3>
                
                {ideas.map((idea, index) => (
                  <div
                    key={idea.id}
                    className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 rounded-2xl border-3 border-purple-200 hover:border-purple-300 hover:shadow-xl transition-all group transform hover:scale-[1.02] relative overflow-hidden"
                  >
                    {/* Background sparkle */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute animate-ping"
                          style={{
                            left: `${20 + i * 30}%`,
                            top: `${20 + i * 20}%`,
                            animationDelay: `${i * 0.2}s`,
                            fontSize: '0.8rem'
                          }}
                        >
                          ✨
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg transform group-hover:scale-110 transition-transform">
                        {index + 1}
                      </div>
                      <span className="text-gray-700 font-medium text-lg">{idea.idea}</span>
                    </div>
                    <button
                      onClick={() => removeIdea(idea.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-3 rounded-xl hover:bg-red-50 transform hover:scale-110 relative z-10"
                      title="ลบไอเดียนี้"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                {ideas.length === 0 && (
                  <div className="text-center py-20 text-gray-400">
                    <div className="text-8xl mb-6">🌟</div>
                    <div className="text-2xl font-medium mb-4">ยังไม่มีไอเดียเดทเลย</div>
                    <div className="text-xl mb-4">เริ่มต้นสร้างความมหัศจรรย์กันเถอะ!</div>
                    <div className="text-lg text-pink-500 font-medium">💡 ลองเริ่มด้วย &ldquo;ไปดูหนัง&rdquo; หรือ &ldquo;กินข้าวหรู&rdquo; สิ 💕</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced CSS for magical animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(1deg); }
          75% { transform: rotate(-1deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
