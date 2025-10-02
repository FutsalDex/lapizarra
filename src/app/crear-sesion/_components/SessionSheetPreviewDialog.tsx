
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
  [key: string]: any;
}

interface SessionData {
  date?: string;
  microcycle?: string;
  sessionNumber?: string;
  players?: string;
  space?: string;
  objectives?: string;
  initialExercise: Exercise | null;
  mainExercises: (Exercise | null)[];
  finalExercise: Exercise | null;
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
        printWindow.document.write('<html><head><title>Ficha de Sesión</title>');
        // Directly include Tailwind CDN for simplicity in print window, or link to a compiled print.css
        printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">');
        printWindow.document.write(`
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .page-break { page-break-before: always; }
            }
            .break-inside-avoid { page-break-inside: avoid; }
            body { font-family: sans-serif; }
          </style>
        `);
        printWindow.document.write('</head><body class="p-8">');
        printWindow.document.write(printableContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const allExercises = session ? [session.initialExercise, ...session.mainExercises, session.finalExercise].filter(Boolean) as Exercise[] : [];
  const totalDuration = allExercises.reduce((acc, ex) => acc + parseInt(ex?.['Duración (min)'] || '0', 10), 0);

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
          <div id="printable-content" className="space-y-6 py-4">
            {!session ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <>
                <div className="text-left mb-4">
                  <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">
                    Ficha de la Sesión
                  </h1>
                  {session.date && (
                    <p className="text-md text-muted-foreground mt-1 capitalize">
                      {format(new Date(session.date), "eeee, d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  )}
                </div>

                <Card className="mb-6 break-inside-avoid">
                  <CardHeader>
                      <CardTitle>Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><p className="font-semibold">Nº Sesión:</p><p>{session.sessionNumber || 'N/A'}</p></div>
                      <div><p className="font-semibold">Microciclo:</p><p>{session.microcycle || 'N/A'}</p></div>
                      <div><p className="font-semibold">Jugadores:</p><p>{session.players || 'N/A'}</p></div>
                      <div><p className="font-semibold">Tiempo Total:</p><p>{totalDuration} min</p></div>
                      <div className="col-span-2"><p className="font-semibold">Objetivos:</p><p className="capitalize">{session.objectives || 'N/A'}</p></div>
                      <div className="col-span-2"><p className="font-semibold">Espacio:</p><p className="capitalize">{session.space || 'N/A'}</p></div>
                  </CardContent>
                </Card>
                
                <div className="space-y-6">
                  {allExercises.map((exercise, index) => (
                      <Card key={exercise.id + index} className="overflow-hidden break-inside-avoid">
                          <CardHeader>
                              <CardTitle>{exercise.Ejercicio}</CardTitle>
                              <CardDescription>Duración: {exercise['Duración (min)']} min</CardDescription>
                          </CardHeader>
                          <div className="relative h-80 w-full bg-muted print-image">
                              <Image
                                  src={exercise.Imagen || `https://picsum.photos/seed/${exercise.id}/800/600`}
                                  alt={exercise.Ejercicio}
                                  fill
                                  className="object-contain"
                              />
                          </div>
                          <CardContent className="p-6 space-y-4">
                              <div>
                                  <h4 className="font-semibold">Objetivos</h4>
                                  <p className="text-muted-foreground text-sm">{exercise.Objetivos}</p>
                              </div>
                              <div>
                                  <h4 className="font-semibold">Descripción</h4>
                                  <p className="text-muted-foreground text-sm">{exercise['Descripción de la tarea']}</p>
                              </div>
                          </CardContent>
                      </Card>
                  ))}
                </div>
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
            <Button onClick={handlePrint}>
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
