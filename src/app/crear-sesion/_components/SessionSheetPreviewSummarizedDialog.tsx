
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Exercise {
  id: string;
  Ejercicio: string;
  Imagen?: string;
  aiHint?: string;
  [key: string]: any;
}

interface SessionData {
  date?: string;
  microcycle?: string;
  sessionNumber?: string;
  team?: string;
  season?: string;
  initialExercises: Exercise[];
  mainExercises: Exercise[];
  finalExercises: Exercise[];
}

interface SessionSheetPreviewSummarizedDialogProps {
  children: React.ReactNode;
  onDownload: () => SessionData;
}

const LaPizarraLogo = () => (
  <svg
    viewBox="0 0 180 40"
    className="h-10 w-auto text-slate-800"
    xmlns="http://www.w3.org/2000/svg"
  >
    <text
      x="0"
      y="30"
      fontFamily="Poppins, sans-serif"
      fontSize="30"
      fontWeight="bold"
      fill="currentColor"
    >
      LaPizarra
    </text>
  </svg>
);

export default function SessionSheetPreviewSummarizedDialog({ children, onDownload }: SessionSheetPreviewSummarizedDialogProps) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      const sessionData = onDownload();
      setSession(sessionData);
    }
    setOpen(isOpen);
  };

  const handlePrint = () => {
    const printableContent = document.getElementById('printable-content-summarized');
    if (printableContent && session) {
        const printWindow = window.open('', '', 'height=800,width=1100');
        if (printWindow) {
            const contentHTML = printableContent.innerHTML;
            const tailwindCssUrl = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
            const pageTitle = `Sesión ${session.sessionNumber || 'N-A'} (Resumen)`;

            printWindow.document.write(`
                <html>
                <head>
                    <title>${pageTitle}</title>
                    <link href="${tailwindCssUrl}" rel="stylesheet">
                    <style>
                        @media print {
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            @page { size: A4 portrait; margin: 1cm; }
                        }
                        body { font-family: sans-serif; }
                        .bg-slate-800 { background-color: #1e293b !important; }
                        .text-white { color: #ffffff !important; }
                        .border-slate-800 { border-color: #1e293b !important; }
                    </style>
                </head>
                <body class="text-xs">
                    ${contentHTML}
                </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    }
  };

 const renderExercise = (exercise: Exercise, index: number, phase: string) => (
    <div key={`${phase}-${index}`} className="relative h-44 w-full bg-gray-100 border-2 border-slate-800 break-inside-avoid">
        <Image
          src={exercise.Imagen || `https://picsum.photos/seed/${exercise.id}/400/300`}
          alt={exercise.Ejercicio}
          layout="fill"
          className="object-contain"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-slate-800 bg-opacity-70 text-white p-1 text-xs text-center truncate">
            {exercise.Ejercicio}
        </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="print-hidden">
          <DialogTitle>Previsualización de la Ficha de Sesión (Resumido)</DialogTitle>
          <DialogDescription>
            Esta es una vista previa del formato resumido, ideal para llevar a la pista.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow h-0 pr-6">
          <div id="printable-content-summarized" className="p-1 bg-white text-gray-800">
            {!session ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <div className="border-4 border-slate-800 p-2 space-y-2">
                <header className="grid grid-cols-6 gap-px text-center text-xs">
                    <div className="col-span-1 bg-white flex items-center justify-center p-1"><LaPizarraLogo /></div>
                    <div className="bg-slate-800 text-white p-1"><p>Microciclo</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm">{session.microcycle || 'N/A'}</p></div>
                    <div className="bg-slate-800 text-white p-1"><p>Sesión</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm">{session.sessionNumber || 'N/A'}</p></div>
                    <div className="bg-slate-800 text-white p-1"><p>Fecha</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm">{session.date ? format(new Date(session.date), 'dd/MM/yyyy') : 'N/A'}</p></div>
                    <div className="bg-slate-800 text-white p-1"><p>Equipo</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm capitalize">{session.team || 'N/A'}</p></div>
                    <div className="bg-slate-800 text-white p-1"><p>Temporada</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm">{session.season || 'N/A'}</p></div>
                </header>
                 <header className="text-right font-semibold pr-2">
                  Sesión {session.sessionNumber} (Resumen)
                </header>
                
                 <div className="space-y-4">
                    {session.initialExercises.length > 0 && session.initialExercises.some(ex => ex) && (
                        <div>
                            <h3 className="text-lg font-bold bg-slate-800 text-white text-center p-1 mb-2">FASE INICIAL</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {session.initialExercises.map((ex, i) => ex ? renderExercise(ex, i, 'initial') : null)}
                            </div>
                        </div>
                    )}
                    {session.mainExercises.length > 0 && session.mainExercises.some(ex => ex) && (
                        <div>
                            <h3 className="text-lg font-bold bg-slate-800 text-white text-center p-1 mb-2">FASE PRINCIPAL</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {session.mainExercises.map((ex, i) => ex ? renderExercise(ex, i, 'main') : null)}
                            </div>
                        </div>
                    )}
                     {session.finalExercises.length > 0 && session.finalExercises.some(ex => ex) && (
                        <div>
                            <h3 className="text-lg font-bold bg-slate-800 text-white text-center p-1 mb-2">FASE FINAL</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {session.finalExercises.map((ex, i) => ex ? renderExercise(ex, i, 'final') : null)}
                            </div>
                        </div>
                    )}
                </div>
                 <footer className="text-center text-xs text-gray-500 pt-2">Powered by LaPizarra</footer>
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="print-hidden">
            <DialogClose asChild>
                <Button type="button" variant="outline">
                    Cerrar
                </Button>
            </DialogClose>
            <Button onClick={handlePrint} disabled={!session}>
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
