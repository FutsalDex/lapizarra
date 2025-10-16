
'use client';

import * as React from 'react';
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
import { Download, Tag, BarChart2, Users, Clock, Info, Goal, Repeat, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Exercise {
  id: string;
  Ejercicio: string;
  'Descripción de la tarea': string;
  Objetivos: string;
  'Duración (min)': string;
  Imagen?: string;
  aiHint?: string;
  Categoría?: string;
  Edad: string[];
  Fase: string;
  'Número de jugadores': string;
  'Espacio y materiales necesarios': string;
  'Consejos para el entrenador'?: string;
  Variantes?: string;
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

interface SessionSheetPreviewDialogProps {
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

const DetailItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center gap-2 text-slate-600 mb-1">
      <Icon className="h-4 w-4" />
      <p className="text-xs font-bold">{label}</p>
    </div>
    <div className="text-xs text-slate-800 font-medium pl-6">{value}</div>
  </div>
);


export default function SessionSheetPreviewDialog({ children, onDownload }: SessionSheetPreviewDialogProps) {
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
    const printableContent = document.getElementById('printable-content-extended');
    if (printableContent && session) {
        const printWindow = window.open('', '', 'height=800,width=800');
        if (printWindow) {
            const contentHTML = printableContent.innerHTML;
            const tailwindCssUrl = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
            const pageTitle = `Sesión ${session.sessionNumber || 'N-A'}`;

            printWindow.document.write(`
                <html>
                <head>
                    <title>${pageTitle}</title>
                    <link href="${tailwindCssUrl}" rel="stylesheet">
                    <style>
                        @media print {
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            @page { size: A4 portrait; margin: 1cm; }
                            .page-break { page-break-before: always; }
                            .break-inside-avoid { page-break-inside: avoid; }
                        }
                        body { font-family: sans-serif; }
                        .bg-slate-800 { background-color: #1e293b !important; }
                        .bg-slate-200 { background-color: #e2e8f0 !important; }
                        .bg-slate-100 { background-color: #f1f5f9 !important; }
                        .text-white { color: #ffffff !important; }
                        .border-slate-800 { border-color: #1e293b !important; }
                        .border-slate-400 { border-color: #94a3b8 !important; }
                        .text-slate-600 { color: #475569 !important; }
                        .text-slate-800 { color: #1e293b !important; }
                        .bg-secondary { background-color: #f1f5f9 !important; }
                        .text-secondary-foreground { color: #0f172a !important; }
                    </style>
                </head>
                <body class="p-2">
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

  const allExercises = session ? [
    ...session.initialExercises.map(ex => ({...ex, phase: 'FASE INICIAL'})), 
    ...session.mainExercises.map(ex => ({...ex, phase: 'FASE PRINCIPAL'})), 
    ...session.finalExercises.map(ex => ({...ex, phase: 'FASE FINAL'}))
  ].filter(ex => ex.id) : [];
  
  const getCategory = (exercise: Exercise) => exercise.Categoría || 'General';
  
  const renderExercise = (exercise: Exercise, index: number) => (
    <div key={`${exercise.phase}-${index}`} className="border-2 border-slate-800 break-inside-avoid mb-4 p-4 bg-white">
        <div className="grid grid-cols-2 gap-4">
            {/* Columna Izquierda */}
            <div className="space-y-4">
                {/* Image */}
                <div className="relative h-44 w-full bg-white">
                    <Image
                        src={exercise.Imagen || `https://picsum.photos/seed/${exercise.id}/400/300`}
                        alt={exercise.Ejercicio}
                        layout="fill"
                        className="object-contain"
                    />
                </div>
                
                 {/* Description */}
                <div>
                    <p className="font-bold mb-1 text-xs">Descripción</p>
                    <div className="border border-slate-400 p-2 rounded mt-1 text-xs">
                        <p>{exercise['Descripción de la tarea'] || 'Sin descripción.'}</p>
                    </div>
                </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-4">
                {/* Title */}
                <h4 className="font-bold text-base text-center">{exercise.Ejercicio}</h4>

                {/* Objectives */}
                <div>
                    <p className="font-bold mb-1 text-xs">Objetivos</p>
                    <div className="border border-slate-400 p-2 rounded mt-1 text-xs">
                        <p>{exercise.Objetivos || 'Sin objetivos.'}</p>
                    </div>
                </div>

                {/* Details Box */}
                <div className="p-2 border border-slate-400 rounded-lg space-y-2">
                    <DetailItem icon={Tag} label="Categoría" value={exercise.Categoría} />
                    <DetailItem icon={Users} label="Jugadores" value={exercise['Número de jugadores']}/>
                    <DetailItem icon={Clock} label="Duración" value={`${exercise['Duración (min)']} min`}/>
                    <DetailItem icon={Info} label="Espacio y Materiales" value={exercise['Espacio y materiales necesarios']}/>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="print-hidden">
          <DialogTitle>Previsualización de la Ficha de Sesión (Extendido)</DialogTitle>
          <DialogDescription>
            Así se verá tu sesión. Puedes descargarla como PDF desde aquí.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow h-0 pr-6">
          <div id="printable-content-extended" className="space-y-4 p-1 bg-white text-gray-800">
            {!session ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <>
              <div className="border-4 border-slate-800 p-2 space-y-2 break-inside-avoid">
                {/* Header */}
                <header className="grid grid-cols-6 gap-px text-center text-xs">
                    <div className="col-span-1 bg-white flex items-center justify-center p-1"><LaPizarraLogo /></div>
                    <div className="bg-slate-800 text-white p-1"><p>Microciclo</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm">{session.microcycle || 'N/A'}</p></div>
                    <div className="bg-slate-800 text-white p-1"><p>Sesión</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm">{session.sessionNumber || 'N/A'}</p></div>
                    <div className="bg-slate-800 text-white p-1"><p>Fecha</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm">{session.date ? format(new Date(session.date), 'dd/MM/yyyy') : 'N/A'}</p></div>
                    <div className="bg-slate-800 text-white p-1"><p>Equipo</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm capitalize">{session.team || 'N/A'}</p></div>
                    <div className="bg-slate-800 text-white p-1"><p>Temporada</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm">{session.season || 'N/A'}</p></div>
                </header>
              </div>

                <div className="space-y-4 mt-4">
                    {allExercises.map((ex, i) => {
                       const phaseTitle = ex.phase;
                       const prevPhaseTitle = i > 0 ? allExercises[i - 1].phase : null;
                       const isPairStart = i % 2 === 0;

                       // Show phase header only if it's different from the previous one.
                       const showPhaseHeader = phaseTitle !== prevPhaseTitle;

                       return (
                         <React.Fragment key={`exercise-fragment-${i}`}>
                           {showPhaseHeader && (
                             <h3 className="text-xl font-bold bg-slate-800 text-white text-center p-2 mb-2 break-after-avoid">
                               {phaseTitle}
                             </h3>
                           )}
                           {ex && renderExercise(ex, i)}
                           {/* Add page break after every second exercise, but not after the last one */}
                           {!isPairStart && i < allExercises.length - 1 && <div className="page-break"></div>}
                         </React.Fragment>
                       );
                    })}
                </div>

                 <div className="text-center text-xs text-gray-500 pt-2">Powered by LaPizarra</div>
              </>
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
