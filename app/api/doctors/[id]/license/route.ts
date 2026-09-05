import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { nanoid } from 'nanoid'

import { s3Client } from '@/lib/aws-config'
import { getDoctorById, updateDoctor } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/jwt'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: 'Doctor ID is required' }, { status: 400 })
    }

    if (id !== auth.sub && auth.userType !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const doctor = await getDoctorById(id)
    if (!doctor) {
      return NextResponse.json({ message: 'Doctor not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const directUrl = formData.get('documentUrl') as string | null

    let finalDocumentUrl = directUrl || ''

    if (file && file.size > 0) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ message: 'File size exceeds 10MB limit' }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const fileExt = file.name.split('.').pop() || 'pdf'
      const s3Key = `licenses/${id}/${nanoid()}.${fileExt}`
      const s3Bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET

      if (s3Bucket) {
        try {
          await s3Client.send(
            new PutObjectCommand({
              Bucket: s3Bucket,
              Key: s3Key,
              Body: buffer,
              ContentType: file.type || 'application/pdf',
            })
          )
          finalDocumentUrl = `https://${s3Bucket}.s3.amazonaws.com/${s3Key}`
        } catch (s3Err) {
          console.warn('[Onboarding] S3 upload failed, falling back to data URL:', s3Err)
          // Fallback to data URL for local dev or offline mode if file is reasonable size (< 300KB)
          if (file.size <= 300 * 1024) {
            finalDocumentUrl = `data:${file.type || 'application/pdf'};base64,${buffer.toString('base64')}`
          } else {
            finalDocumentUrl = `document://${s3Key}`
          }
        }
      } else {
        // Dev fallback
        if (file.size <= 300 * 1024) {
          finalDocumentUrl = `data:${file.type || 'application/pdf'};base64,${buffer.toString('base64')}`
        } else {
          finalDocumentUrl = `document://${s3Key}`
        }
      }
    }

    if (!finalDocumentUrl) {
      return NextResponse.json({ message: 'No file or document URL provided' }, { status: 400 })
    }

    // Update doctor record with the license document URL
    const updated = await updateDoctor(id, {
      licenseDocumentUrl: finalDocumentUrl,
    })

    return NextResponse.json({
      success: true,
      message: 'License document uploaded successfully',
      licenseDocumentUrl: finalDocumentUrl,
      doctor: updated,
    })
  } catch (error) {
    console.error('[Onboarding] Error uploading license document:', error)
    return NextResponse.json(
      {
        message: 'Failed to upload license document',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
