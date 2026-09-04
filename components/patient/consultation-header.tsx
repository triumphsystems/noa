import { Button } from '@/components/ui/button'
import { Calendar, UserCheck, Download, Printer } from 'lucide-react'

interface ConsultationHeaderProps {
  date: string
  doctorName: string
  onDownloadPDF: () => void
  onPrint: () => void
}

export function ConsultationHeader({
  date,
  doctorName,
  onDownloadPDF,
  onPrint,
}: ConsultationHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif mb-2 text-deep-ink">
          Consultation Summary
        </h2>
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate flex-wrap">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 shrink-0" />
            {date}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 shrink-0" />
            Provider: {doctorName}
          </span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
        <Button
          onClick={onDownloadPDF}
          className="w-full sm:w-auto rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 gap-1.5 font-medium text-xs sm:text-sm"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
        <Button
          onClick={onPrint}
          variant="outline"
          className="w-full sm:w-auto rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow gap-1.5 font-medium text-xs sm:text-sm"
        >
          <Printer className="w-4 h-4" />
          Print
        </Button>
      </div>
    </div>
  )
}
