import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET!;

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // สำหรับการทดสอบ - ใช้ credentials ธรรมดา
        if (email === 'test@example.com' && password === 'password123') {
            const token = jwt.sign(
                { 
                    userId: '4a6f54e5-e46d-4020-aa20-bedd2b7a7bd7',
                    coupleId: 'test-couple-id'
                },
                jwtSecret,
                { expiresIn: '24h' }
            );

            return NextResponse.json({ 
                token,
                user: {
                    id: '4a6f54e5-e46d-4020-aa20-bedd2b7a7bd7',
                    email: 'test@example.com',
                    name: 'Test User'
                }
            });
        }

        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
