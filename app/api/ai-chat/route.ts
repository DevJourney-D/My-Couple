// app/api/ai-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

// ระบบวิเคราะห์อารมณ์แบบง่าย
interface EmotionAnalysis {
  primary: string;
  intensity: number;
  tone: string;
}

interface ContextAnalysis {
  problemType: string;
  severity: string;
  needs: string[];
}

function analyzeEmotion(message: string): EmotionAnalysis {
  const lowerMessage = message.toLowerCase();
  
  // คำหลักสำหรับวิเคราะห์อารมณ์
  const emotions = {
    sad: ['เศร้า', 'หดหู่', 'ผิดหวัง', 'เสียใจ', 'น้ำตา', 'ร้องไห้', 'เหงา'],
    angry: ['โกรธ', 'หงุดหงิด', 'รำคาญ', 'ขัดใจ', 'หัวเสีย'],
    worried: ['กังวล', 'เครียด', 'กลัว', 'ไม่แน่ใจ', 'ห่วง'],
    happy: ['มีความสุข', 'ดีใจ', 'สนุก', 'รัก', 'หวาน'],
    confused: ['งง', 'สับสน', 'ไม่เข้าใจ', 'ไม่รู้']
  };

  let primaryEmotion = 'neutral';
  let maxMatches = 0;
  
  for (const [emotion, keywords] of Object.entries(emotions)) {
    const matches = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      primaryEmotion = emotion;
    }
  }

  const intensity = Math.min(maxMatches * 3 + 2, 10);
  
  let tone = 'normal';
  if (lowerMessage.includes('!')) tone = 'urgent';
  else if (lowerMessage.includes('?')) tone = 'questioning';

  return { primary: primaryEmotion, intensity, tone };
}

function analyzeContext(message: string): ContextAnalysis {
  const lowerMessage = message.toLowerCase();
  
  let problemType = 'general';
  if (lowerMessage.includes('ทะเลาะ') || lowerMessage.includes('โต้เถียง')) {
    problemType = 'conflict';
  } else if (lowerMessage.includes('ไม่เข้าใจ') || lowerMessage.includes('คุย')) {
    problemType = 'communication';
  } else if (lowerMessage.includes('ไม่ไว้ใจ') || lowerMessage.includes('โกหก')) {
    problemType = 'trust';
  } else if (lowerMessage.includes('หึง') || lowerMessage.includes('อิจฉา')) {
    problemType = 'jealousy';
  }

  const severity = lowerMessage.includes('ทนไม่ไหว') || lowerMessage.includes('เลิก') ? 'high' : 'normal';
  
  const needs = [];
  if (lowerMessage.includes('ช่วย') || lowerMessage.includes('แนะนำ')) needs.push('advice');
  if (lowerMessage.includes('ฟัง') || lowerMessage.includes('เข้าใจ')) needs.push('support');

  return { problemType, severity, needs: needs.length > 0 ? needs : ['support'] };
}

export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // บันทึกข้อความของผู้ใช้
    const { error: userMessageError } = await supabase
      .from('ai_chat_messages')
      .insert({
        user_id: userId,
        role: 'user',
        content: message.trim()
      });

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
    }

    const openAiApiKey = process.env.OPENAI_API_KEY;
    const emotionAnalysis = analyzeEmotion(message);
    const context = analyzeContext(message);
    
    let aiResponse: string;
    let responseSource: string;
    
    if (!openAiApiKey) {
      aiResponse = getFallbackResponse(message, emotionAnalysis, context);
      responseSource = 'fallback';
    } else {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `คุณคือ "ลูกพีช" AI ที่ปรึกษาความรัก 💕

🎯 วิธีตอบ:
1. เข้าใจความรู้สึก (1 ประโยค)
2. คำแนะนำหลัก (1-2 ประโยค)
3. ขั้นตอนง่ายๆ (1 ประโยค)
4. กำลังใจ (1 ประโยค)

📊 ข้อมูลผู้ใช้:
- อารมณ์: ${emotionAnalysis.primary} (${emotionAnalysis.intensity}/10)
- ปัญหา: ${context.problemType}
- ต้องการ: ${context.needs.join(', ')}

⚡ กฎเหล็ก:
- ไม่เกิน 60 คำ
- ใช้ภาษาง่าย ไม่ซับซ้อน
- ใส่อีโมจิ 1 ตัว
- เน้นทางออกที่ทำได้จริง
- ไม่ใช้คำเทคนิค

ตอบแบบเพื่อนที่เข้าใจ ไม่ใช่หมอ`
              },
              {
                role: 'user',
                content: message
              }
            ],
            temperature: 0.6,
            max_tokens: 100,
            top_p: 0.9,
            frequency_penalty: 0.3,
            presence_penalty: 0.2
          }),
        });

        if (!response.ok) {
          aiResponse = getFallbackResponse(message, emotionAnalysis, context);
          responseSource = 'fallback';
        } else {
          const data = await response.json();
          aiResponse = data.choices?.[0]?.message?.content || getFallbackResponse(message, emotionAnalysis, context);
          responseSource = 'openai';
        }
      } catch {
        aiResponse = getFallbackResponse(message, emotionAnalysis, context);
        responseSource = 'fallback';
      }
    }

    // บันทึกข้อความของ AI
    const { error: aiMessageError } = await supabase
      .from('ai_chat_messages')
      .insert({
        user_id: userId,
        role: 'model',
        content: aiResponse
      });

    if (aiMessageError) {
      console.error('Error saving AI message:', aiMessageError);
    }

    return NextResponse.json({ 
      response: aiResponse,
      source: responseSource,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Chat API error:', error);
    const fallbackResponse = "เข้าใจความรู้สึกคุณค่ะ ลองคุยกับคนรักด้วยใจเย็นดู การสื่อสารที่ดีเริ่มจากการฟังกัน 💕";
    return NextResponse.json({ 
      response: fallbackResponse,
      source: 'fallback'
    }, { status: 200 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await supabase
      .from('ai_chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get paginated messages
    const { data: messages, error } = await supabase
      .from('ai_chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }

    return NextResponse.json({ 
      messages: messages || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page * limit < (count || 0),
        hasPrev: page > 1
      }
    });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ระบบตอบกลับที่ปรับปรุงใหม่ - สั้น กระชับ เป็นธรรมชาติ
function getFallbackResponse(message: string, emotion: EmotionAnalysis, context: ContextAnalysis): string {
  const lowerMessage = message.toLowerCase();
  
  // คำทักทาย
  if (lowerMessage.includes('สวัสดี') || lowerMessage.includes('hi')) {
    return "สวัสดีค่ะ! ฉันลูกพีช พร้อมฟังและช่วยเรื่องความรัก มีอะไรปรึกษาไหมคะ? 💕";
  }

  // ตอบตามอารมณ์และปัญหา
  const responses = {
    sad: {
      conflict: "เข้าใจว่าเจ็บปวด ความขัดแย้งเป็นเรื่องปกติ ลองหยุดพักแล้วคุยกันใหม่ตอนใจเย็น อย่าเก็บไว้คนเดียวนะคะ 💙",
      communication: "รู้สึกเศร้าที่ไม่เข้าใจกัน ลองเริ่มจากการฟังกันก่อน บอกความรู้สึกตรงๆ แต่ด้วยความรัก เดี๋ยวก็ดีขึ้น 🌸",
      trust: "ความไม่ไว้ใจทำให้เจ็บใจจริงๆ แต่ถ้ารักกันจริงยังแก้ได้ ลองคุยกันตรงๆ และให้โอกาสกัน ใช้เวลาหน่อย 💝",
      general: "เข้าใจว่าเศร้า ความรักมีขึ้นลงเป็นเรื่องปกติ ลองดูแลตัวเองก่อนแล้วค่อยแก้ปัญหา ทุกอย่างจะผ่านไป 🌷"
    },
    angry: {
      conflict: "รู้ว่าโกรธมาก แต่อย่าตัดสินใจตอนนี้ ลองหายใจลึกๆ แล้วคิดดูว่าอะไรสำคัญที่สุด การทะเลาะไม่ได้แก้อะไร 🧡",
      communication: "ความโกรธมาจากการไม่เข้าใจกัน หยุดพักสักครู่ แล้วลองคุยกันใหม่ด้วยเสียงเบาๆ ฟังเหตุผลกันและกัน 💭",
      general: "โกรธเป็นเรื่องปกติ แต่อย่าให้มันทำลายความรัก ลองหาที่ระบายอารมณ์ก่อน แล้วค่อยแก้ปัญหา ใจเย็นๆ นะ 🌊"
    },
    worried: {
      trust: "ความกังวลเรื่องความไว้ใจเข้าใจได้ ลองคุยกันตรงๆ เปิดใจให้กัน ความไว้ใจสร้างได้ถ้าทั้งคู่ตั้งใจ ค่อยๆ ทำกัน 🌱",
      general: "ความกังวลแสดงว่าคุณใส่ใจความสัมพันธ์ ลองโฟกัสที่สิ่งที่ควบคุมได้ คุยกับคนรักเปิดใจ แบ่งปันความรู้สึก 💛"
    },
    happy: {
      general: "ดีใจด้วยที่มีความสุข! ขอให้เก็บความรู้สึกดีๆ นี้ไว้นานๆ แบ่งปันความสุขกับคนรัก สร้างความทรงจำดีๆ ด้วยกัน 🌟"
    },
    confused: {
      communication: "รู้สึกสับสนเป็นเรื่องปกติ ลองถามคำถามตรงๆ กับคนรัก การคุยกันเปิดใจจะทำให้เห็นภาพชัดขึ้น อย่าเก็บไว้คนเดียว 🔮",
      general: "เมื่อสับสน ลองกลับไปดูพื้นฐานของความรัก ถามตัวเองว่าอะไรสำคัญที่สุด ค่อยๆ หาคำตอบทีละขั้นตอน ไม่ต้องรีบ ⭐"
    }
  };

  // เลือกคำตอบตามอารมณ์และปัญหา
  const emotionResponses = responses[emotion.primary as keyof typeof responses];
  if (emotionResponses) {
    const contextResponse = emotionResponses[context.problemType as keyof typeof emotionResponses] || 
                           emotionResponses.general || 
                           emotionResponses[Object.keys(emotionResponses)[0] as keyof typeof emotionResponses];
    if (contextResponse) return contextResponse;
  }

  // คำตอบทั่วไปที่สั้นและกระชับ
  const generalResponses = [
    "เข้าใจความรู้สึกคุณค่ะ ความรักต้องใช้เวลาดูแลกัน ลองคุยกันตรงๆ ด้วยใจที่เข้าใจ ทุกปัญหาแก้ได้ 💕",
    "ปัญหาในความรักเป็นเรื่องปกติ สิ่งสำคัญคือแก้ไขด้วยกัน ลองฟังกันก่อนตัดสิน แล้วหาทางออกที่ดีที่สุด 🌸",
    "รู้ว่าลำบากใจ แต่การผ่านอุปสรรคด้วยกันจะทำให้รักกันมากขึ้น ลองอดทนหน่อย แล้วคุยกันด้วยความรัก ✨"
  ];
  
  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
}
