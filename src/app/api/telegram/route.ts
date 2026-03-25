import { bot, setupBotHandlers } from '@/lib/telegram/bot'
import { NextRequest, NextResponse } from 'next/server'

console.log('Initializing Telegram bot...')
setupBotHandlers()
console.log('Telegram bot handlers initialized')

export async function POST(request: NextRequest) {
  try {
    console.log('Telegram webhook received')
    
    const body = await request.json()
    console.log('Webhook update:', JSON.stringify(body, null, 2))
    
    await bot.handleUpdate(body)
    
    console.log('Telegram webhook processed successfully')
    return NextResponse.json({ ok: true })
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
