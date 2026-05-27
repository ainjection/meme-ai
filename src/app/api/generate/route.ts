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

  // Insert pending generation record
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
      // Image face swap
      prediction = await replicate.predictions.create({
        version: 'cjwbw/codeformer:07a8f5a1f3b6e8a1c5d9c2e4f7a9b3e5d1c7f9a2b4e6d8f0a2c4e6d8f0a2c4',
        // codeplugtech/face-swap
        model: 'codeplugtech/face-swap',
        input: {
          source_image: userPhotoUrl,
          target_image: memeUrl,
        },
      })
    } else {
      // Video full-body swap via wan-2.2
      prediction = await replicate.predictions.create({
        model: 'wavespeedai/wan-2.1-i2v-480p',
        input: {
          image: userPhotoUrl,
          prompt: 'person in scene, full body replacement, maintain background and setting',
          target_video: memeUrl,
        },
      })
    }

    // Save prediction ID
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
