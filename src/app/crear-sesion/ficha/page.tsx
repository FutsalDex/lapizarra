
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import '@/app/print.css';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';

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
  team?: string;
  season?: string;
  initialExercises: Exercise[];
  mainExercises: Exercise[];
  finalExercises: Exercise[];
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


export default function SessionSheetPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = localStorage.getItem('sessionSheetData');
    if (data) {
      const parsedData = JSON.parse(data);
      setSession(parsedData);
      document.title = `Sesión ${parsedData.sessionNumber || 'N-A'}`;
    } else {
      router.push('/crear-sesion');
    }
    setLoading(false);
  }, [router]);

  const handlePrint = () => {
    window.print();
  };
  
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
                <div className="p-2 border-b-2 border-slate-800">
                    <p>{exercise['Descripción de la tarea'] || 'Sin descripción.'}</p>
                </div>
                <div className="bg-slate-200 font-bold p-1">Objetivos</div>
                <div className="p-2">
                     <p>{exercise.Objetivos || 'Sin objetivos.'}</p>
                </div>
            </div>
        </div>
        <footer className="grid grid-cols-4 gap-px text-center text-xs">
            <div className="bg-slate-200 p-1"><p className="font-bold">Tiempo</p><p>{exercise['Duración (min)']} min</p></div>
            <div className="bg-slate-200 p-1"><p className="font-bold">Descanso</p><p>N/A</p></div>
            <div className="bg-slate-200 p-1"><p className="font-bold">Jugadores</p><p>{session?.team || 'N/A'}</p></div>
            <div className="bg-slate-200 p-1"><p className="font-bold">Espacio</p><p>{session?.season || 'N/A'}</p></div>
        </footer>
    </div>
  );


  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4 space-y-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
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

  const allExercises = [...session.initialExercises, ...session.mainExercises, ...session.finalExercises].filter(Boolean) as Exercise[];

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
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
      
      <div id="printable-content" className="space-y-4 p-1 bg-white text-gray-800">
        <div className="border-4 border-slate-800 p-2 space-y-2">
            {/* Header */}
            <header className="grid grid-cols-6 gap-px text-center text-xs">
                <div className="col-span-1 bg-white flex items-center justify-center p-1"><LaPizarraLogo/></div>
                <div className="bg-slate-800 text-white p-1"><p>Microciclo</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm">{session.microcycle || 'N/A'}</p></div>
                <div className="bg-slate-800 text-white p-1"><p>Sesión</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm">{session.sessionNumber || 'N/A'}</p></div>
                <div className="bg-slate-800 text-white p-1"><p>Fecha</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm">{session.date ? format(new Date(session.date), 'dd/MM/yyyy') : 'N/A'}</p></div>
                <div className="bg-slate-800 text-white p-1"><p>Equipo</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm capitalize">{session.team || 'N/A'}</p></div>
                <div className="bg-slate-800 text-white p-1"><p>Temporada</p><p className="font-bold text-sm bg-white text-slate-800 rounded-sm">{session.season || 'N/A'}</p></div>
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
      </div>
    </div>
  );
}
