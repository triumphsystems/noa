import { Button } from '@/components/ui/button';
import { Calendar, UserCheck, Download, Printer } from 'lucide-react';

interface ConsultationHeaderProps {
  date: string;
  doctorName: string;
  onDownloadPDF: () => void;
  onPrint: () => void;
}

export function ConsultationHeader({
  date,
  doctorName,
  onDownloadPDF,
  onPrint,
}: ConsultationHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div>
        <h2 className="text-deep-ink mb-2 font-serif text-2xl font-bold sm:text-3xl">
          Consultation Summary
        </h2>
        <div className="text-slate flex flex-wrap items-center gap-2 text-xs sm:gap-4 sm:text-sm">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0" />
            {date}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <UserCheck className="h-4 w-4 shrink-0" />
            Provider: {doctorName}
          </span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
        <Button
          onClick={onDownloadPDF}
          className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 w-full gap-1.5 rounded-full text-xs font-medium sm:w-auto sm:text-sm"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        <Button
          onClick={onPrint}
          variant="outline"
          className="border-deep-ink/20 text-deep-ink hover:bg-soft-meadow w-full gap-1.5 rounded-full text-xs font-medium sm:w-auto sm:text-sm"
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>
    </div>
  );
}
