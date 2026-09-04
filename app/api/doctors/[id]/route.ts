import { NextRequest, NextResponse } from 'next/server'

import type { ApiSuccess } from '@/lib/types/api.types'
import type { DoctorProfile, DoctorProfileUpdateInput } from '@/lib/types/doctor.types'
import { getDoctorById, updateDoctor } from '@/lib/db'
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

    const callerId = auth.dbId || auth.sub
    if (!auth.isDev && callerId !== id) {
      return NextResponse.json({ message: 'Forbidden: Cannot update another doctor profile' }, { status: 403 })
    }

    const body = (await request.json()) as DoctorProfileUpdateInput
    const updates = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.specialty !== undefined ? { specialty: body.specialty } : {}),
      ...(body.clinic !== undefined ? { clinic: body.clinic } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.avatar !== undefined ? { avatar: body.avatar } : {}),
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
