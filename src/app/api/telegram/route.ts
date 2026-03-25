import { webhookCallback } from 'grammy'
import { bot, setupBotHandlers } from '@/lib/telegram/bot'
import { NextRequest, NextResponse } from 'next/server'

console.log('Initializing Telegram bot...')
setupBotHandlers()
console.log('Telegram bot handlers initialized')

const handler = webhookCallback(bot, 'https')

export async function POST(request: NextRequest) {
  try {
    console.log('Telegram webhook received:', request.method)
    const response = await handler(request)
    console.log('Telegram webhook processed successfully')
    return await response
  } catch (error: any) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
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
