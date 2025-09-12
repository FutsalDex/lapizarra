
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Tag, ClipboardList, BarChart2, Info, Users, Clock, Goal, Repeat, Lightbulb, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

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

const ageCategoryLabels: { [key: string]: string } = {
    'benjamin': 'Benjamín (8-9 años)',
    'alevin': 'Alevín (10-11 años)',
    'infantil': 'Infantil (12-13 años)',
    'cadete': 'Cadete (14-15 años)',
    'juvenil': 'Juvenil (16-18 años)',
    'senior': 'Senior (+18 años)',
};

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <Icon className="h-5 w-5 text-primary mt-1" />
        <div>
            <p className="font-semibold text-foreground">{label}</p>
            <div className="text-muted-foreground">{value}</div>
        </div>
    </div>
);


export default function ExerciseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchExercise = async () => {
        const docRef = doc(db, 'exercises', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setExercise({ id: docSnap.id, ...docSnap.data() } as Exercise);
        } else {
          console.log('No such document!');
        }
        setLoading(false);
      };
      fetchExercise();
    }
  }, [id]);

  if (loading) {
    return (
        <div className="container mx-auto max-w-4xl py-12 px-4 space-y-8">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-96" />
            <Skeleton className="h-6 w-full" />
            <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-64 w-full mb-6" />
                    <div className="space-y-6">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!exercise) {
    return <div className="container mx-auto py-12 text-center">Ejercicio no encontrado.</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la Biblioteca
        </Button>
      </div>
      
      <div className="text-left mb-8">
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          {exercise.Ejercicio}
        </h1>
        {exercise.Número && (
             <p className="text-lg text-muted-foreground mt-1">
                Ejercicio #{exercise.Número}
             </p>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="relative h-80 w-full bg-muted">
             <Image
                src={exercise.Imagen || `https://picsum.photos/seed/${exercise.id}/800/600`}
                alt={exercise.Ejercicio}
                data-ai-hint={exercise.aiHint || 'futsal drill court'}
                fill
                className="object-contain"
            />
        </div>
        <CardContent className="p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3 bg-secondary p-3 rounded-lg">
                    <Tag className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-sm text-muted-foreground">Categoría</p>
                        <p className="font-semibold">{exercise.Categoría}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 bg-secondary p-3 rounded-lg">
                    <BarChart2 className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-sm text-muted-foreground">Fase</p>
                        <p className="font-semibold">{exercise.Fase}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 bg-secondary p-3 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-sm text-muted-foreground">Jugadores</p>
                        <p className="font-semibold">{exercise['Número de jugadores']}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 bg-secondary p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-sm text-muted-foreground">Duración</p>
                        <p className="font-semibold">{exercise['Duración (min)']} min</p>
                    </div>
                </div>
                 <div className="md:col-span-2 flex items-center gap-3 bg-secondary p-3 rounded-lg">
                    <Info className="h-6 w-6 text-primary" />
                    <div>
                        <p className="text-sm text-muted-foreground">Edades Recomendadas</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {exercise.Edad?.map(age => (
                                <Badge key={age} variant="outline">{ageCategoryLabels[age] || age}</Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <Separator />
            
            <div className="space-y-6">
                <DetailRow icon={Goal} label="Objetivos Principales" value={exercise.Objetivos} />
                <DetailRow icon={ClipboardList} label="Descripción de la Tarea" value={exercise['Descripción de la tarea']} />
                <DetailRow icon={ImageIcon} label="Espacio y Materiales Necesarios" value={exercise['Espacio y materiales necesarios']} />
                {exercise.Variantes && <DetailRow icon={Repeat} label="Variantes y Progresiones" value={exercise.Variantes} />}
                {exercise['Consejos para el entrenador'] && <DetailRow icon={Lightbulb} label="Consejos para el Entrenador" value={exercise['Consejos para el entrenador']} />}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
