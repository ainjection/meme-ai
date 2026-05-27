import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

async function uploadToReplicate(dataUri: string): Promise<string> {
  const [header, base64] = dataUri.split(',')
  const mimeType = header.split(':')[1].split(';')[0]
  const buffer = Buffer.from(base64, 'base64')
  const blob = new Blob([buffer], { type: mimeType })
  const file = await (replicate.files as any).create(blob, { filename: 'photo.jpg' })
  return file.urls?.get ?? file.url
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { memeUrl, userPhotoUrl, swapType } = body

  if (!memeUrl || !userPhotoUrl || !swapType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // Upload photo to Replicate file hosting so models get a real URL
    const characterImageUrl = userPhotoUrl.startsWith('data:')
      ? await uploadToReplicate(userPhotoUrl)
      : userPhotoUrl

    const prediction = await replicate.predictions.create({
      model: "wan-video/wan-2.2-animate-replace",
      input: {
        video: memeUrl,
        character_image: characterImageUrl,
        go_fast: true,
        frames_per_second: 24,
      },
    })

    return NextResponse.json({ generationId: prediction.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
