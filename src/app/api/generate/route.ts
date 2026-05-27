import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { createClient } from '@/lib/supabase/server'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { memeUrl, userPhotoUrl, swapType, memeTitle } = body

  if (!memeUrl || !userPhotoUrl || !swapType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: generation, error: insertError } = await supabase
    .from('generations')
    .insert({
      user_id: user.id,
      meme_title: memeTitle,
      meme_source_url: memeUrl,
      swap_type: swapType,
      status: 'processing',
    })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  try {
    let prediction

    if (swapType === 'face') {
      // Image face swap — codeplugtech/face-swap on Replicate
      prediction = await replicate.predictions.create({
        model: 'codeplugtech/face-swap',
        input: {
          swap_image: userPhotoUrl,
          target_image: memeUrl,
        },
      })
    } else {
      // Video full-body swap — wan-2.2 animate-anyone
      prediction = await replicate.predictions.create({
        model: 'wavespeedai/wan-2.1-i2v-480p',
        input: {
          image: userPhotoUrl,
          prompt: 'person performing action, natural movement, maintain scene and background',
          num_frames: 81,
          sample_steps: 30,
          frames_per_second: 16,
        },
      })
    }

    await supabase
      .from('generations')
      .update({ replicate_prediction_id: prediction.id })
      .eq('id', generation.id)

    return NextResponse.json({ generationId: generation.id, predictionId: prediction.id })
  } catch (err: any) {
    await supabase.from('generations').update({ status: 'failed' }).eq('id', generation.id)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
