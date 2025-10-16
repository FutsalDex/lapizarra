'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/button';
import {
  ArrowLeft,
  Tag,
  ClipboardList,
  BarChart2,
  Info,
  Users,
  Clock,
  Goal,
  Repeat,
  Lightbulb,
  Download,
} from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import { cn } from '../../../lib/utils';
import '../../../app/print.css';

interface Exercise {
  id: string;
  Número?: string;
  Ejercicio: string;
  'Descripción de la tarea': string;
  Objetivos: string;
  Fase: string;
  Categoría: string;
  Edad: string[];
  'Número de jugadores': string;
  'Duración (min)': string;
  'Espacio y materiales necesarios': string;
  Variantes?: string;
  'Consejos para el entrenador'?: string;
  Imagen?: string;
  aiHint?: string;
}

const ageCategoryLabels: Record<string, string> = {
  benjamin: 'Benjamín (8-9 años)',
  alevin: 'Alevín (10-11 años)',
  infantil: 'Infantil (12-13 años)',
  cadete: 'Cadete (14-15 años)',
  juvenil: 'Juvenil (16-18 años)',
  senior: 'Senior (+18 años)',
};

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
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      <Icon className="h-4 w-4" />
      <p className="text-sm font-semibold">{label}</p>
    </div>
    <div className="text-sm text-foreground font-medium pl-6">{value}</div>
  </div>
);

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center gap-3 mb-2">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
    </div>
    <div className="prose prose-sm max-w-none text-muted-foreground pl-8">
      {children}
    </div>
  </div>
);

export default function ExerciseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { db } = useAuth();
  const id = params.id as string;
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && db) {
      const fetchExercise = async () => {
        try {
          const docRef = doc(db, 'exercises', id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setExercise({ id: docSnap.id, ...docSnap.data() } as Exercise);
          } else {
            console.warn('No such document!');
          }
        } catch (error) {
          console.error('Error fetching exercise:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchExercise();
    }
  }, [id, db]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl py-12 px-4 space-y-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-6 w-full" />
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-4">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="col-span-1 space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="container mx-auto py-12 text-center">
        Ejercicio no encontrado.
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Button onClick={handlePrint}>
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF
        </Button>
      </div>

      <div id="printable-exercise-sheet">
        <div className="text-left mb-6">
          <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">
            {exercise.Ejercicio}
          </h1>
          {exercise.Número && (
            <p className="text-lg text-muted-foreground mt-1">
              Ejercicio #{exercise.Número}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-8">
            <div className="border rounded-lg overflow-hidden">
              <img
                src={
                  exercise.Imagen ||
                  `https://picsum.photos/seed/${exercise.id}/800/450`
                }
                alt={exercise.Ejercicio}
                className="object-contain w-full h-auto aspect-video"
              />
            </div>

            <Section icon={Goal} title="Objetivos Principales">
              <p>{exercise.Objetivos}</p>
            </Section>

            <Section icon={ClipboardList} title="Descripción de la Tarea">
              <p>{exercise['Descripción de la tarea']}</p>
            </Section>

            {exercise.Variantes && (
              <Section icon={Repeat} title="Variantes">
                <p>{exercise.Variantes}</p>
              </Section>
            )}

            {exercise['Consejos para el entrenador'] && (
              <Section icon={Lightbulb} title="Consejos">
                <p>{exercise['Consejos para el entrenador']}</p>
              </Section>
            )}
          </div>

          {/* Columna Lateral */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 border rounded-lg space-y-6">
              <DetailItem icon={Tag} label="Categoría" value={exercise.Categoría} />
              <DetailItem icon={BarChart2} label="Fase" value={exercise.Fase} />
              <DetailItem
                icon={Users}
                label="Jugadores"
                value={exercise['Número de jugadores']}
              />
              <DetailItem
                icon={Clock}
                label="Duración"
                value={`${exercise['Duración (min)']} min`}
              />
              <DetailItem
                icon={Info}
                label="Edades Recomendadas"
                value={
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(exercise.Edad || []).map((age) => (
                      <span
                        key={age}
                        className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded-full"
                      >
                        {ageCategoryLabels[age] || age}
                      </span>
                    ))}
                  </div>
                }
              />
              <DetailItem
                icon={Users}
                label="Espacio y Materiales"
                value={exercise['Espacio y materiales necesarios']}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
