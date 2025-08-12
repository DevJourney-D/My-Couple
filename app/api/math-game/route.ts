// app/api/math-game/route.ts
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

// POST - บันทึกคะแนนเกม
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

    const { score } = await request.json();

    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json({ error: 'Valid score is required' }, { status: 400 });
    }

    // บันทึกคะแนนใหม่
    const { data: newScore, error: insertError } = await supabase
      .from('math_game_scores')
      .insert({
        user_id: userId,
        score: score
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving score:', insertError);
      return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
    }

    // ดึงคะแนนสูงสุดของผู้ใช้
    const { data: highScores, error: fetchError } = await supabase
      .from('math_game_scores')
      .select('score, played_at')
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error('Error fetching high scores:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch high scores' }, { status: 500 });
    }

    // บันทึก system log
    await supabase
      .from('system_logs')
      .insert({
        user_id: userId,
        action: 'MATH_GAME_SCORE_SAVED',
        level: 'INFO',
        details: {
          score: score,
          is_new_high_score: highScores && highScores.length > 0 ? score >= highScores[0].score : true,
          timestamp: new Date().toISOString()
        }
      });

    return NextResponse.json({ 
      success: true,
      newScore: newScore,
      highScores: highScores || []
    });

  } catch (error) {
    console.error('Math Game API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - ดึงคะแนนสูงสุด
export async function GET(request: NextRequest) {
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

    // ดึงคะแนนสูงสุดของผู้ใช้
    const { data: userHighScores, error: userError } = await supabase
      .from('math_game_scores')
      .select('score, played_at')
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(10);

    if (userError) {
      console.error('Error fetching user high scores:', userError);
      return NextResponse.json({ error: 'Failed to fetch user scores' }, { status: 500 });
    }

    // ดึงคะแนนสูงสุดของทุกคน (Global Leaderboard)
    const { data: globalHighScores, error: globalError } = await supabase
      .from('math_game_scores')
      .select(`
        score, 
        played_at,
        custom_users!inner(username)
      `)
      .order('score', { ascending: false })
      .limit(10);

    if (globalError) {
      console.error('Error fetching global high scores:', globalError);
      return NextResponse.json({ error: 'Failed to fetch global scores' }, { status: 500 });
    }

    // บันทึก system log
    await supabase
      .from('system_logs')
      .insert({
        user_id: userId,
        action: 'MATH_GAME_SCORES_VIEW',
        level: 'INFO',
        details: {
          user_scores_count: userHighScores?.length || 0,
          global_scores_count: globalHighScores?.length || 0,
          timestamp: new Date().toISOString()
        }
      });

    return NextResponse.json({ 
      userHighScores: userHighScores || [],
      globalHighScores: globalHighScores || []
    });

  } catch (error) {
    console.error('Math Game Scores API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
