import { webhookCallback } from 'grammy'
import { bot, setupBotHandlers } from '@/lib/telegram/bot'
import { NextRequest, NextResponse } from 'next/server'

setupBotHandlers()

const handler = webhookCallback(bot, 'https')

export async function POST(request: NextRequest) {
  try {
    return await handler(request)
  } catch (error: any) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'CatatUang Telegram Bot is running' 
  })
}
