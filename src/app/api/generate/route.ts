import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { memeUrl, userPhotoUrl, swapType } = body

  if (!memeUrl || !userPhotoUrl || !swapType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const prediction = await replicate.predictions.create({
      model: "wan-video/wan-2.2-animate-replace",
      input: {
        video: memeUrl,
        character_image: userPhotoUrl,
        go_fast: true,
        frames_per_second: 24,
      },
    })

    return NextResponse.json({ generationId: prediction.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
