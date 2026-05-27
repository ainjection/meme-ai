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
      // Try multiple face-swap models in order until one works
      const faceSwapModels = [
        ['omniedgeio', 'face-swap'],
        ['yan-ops', 'face-swap'],
        ['rfiction', 'face-swap'],
      ]

      let version: string | null = null
      for (const [owner, name] of faceSwapModels) {
        version = await getLatestVersion(owner, name)
        if (version) break
      }

      if (!version) {
        return NextResponse.json({ error: 'No face swap model available — try again later' }, { status: 503 })
      }

      prediction = await replicate.predictions.create({
        version,
        input: {
          swap_image: userPhotoUrl,
          target_image: memeUrl,
        },
      })
    } else {
      const version = await getLatestVersion('wavespeedai', 'wan-2.1-i2v-480p')
      if (!version) {
        return NextResponse.json({ error: 'Video generation model unavailable' }, { status: 503 })
      }

      prediction = await replicate.predictions.create({
        version,
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
