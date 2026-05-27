import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

async function getLatestVersion(owner: string, name: string): Promise<string | null> {
  try {
    const model = await replicate.models.get(owner, name)
    return (model as any).latest_version?.id ?? null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { memeUrl, userPhotoUrl, swapType } = body

  if (!memeUrl || !userPhotoUrl || !swapType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    let prediction

    if (swapType === 'face') {
      prediction = await replicate.predictions.create({
        version: "278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34",
        input: {
          swap_image: userPhotoUrl,
          target_image: memeUrl,
        },
      })
    } else {
      prediction = await replicate.predictions.create({
        model: "wavespeedai/wan-2.1-i2v-480p",
        input: {
          image: userPhotoUrl,
          prompt: 'person performing action, natural movement, maintain scene and background',
          num_frames: 81,
          sample_steps: 30,
          frames_per_second: 16,
        },
      })
    }

    return NextResponse.json({ generationId: prediction.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
