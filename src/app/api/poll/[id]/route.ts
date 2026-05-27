import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { createClient } from '@/lib/supabase/server'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: generationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: generation } = await supabase
    .from('generations')
    .select('*')
    .eq('id', generationId)
    .eq('user_id', user.id)
    .single()

  if (!generation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (generation.status === 'completed') return NextResponse.json({ status: 'completed', outputUrl: generation.output_url })
  if (generation.status === 'failed') return NextResponse.json({ status: 'failed' })
  if (!generation.replicate_prediction_id) return NextResponse.json({ status: 'pending' })

  const prediction = await replicate.predictions.get(generation.replicate_prediction_id)

  if (prediction.status === 'succeeded') {
    const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
    await supabase
      .from('generations')
      .update({ status: 'completed', output_url: outputUrl })
      .eq('id', generationId)
    return NextResponse.json({ status: 'completed', outputUrl })
  }

  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    await supabase.from('generations').update({ status: 'failed' }).eq('id', generationId)
    return NextResponse.json({ status: 'failed' })
  }

  return NextResponse.json({ status: 'processing' })
}
