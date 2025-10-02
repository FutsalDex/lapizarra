
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import '@/app/print.css';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

export default function SessionSheetPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = localStorage.getItem('sessionSheetData');
    if (data) {
      setSession(JSON.parse(data));
    } else {
      // If no data, redirect or show message, then clear item
      router.push('/crear-sesion');
    }
    setLoading(false);
    
    // Clean up local storage after use
    return () => {
      localStorage.removeItem('sessionSheetData');
    }
  }, [router]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4 space-y-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-6 w-full" />
        <Card>
          <CardContent className="p-6 space-y-6">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p>No se encontraron datos de la sesión. Redirigiendo...</p>
      </div>
    );
  }

  const allExercises = [session.initialExercise, ...session.mainExercises, session.finalExercise].filter(Boolean) as Exercise[];

  const totalDuration = allExercises.reduce((acc, ex) => acc + parseInt(ex?.['Duración (min)'] || '0', 10), 0);

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4" id="printable-content">
      <div className="mb-6 flex justify-between items-center print-hidden">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Creador
        </Button>
        <Button onClick={handlePrint}>
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF
        </Button>
      </div>
      
      <div className="text-left mb-8">
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Ficha de la Sesión
        </h1>
        {session.date && (
          <p className="text-lg text-muted-foreground mt-1 capitalize">
            {format(new Date(session.date), "eeee, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        )}
      </div>

      <Card className="mb-8">
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
      
      <div className="space-y-8">
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
    </div>
  );
}
