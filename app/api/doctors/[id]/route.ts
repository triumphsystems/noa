import { NextRequest, NextResponse } from 'next/server'

import type { ApiSuccess } from '@/lib/types/api.types'
import type { DoctorProfile, DoctorProfileUpdateInput } from '@/lib/types/doctor.types'
import { getDoctorById, updateDoctor, type Doctor } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth/jwt'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthenticatedUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: 'Doctor ID is required' }, { status: 400 })
    }

    const doctor = await getDoctorById(id)

    if (!doctor) {
      return NextResponse.json({ message: 'Doctor not found' }, { status: 404 })
    }

    const response: ApiSuccess<DoctorProfile> = {
      success: true,
      data: doctor,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[v0] Error fetching doctor:', error)
    return NextResponse.json(
      {
        message: 'Failed to fetch doctor',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getAuthenticatedUser(request)
    if (!auth.isValid) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: 'Doctor ID is required' }, { status: 400 })
    }

    if (id !== auth.sub && auth.userType !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Cannot update another doctor profile' }, { status: 403 })
    }

    const body = (await request.json()) as DoctorProfileUpdateInput
    const updates: Partial<Doctor> = {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.specialty !== undefined ? { specialty: body.specialty.trim() } : {}),
      ...(body.clinic !== undefined ? { clinic: body.clinic.trim() } : {}),
      ...(body.phone !== undefined ? { phone: body.phone.trim() } : {}),
      ...(body.avatar !== undefined ? { avatar: body.avatar } : {}),
      ...(body.license !== undefined ? { license: body.license.trim() } : {}),
      ...(body.issuingAuthority !== undefined ? { issuingAuthority: body.issuingAuthority.trim() } : {}),
      ...(body.licenseDocumentUrl !== undefined ? { licenseDocumentUrl: body.licenseDocumentUrl.trim() } : {}),
    }

    // Reset status to pending review if doctor is re-submitting after rejection or completing onboarding
    if (body.verificationStatus === 'pending') {
      updates.verificationStatus = 'pending'
      updates.rejectionReason = ''
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'At least one profile field is required' }, { status: 400 })
    }

    const updatedDoctor = await updateDoctor(id, updates)

    if (!updatedDoctor) {
      return NextResponse.json({ message: 'Doctor not found' }, { status: 404 })
    }

    const response: ApiSuccess<DoctorProfile> = {
      success: true,
      data: updatedDoctor,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[v0] Error updating doctor:', error)
    return NextResponse.json(
      {
        message: 'Failed to update doctor',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
