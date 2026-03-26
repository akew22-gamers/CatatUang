import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    return NextResponse.json({ user })
  } catch (error: any) {
    return NextResponse.json({ user: null, error: error.message }, { status: 401 })
  }
}
