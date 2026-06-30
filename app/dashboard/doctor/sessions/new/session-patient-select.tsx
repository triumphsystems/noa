interface SessionPatientSelectProps {
  selectedPatient: string
  onSelect: (patientId: string) => void
  patients: Array<{ id: string; firstName: string; lastName: string }>
}

export function SessionPatientSelect({ selectedPatient, onSelect, patients }: SessionPatientSelectProps) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-deep-ink/10">
      <label className="block text-sm font-semibold text-deep-ink mb-3">Select Patient</label>
      <select
        value={selectedPatient}
        onChange={e => onSelect(e.target.value)}
        className="w-full px-4 py-3 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
      >
        <option value="">Choose a patient...</option>
        {patients.map(p => (
          <option key={p.id} value={p.id}>
            {p.firstName} {p.lastName}
          </option>
        ))}
      </select>
    </div>
  )
}
