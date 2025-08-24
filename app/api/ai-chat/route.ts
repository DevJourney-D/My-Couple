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
  
  // ตรวจสอบประเภทคำขอพิเศษ
  if (lowerMessage.includes('เล่านิทาน') || lowerMessage.includes('นิทาน') || lowerMessage.includes('เรื่องเล่า')) {
    return { problemType: 'story', severity: 'normal', needs: ['entertainment'] };
  } else if (lowerMessage.includes('ตลก') || lowerMessage.includes('มุก') || lowerMessage.includes('ฮา') || lowerMessage.includes('ขำ')) {
    return { problemType: 'joke', severity: 'normal', needs: ['entertainment'] };
  } else if (lowerMessage.includes('แปล') || lowerMessage.includes('translate') || lowerMessage.includes('ภาษา')) {
    return { problemType: 'translate', severity: 'normal', needs: ['translation'] };
  } else if (lowerMessage.includes('คำนวณ') || lowerMessage.includes('คิดเลข') || lowerMessage.includes('บวก') || 
             lowerMessage.includes('ลบ') || lowerMessage.includes('คูณ') || lowerMessage.includes('หาร') ||
             /\d+\s*[\+\-\*\/]\s*\d+/.test(lowerMessage)) {
    return { problemType: 'math', severity: 'normal', needs: ['calculation'] };
  } else if (lowerMessage.includes('เกม') || lowerMessage.includes('เล่น') || lowerMessage.includes('สนุก')) {
    return { problemType: 'game', severity: 'normal', needs: ['entertainment'] };
  } else if (lowerMessage.includes('สูตรอาหาร') || lowerMessage.includes('ทำอาหาร') || lowerMessage.includes('เมนู')) {
    return { problemType: 'recipe', severity: 'normal', needs: ['advice'] };
  } else if (lowerMessage.includes('แนะนำ') && (lowerMessage.includes('เดท') || lowerMessage.includes('เที่ยว') || lowerMessage.includes('ที่เที่ยว'))) {
    return { problemType: 'date_idea', severity: 'normal', needs: ['advice'] };
  }
  
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

    // ดึงข้อมูลผู้ใช้เพื่อเอาชื่อมาใช้
    const { data: userData, error: userError } = await supabase
      .from('custom_users')
      .select('username')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
      aiResponse = getFallbackResponse(message, emotionAnalysis, context, userData.username);
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
                content: `คุณคือ "ลูกพีช" เพื่อนสนิท AI ที่อบอุ่น น่ารัก เก่งหลายเรื่อง และเข้าใจความรู้สึกมากๆ 💕

🎯 ความสามารถของคุณ:
1. ที่ปรึกษาความรัก และความรู้สึก
2. เล่านิทาน เรื่องสั้น ที่น่ารักและโรแมนติก
3. เล่นมุกตลก เรื่องขำๆ ที่ไม่หยาบคาย
4. แปลภาษา (ไทย-อังกฤษ และอื่นๆ)
5. คิดเลข คำนวณ แก้โจทย์คณิตศาสตร์
6. แนะนำไอเดียเดท สถานที่เที่ยว
7. สูตรอาหาร และเคล็ดลับทำอาหาร
8. เล่นเกมง่ายๆ ปริศนา ทายปัญหา

📊 ข้อมูลผู้ใช้:
- ชื่อ: ${userData.username}
- อารมณ์: ${emotionAnalysis.primary} (${emotionAnalysis.intensity}/10)
- ประเภทคำขอ: ${context.problemType}
- ต้องการ: ${context.needs.join(', ')}

⚡ สไตล์การตอบ:
- เรียกชื่อผู้ใช้ "คุณ${userData.username}" เสมอ
- พูดแบบเพื่อนสนิท ไม่เป็นทางการ
- ใส่อารมณ์ความรู้สึกในคำตอบ
- ตอบสั้น ประมาณ 40-80 คำ (ยกเว้นนิทานหรือสูตรอาหาร)
- ใช้อีโมจิประกอบ
- แสดงความเข้าใจและส่งกำลังใจ

🎪 กฎพิเศษตามประเภทคำขอ:
- นิทาน: เล่นสั้นๆ 3-4 ประโยค มีบทเรียนหรือความหวาน
- มุกตลก: ตลกสะอาด เหมาะสำหรับคู่รัก
- แปลภาษา: แปลแล้วอธิบายเพิ่มเติมนิดหน่อย
- คิดเลข: อธิบายขั้นตอนแบบเข้าใจง่าย
- ไอเดียเดท: เสนอ 2-3 ไอเดียที่ทำได้จริง
- สูตรอาหาร: ให้วิธีแบบง่ายๆ ที่มือใหม่ทำได้

ตัวอย่าง: "คุณ${userData.username} อยากฟังนิทานเหรอ? � มีเรื่องดีๆ เล่าให้ฟัง..."

จำไว้: ต้องเป็นเพื่อนที่อบอุ่น ไม่ใช่หมอหรือครู แต่เก่งในหลายเรื่อง!`
              },
              {
                role: 'user',
                content: message
              }
            ],
            temperature: 0.8,
            max_tokens: 120,
            top_p: 0.95,
            frequency_penalty: 0.2,
            presence_penalty: 0.3
          }),
        });

        if (!response.ok) {
          aiResponse = getFallbackResponse(message, emotionAnalysis, context, userData.username);
          responseSource = 'fallback';
        } else {
          const data = await response.json();
          aiResponse = data.choices?.[0]?.message?.content || getFallbackResponse(message, emotionAnalysis, context, userData.username);
          responseSource = 'openai';
        }
      } catch {
        aiResponse = getFallbackResponse(message, emotionAnalysis, context, userData.username);
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
    // ใช้ fallback response ที่เรียกชื่อผู้ใช้
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

// ระบบตอบกลับที่ปรับปรุงใหม่ - สั้น กระชับ เป็นธรรมชาติ พร้อมเรียกชื่อ
function getFallbackResponse(message: string, emotion: EmotionAnalysis, context: ContextAnalysis, username: string): string {
  const lowerMessage = message.toLowerCase();
  
  // คำทักทาย
  if (lowerMessage.includes('สวัสดี') || lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
    const greetings = [
      `สวัสดีค่ะคุณ${username}! ฉันลูกพีช พร้อมฟังและช่วยเรื่องความรัก หรือจะเล่นมุก เล่านิทาน ก็ได้นะ 💕`,
      `หวัดดีค่ะคุณ${username}! วันนี้เป็นยังไงบ้าง? ฉันพร้อมคุยทุกเรื่อง ตั้งแต่ความรักไปจนถึงแปลภาษา 😊`,
      `สวัสดีจ้าคุณ${username}! ฉันลูกพีช เพื่อนที่เก่งหลายเรื่อง มีอะไรให้ช่วยมั้ย? เล่านิทาน คิดเลข หรือเล่นมุกก็ได้ 🌸`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // ถ้าเป็นคำถาม เกี่ยวกับตัวเอง
  if (lowerMessage.includes('คุณคือใคร') || lowerMessage.includes('ลูกพีช') || lowerMessage.includes('แนะนำตัว')) {
    return `ฉันลูกพีชค่ะคุณ${username}! เป็น AI เพื่อนคุยที่เก่งหลายเรื่อง 🥰 ทั้งให้คำปรึกษาความรัก เล่านิทาน เล่นมุก แปลภาษา คิดเลข แนะนำไอเดียเดท ยังไงก็เล่าให้ฟังได้นะ`;
  }

  // ความสามารถพิเศษใหม่
  if (context.problemType === 'story') {
    const stories = [
      `คุณ${username} มีนิทานสั้นเล่าให้ฟัง 📚 "กาลครั้งหนึ่ง มีคู่รักที่ทะเลาะกันทุกวัน แต่แล้ววันหนึ่งพวกเขาก็เรียนรู้ว่า การฟังกันสำคัญกว่าการถูก และพวกเขาก็มีความสุขตลอดไป" จบแล้ว หวานมั้ยคะ? 💕`,
      `คุณ${username} เอานิทานสำหรับคู่รักมาฝาก 🌙 "ดวงจันทร์กับดวงดาว รักกันมาก แต่อยู่ห่างกัน แต่พวกเขารู้ว่าถึงจะไม่ได้อยู่ใกล้กัน แต่หัวใจพวกเขาเชื่อมกันเสมอ" เหมือนคนรักที่อยู่ไกลกันนะคะ ✨`,
      `คุณ${username} นิทานสั้นๆ เล่าให้ฟัง 🦋 "ผีเสื้อตัวหนึ่งบินหาดอกไม้ที่สวยที่สุด หาไปนานมาก สุดท้ายเจอว่า ดอกไม้ที่สวยที่สุดคือดอกที่อยู่ข้างๆ ตัวเองตลอด" เหมือนความรักที่อยู่ใกล้ตัวเรานะคะ 🌺`
    ];
    return stories[Math.floor(Math.random() * stories.length)];
  }

  if (context.problemType === 'joke') {
    const jokes = [
      `คุณ${username} เอามุกมาฝากแล้ว! 😄 "ทำไมคนรักถึงชอบกินไอศกรีม? เพราะว่า...หวานเหมือนกัน!" อิอิ ขำมั้ยคะ?`,
      `คุณ${username} มีมุกสำหรับคู่รัก 🤭 "คนรักเหมือนWi-Fi ทำไม? เพราะ...ไม่มีรหัสผ่านก็เชื่อมต่อไม่ได้!" แล้วต้องเอารหัสใจมาใส่ด้วย 💕`,
      `คุณ${username} เล่นมุกสั้นๆ ให้ฟัง 😂 "ความรักเหมือนการดูดราม่า ทำไม? เพราะ...เราจะดูตอนต่อไปตลอด!" ไม่รู้จบเลยใช่มั้ยคะ`,
      `คุณ${username} มุกอีกแล้ว! 🙈 "ทำไมคู่รักถึงชอบไปดูหนัง? เพราะว่า...ได้นั่งข้างกันในที่มืดๆ โดยไม่ต้องอาย!" โรแมนติกดีนะคะ`
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  if (context.problemType === 'translate') {
    return `คุณ${username} อยากแปลอะไรคะ? บอกมาเลย! 🌐 ฉันแปลได้ทั้งไทย-อังกฤษ และภาษาอื่นๆ ด้วย แค่บอกว่า "แปล [ข้อความ] เป็น [ภาษา]" ก็ได้แล้ว ง่ายมากเลย ✨`;
  }

  if (context.problemType === 'math') {
    // ลองคำนวณถ้าเป็นสมการง่ายๆ
    const mathMatch = lowerMessage.match(/(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)/);
    if (mathMatch) {
      const [, num1, operator, num2] = mathMatch;
      const n1 = parseFloat(num1);
      const n2 = parseFloat(num2);
      let result;
      let opText;
      
      switch (operator) {
        case '+': result = n1 + n2; opText = 'บวก'; break;
        case '-': result = n1 - n2; opText = 'ลบ'; break;
        case '*': result = n1 * n2; opText = 'คูณ'; break;
        case '/': result = n2 !== 0 ? n1 / n2 : 'ไม่สามารถหารด้วยศูนย์ได้'; opText = 'หาร'; break;
        default: result = 'ไม่เข้าใจ'; opText = '';
      }
      
      if (typeof result === 'number') {
        return `คุณ${username} คำนวณให้แล้ว! 🧮 ${num1} ${opText} ${num2} = ${result} ง่ายมากเลยนะคะ เก่งด้วย! ✨`;
      }
    }
    return `คุณ${username} อยากให้คิดเลขอะไรคะ? 🤓 บอกโจทย์มาเลย ไม่ว่าจะบวก ลบ คูณ หาร หรือโจทย์คณิตศาสตร์ยากๆ ฉันช่วยได้นะ!`;
  }

  if (context.problemType === 'date_idea') {
    const dateIdeas = [
      `คุณ${username} อยากไอเดียเดทเหรอ? 💡 ลองไป "ดูหนังที่บ้าน + สั่งพิซซ่า + เล่นเกม" สบายๆ แต่หวานมาก หรือ "ไปตลาดนัด + กินข้าวข้างทาง + เดินเล่น" ก็ดีเหมือนกันค่ะ`,
      `คุณ${username} เอาไอเดียเดทมาฝาก! 🌟 "ทำอาหารด้วยกัน + ดูซีรีส์" หรือ "ปิกนิกในสวน + ถ่ายรูปกัน" หรือ "ไปคาเฟ่น่ารักๆ + อ่านหนังสือ" เลือกแบบไหนก็หวานแน่นอน`,
      `คุณ${username} ไอเดียเดทง่ายๆ มาแล้ว 💕 "เดินเล่นช่วงเย็นๆ + กินไอศกรีม" หรือ "ไปช็อปปิ้ง + ดูของน่ารักๆ ด้วยกัน" หรือ "อยู่บ้าน + ฟังเพลง + คุยกัน" ก็โรแมนติกดีนะ`
    ];
    return dateIdeas[Math.floor(Math.random() * dateIdeas.length)];
  }

  if (context.problemType === 'recipe') {
    const recipes = [
      `คุณ${username} อยากทำอาหารเหรอ? 👩‍🍳 แนะนำ "ไข่เจียวง่ายๆ" เอาไข่ 2 ฟอง + น้ำปลา + น้ำมัน ตีให้เข้ากัน แล้วทอดในกระทะใส่น้ำมันร้อนๆ กินกับข้าวสวยอร่อยมาก! ลองทำให้คนรักดูมั้ย? 😊`,
      `คุณ${username} เมนูง่ายๆ มาแล้ว! 🍝 "สปาเก็ตตี้เบสิค" ต้มเส้น + ผัดกับซอสพาสต้า + ใส่หมูหรือไก่ + ชีส ใส่ผักก็ได้ ทำแล้วกินด้วยกันโรแมนติกดีเลย`,
      `คุณ${username} สูตรหวานๆ เอามาฝาก 🧁 "ปาดหม้อง่ายๆ" นมสด + ไข่ + น้ำตาล + แป้ง นวดแล้วนึ่ง เป็นของหวานให้คนรักกินกัน หวานเหมือนความรักเลย!`
    ];
    return recipes[Math.floor(Math.random() * recipes.length)];
  }

  if (context.problemType === 'game') {
    const games = [
      `คุณ${username} เล่นเกมกันมั้ย? 🎮 ฉันออกปริศนา: "อะไรที่ยิ่งให้ ยิ่งมีเยอะ?" คิดดู ตอบมาเลย! (คำใบ้: เกี่ยวกับความรัก 💕)`,
      `คุณ${username} มาเล่นทายคำกันเถอะ! 🧩 "มี 4 ขา ตอนเช้า มี 2 ขา ตอนบ่าย มี 3 ขา ตอนเย็น คืออะไร?" คิดดูนะ!`,
      `คุณ${username} เกมง่ายๆ มาแล้ว! 🎯 ฉันคิดตัวเลข 1-10 ลองทายดู! หรือจะให้ฉันทายอายุคุณดีมั้ย? เล่นกันเป็น!`
    ];
    return games[Math.floor(Math.random() * games.length)];
  }

  // ตอบตามอารมณ์และปัญหาความรัก (เก่า)
  const responses = {
    sad: {
      conflict: `คุณ${username} เข้าใจว่าเจ็บใจมากเลย 😢 ความทะเลาะเป็นเรื่องปกติ ลองพักสักครู่แล้วคุยกันตอนใจเย็นๆ ดีมั้ยคะ? ขอกอดหน่อยนะ 🤗`,
      communication: `คุณ${username} รู้ว่าเศร้าที่ไม่เข้าใจกัน 💙 ลองเริ่มจากการฟังกันก่อนค่ะ บอกความรู้สึกตรงๆ แต่ด้วยความรัก เดี๋ยวก็ดีขึ้นแน่นอน`,
      trust: `คุณ${username} ความไม่ไว้ใจทำให้เจ็บใจจริงๆ 💔 แต่ถ้ารักกันจริงยังแก้ได้ ลองคุยกันตรงๆ แล้วให้โอกาสกัน ใช้เวลาหน่อยค่ะ`,
      general: `คุณ${username} เข้าใจว่าเศร้านะ 😔 ความรักมีขึ้นๆ ลงๆ เป็นเรื่องปกติ ลองดูแลตัวเองก่อนแล้วค่อยแก้ปัญหา ทุกอย่างจะผ่านไปค่ะ 🌷`
    },
    angry: {
      conflict: `คุณ${username} รู้ว่าโกรธมากๆ เลย 😤 แต่อย่าตัดสินใจตอนนี้นะ ลองหายใจลึกๆ พอใจเย็นแล้วค่อยคุยกัน การทะเลาะไม่ได้แก้อะไรหรอกค่ะ`,
      communication: `คุณ${username} ความโกรธมาจากการไม่เข้าใจกัน 🧡 หยุดพักสักครู่ แล้วลองคุยกันใหม่ด้วยเสียงเบาๆ ฟังเหตุผลกันและกันดูนะคะ`,
      general: `คุณ${username} โกรธเป็นเรื่องปกติ แต่อย่าให้มันทำลายความรัก 🌊 ลองหาที่ระบายอารมณ์ก่อน แล้วค่อยแก้ปัญหา ใจเย็นๆ นะคะ`
    },
    worried: {
      trust: `คุณ${username} ความกังวลเรื่องความไว้ใจเข้าใจได้ค่ะ 🌱 ลองคุยกันตรงๆ เปิดใจให้กัน ความไว้ใจสร้างได้ถ้าทั้งคู่ตั้งใจ ค่อยๆ ทำกันนะ`,
      general: `คุณ${username} ความกังวลแสดงว่าใส่ใจความสัมพันธ์มาก 💛 ลองโฟกัสที่สิ่งที่ควบคุมได้ คุยกับคนรักเปิดใจ แบ่งปันความรู้สึกดูค่ะ`
    },
    happy: {
      general: `คุณ${username} ดีใจด้วยที่มีความสุข! 🌟 ขอให้เก็บความรู้สึกดีๆ นี้ไว้นานๆ แบ่งปันความสุขกับคนรัก สร้างความทรงจำดีๆ ด้วยกันนะคะ`
    },
    confused: {
      communication: `คุณ${username} รู้สึกสับสนเป็นเรื่องปกติค่ะ 🔮 ลองถามคำถามตรงๆ กับคนรัก การคุยกันเปิดใจจะทำให้เห็นภาพชัดขึ้น อย่าเก็บไว้คนเดียวนะ`,
      general: `คุณ${username} เมื่อสับสน ลองกลับไปดูพื้นฐานของความรัก ⭐ ถามตัวเองว่าอะไรสำคัญที่สุด ค่อยๆ หาคำตอบทีละขั้นตอน ไม่ต้องรีบค่ะ`
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

  // คำตอบทั่วไปที่สั้นและกระชับพร้อมเรียกชื่อ
  const generalResponses = [
    `คุณ${username} เข้าใจความรู้สึกค่ะ 💕 ถ้าเป็นเรื่องความรัก ฉันพร้อมช่วย หรือจะเล่นมุก เล่านิทาน คิดเลข ก็ได้นะ มีอะไรบอกมาเลย!`,
    `คุณ${username} ฉันพร้อมฟังทุกเรื่องค่ะ 🌸 ไม่ว่าจะปรึกษาเรื่องความรัก หรือจะให้ความบันเทิง แปลภาษา อะไรก็ได้ เล่ามาเลยจ้า`,
    `คุณ${username} วันนี้เป็นยังไงบ้างคะ? ✨ ฉันพร้อมคุยทุกเรื่อง ตั้งแต่ความรักไปจนถึงเรื่องสนุกๆ มีอะไรให้ช่วยบอกมาเลยนะ`,
    `คุณ${username} ฉันเป็นเพื่อนที่เก่งหลายเรื่องนะ 😊 ทั้งให้คำปรึกษา เล่าเรื่องขำๆ คิดเลข หรือแม้กระทั่งแนะนำสูตรอาหาร เล่ามาได้เลย!`,
    `คุณ${username} มีอะไรให้ช่วยมั้ยคะ? 💫 ไม่ว่าจะเป็นเรื่องใจ เรื่องสนุก หรือเรื่องเรียน ฉันพร้อมช่วยและเป็นเพื่อนคุยเสมอนะ`
  ];
  
  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
}
