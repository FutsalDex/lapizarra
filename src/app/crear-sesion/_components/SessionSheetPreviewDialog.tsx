
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
import { Download, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  [key: string]: any;
}

interface SessionData {
  date?: string;
  microcycle?: string;
  sessionNumber?: string;
  players?: string;
  space?: string;
  objectives?: string;
  initialExercises: Exercise[];
  mainExercises: Exercise[];
  finalExercises: Exercise[];
}

interface SessionSheetPreviewDialogProps {
  children: React.ReactNode;
  onDownload: () => SessionData;
}

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
    const printableContent = document.getElementById('printable-content');
    if (printableContent) {
        const printWindow = window.open('', '', 'height=800,width=800');
        if (printWindow) {
            const contentHTML = printableContent.innerHTML;
            const tailwindCssUrl = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';

            printWindow.document.write(`
                <html>
                <head>
                    <title>Ficha de Sesión</title>
                    <link href="${tailwindCssUrl}" rel="stylesheet">
                    <style>
                        @media print {
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            @page { size: A4; margin: 1cm; }
                            .page-break { page-break-before: always; }
                            .break-inside-avoid { page-break-inside: avoid; }
                        }
                        body { font-family: sans-serif; }
                        .bg-slate-800 { background-color: #1e293b !important; }
                        .bg-slate-200 { background-color: #e2e8f0 !important; }
                        .bg-slate-100 { background-color: #f1f5f9 !important; }
                        .text-white { color: #ffffff !important; }
                        .border-slate-800 { border-color: #1e293b !important; }
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
            }, 500); // Wait for styles to load
        }
    }
  };

  const allExercises = session ? [...session.initialExercises, ...session.mainExercises, ...session.finalExercises] : [];
  
  const totalDuration = allExercises.reduce((acc, ex) => acc + parseInt(ex?.['Duración (min)'] || '0', 10), 0);

  const getCategory = (exercise: Exercise) => exercise.Categoría || 'General';
  
  const renderExercise = (exercise: Exercise, index: number, phase: string) => (
    <div key={`${phase}-${index}`} className="border-2 border-slate-800 break-inside-avoid mb-4">
        <h4 className="bg-slate-200 text-center font-bold p-1">{exercise.Ejercicio}</h4>
        <div className="grid grid-cols-2">
            <div className="relative h-48 w-full bg-gray-100">
                <Image
                  src={exercise.Imagen || `https://picsum.photos/seed/${exercise.id}/400/300`}
                  alt={exercise.Ejercicio}
                  layout="fill"
                  className="object-contain"
                />
            </div>
            <div className="text-xs">
                <div className="bg-slate-200 font-bold p-1">Descripción</div>
                <div className="p-2 border-b-2 border-slate-800 h-16 overflow-hidden">
                    <p>{exercise['Descripción de la tarea'] || 'Sin descripción.'}</p>
                </div>
                <div className="bg-slate-200 font-bold p-1">Objetivos</div>
                <div className="p-2 h-16 overflow-hidden">
                     <p>{exercise.Objetivos || 'Sin objetivos.'}</p>
                </div>
            </div>
        </div>
        <footer className="grid grid-cols-4 gap-px text-center text-xs">
            <div className="bg-slate-200 p-1"><p className="font-bold">Tiempo</p><p>{exercise['Duración (min)']} min</p></div>
            <div className="bg-slate-200 p-1"><p className="font-bold">Descanso</p><p>N/A</p></div>
            <div className="bg-slate-200 p-1"><p className="font-bold">Jugadores</p><p>{session?.players || 'N/A'}</p></div>
            <div className="bg-slate-200 p-1"><p className="font-bold">Espacio</p><p>{session?.space || 'N/A'}</p></div>
        </footer>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="print-hidden">
          <DialogTitle>Previsualización de la Ficha de Sesión</DialogTitle>
          <DialogDescription>
            Así se verá tu sesión. Puedes descargarla como PDF desde aquí.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow h-0 pr-6">
          <div id="printable-content" className="space-y-4 p-1 bg-white text-gray-800">
            {!session ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <div className="border-4 border-slate-800 p-2 space-y-2">
                {/* Header */}
                <header className="grid grid-cols-6 gap-px text-center text-xs">
                    <div className="col-span-1 bg-white flex items-center justify-center p-1"><Shield className="h-10 w-10 text-slate-800"/></div>
                    <div className="bg-slate-800 text-white p-1"><p>Microciclo</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm">{session.microcycle || 'N/A'}</p></div>
                    <div className="bg-slate-800 text-white p-1"><p>Sesión</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm">{session.sessionNumber || 'N/A'}</p></div>
                    <div className="bg-slate-800 text-white p-1"><p>Fecha</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm">{session.date ? format(new Date(session.date), 'dd/MM/yyyy') : 'N/A'}</p></div>
                    <div className="bg-slate-800 text-white p-1"><p>Objetivos</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm capitalize">{session.objectives || 'N/A'}</p></div>
                    <div className="bg-slate-800 text-white p-1"><p>Jugadores</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm">{session.players || 'N/A'}</p></div>
                </header>
                
                <div className="space-y-4 mt-4">
                    {session.initialExercises.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold bg-slate-800 text-white text-center p-2 mb-2">FASE INICIAL</h3>
                            {session.initialExercises.map((ex, i) => renderExercise(ex, i, 'initial'))}
                        </div>
                    )}
                     {session.mainExercises.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold bg-slate-800 text-white text-center p-2 mb-2">FASE PRINCIPAL</h3>
                            {session.mainExercises.map((ex, i) => renderExercise(ex, i, 'main'))}
                        </div>
                    )}
                     {session.finalExercises.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold bg-slate-800 text-white text-center p-2 mb-2">FASE FINAL</h3>
                            {session.finalExercises.map((ex, i) => renderExercise(ex, i, 'final'))}
                        </div>
                    )}
                </div>

                 <div className="text-center text-xs text-gray-500 pt-2">Powered by LaPizarra</div>
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
