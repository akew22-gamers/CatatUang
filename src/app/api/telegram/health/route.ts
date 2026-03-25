import { NextResponse } from 'next/server'
import { bot } from '@/lib/telegram/bot'

export async function GET() {
  try {
    const botInfo = await bot.getMe()
    
    return NextResponse.json({
      status: 'ok',
      bot: {
        id: botInfo.id,
        username: botInfo.username,
        first_name: botInfo.first_name,
        is_bot: botInfo.isBot,
      },
      initialized: true,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      initialized: false,
    }, { status: 500 })
  }
}
