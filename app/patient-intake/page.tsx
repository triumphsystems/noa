'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface IntakeFormData {
  // Personal Information
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  email: string
  phone: string
  address: string

  // Medical History
  medicalConditions: string[]
  surgeries: string
  allergies: string[]
  currentMedications: string[]

  // Family History
  familyHistory: string

  // Lifestyle
  smokingStatus: string
  alcoholUse: string
  exerciseFrequency: string

  // Emergency Contact
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string

  // Consent
  consentRead: boolean
}

const initialFormData: IntakeFormData = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  email: '',
  phone: '',
  address: '',
  medicalConditions: [],
  surgeries: '',
  allergies: [],
  currentMedications: [],
  familyHistory: '',
  smokingStatus: '',
  alcoholUse: '',
  exerciseFrequency: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  consentRead: false,
}

export default function PatientIntakePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<IntakeFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalSteps = 5

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleArrayChange = (field: string, value: string) => {
    setFormData(prev => {
      const arr = prev[field as keyof IntakeFormData] as string[]
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(item => item !== value) }
      }
      return { ...prev, [field]: [...arr, value] }
    })
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/intakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit intake form')
      }

      // Redirect to confirmation page
      router.push('/patient-intake/confirmation')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-serif mb-6">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-deep-ink mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-deep-ink mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
                  placeholder="Last name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-2">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
                placeholder="Street address"
              />
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-serif mb-6">Medical History</h2>
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-3">Current Conditions</label>
              <div className="space-y-2">
                {['Hypertension', 'Diabetes', 'Asthma', 'Heart Disease', 'Arthritis'].map(condition => (
                  <label key={condition} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.medicalConditions.includes(condition)}
                      onChange={() => handleArrayChange('medicalConditions', condition)}
                      className="rounded"
                    />
                    <span className="text-sm text-deep-ink">{condition}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-2">Previous Surgeries</label>
              <textarea
                name="surgeries"
                value={formData.surgeries}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-deep-ink/20 rounded-2xl text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
                placeholder="List any previous surgeries"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-3">Allergies</label>
              <div className="space-y-2">
                {['Penicillin', 'Aspirin', 'Sulfa', 'Latex', 'Peanuts'].map(allergy => (
                  <label key={allergy} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allergies.includes(allergy)}
                      onChange={() => handleArrayChange('allergies', allergy)}
                      className="rounded"
                    />
                    <span className="text-sm text-deep-ink">{allergy}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-2">Current Medications</label>
              <textarea
                name="currentMedications"
                value={formData.currentMedications.join('\n')}
                onChange={(e) => setFormData(prev => ({ ...prev, currentMedications: e.target.value.split('\n').filter(m => m.trim()) }))}
                className="w-full px-4 py-2 border border-deep-ink/20 rounded-2xl text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
                placeholder="One medication per line"
                rows={4}
              />
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-serif mb-6">Family History & Lifestyle</h2>
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-2">Family History</label>
              <textarea
                name="familyHistory"
                value={formData.familyHistory}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-deep-ink/20 rounded-2xl text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
                placeholder="List any family health conditions"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-2">Smoking Status</label>
              <select
                name="smokingStatus"
                value={formData.smokingStatus}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
              >
                <option value="">Select option</option>
                <option value="never">Never smoked</option>
                <option value="former">Former smoker</option>
                <option value="current">Current smoker</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-2">Alcohol Use</label>
              <select
                name="alcoholUse"
                value={formData.alcoholUse}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
              >
                <option value="">Select option</option>
                <option value="none">None</option>
                <option value="occasional">Occasionally</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-2">Exercise Frequency</label>
              <select
                name="exerciseFrequency"
                value={formData.exerciseFrequency}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
              >
                <option value="">Select option</option>
                <option value="sedentary">Sedentary</option>
                <option value="light">Light (1-2 times/week)</option>
                <option value="moderate">Moderate (3-4 times/week)</option>
                <option value="vigorous">Vigorous (5+ times/week)</option>
              </select>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-serif mb-6">Emergency Contact</h2>
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-2">Name</label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-2">Phone</label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-2">Relation</label>
              <input
                type="text"
                name="emergencyContactRelation"
                value={formData.emergencyContactRelation}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
                placeholder="e.g., Spouse, Parent, Sibling"
              />
            </div>
          </div>
        )
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-serif mb-6">Consent & Review</h2>
            <div className="bg-soft-meadow/50 rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-deep-ink mb-3">Review Your Information</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-slate">
                    <span className="font-medium text-deep-ink">Name:</span> {formData.firstName} {formData.lastName}
                  </p>
                  <p className="text-slate">
                    <span className="font-medium text-deep-ink">Email:</span> {formData.email}
                  </p>
                  <p className="text-slate">
                    <span className="font-medium text-deep-ink">Phone:</span> {formData.phone}
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="consentRead"
                  checked={formData.consentRead}
                  onChange={handleInputChange}
                  className="mt-1"
                />
                <span className="text-sm text-slate">
                  I confirm that the information I have provided is accurate and complete. I understand that my
                  health information will be used for clinical purposes and is protected under HIPAA.
                </span>
              </label>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-deep-ink">
      <div className="p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif mb-2">Patient Intake Form</h1>
          <p className="text-slate">Please complete all sections</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 rounded-full mx-1 ${
                  idx + 1 <= step ? 'bg-hi-yellow' : 'bg-soft-meadow'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-slate text-center">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-8 border border-deep-ink/10 mb-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-6">
              {error}
            </div>
          )}

          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between">
          <Button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            variant="outline"
            className="rounded-full border-deep-ink text-deep-ink hover:bg-soft-meadow px-8"
          >
            Previous
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 px-8"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.consentRead}
              className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 px-8"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
