import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Patient, PatientIntake } from '@/lib/db'

interface HealthInfoCardProps {
  patient: Patient | null
  intake: PatientIntake | null
}

export function HealthInfoCard({ patient, intake }: HealthInfoCardProps) {
  const medications = intake?.medications?.length
    ? intake.medications
    : patient?.medications?.length
    ? patient.medications
    : []

  const allergies = intake?.allergies?.length
    ? intake.allergies
    : patient?.allergies?.length
    ? patient.allergies
    : []

  return (
    <Card className="p-6 sm:p-8">
      <CardHeader className="p-0 pb-6">
        <CardTitle>Your Health Information</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate mb-3">
              Current Medications
            </p>
            {medications.length === 0 ? (
              <p className="text-xs text-slate italic">No medications recorded yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {medications.map((med, idx) => (
                  <li key={idx} className="text-sm text-deep-ink flex items-center gap-2.5">
                    <span className="w-2 h-2 bg-hi-yellow rounded-full shrink-0" />
                    <span>{med}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate mb-3">
              Allergies
            </p>
            {allergies.length === 0 ? (
              <p className="text-xs text-slate italic">No known allergies recorded.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy, idx) => (
                  <Badge key={idx} variant="danger">
                    {allergy}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
