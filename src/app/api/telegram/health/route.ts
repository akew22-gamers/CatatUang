import { NextResponse } from 'next/server'
import { bot } from '@/lib/telegram/bot'

export async function GET() {
  try {
    const botInfo = bot.botInfo
    
    return NextResponse.json({
      status: 'ok',
      bot: botInfo ? {
        id: botInfo.id,
        username: botInfo.username,
        first_name: botInfo.first_name,
        is_bot: botInfo.is_bot,
      } : null,
      initialized: !!botInfo,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      initialized: false,
    }, { status: 500 })
  }
}
