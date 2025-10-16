
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Eye, Trash2, HeartCrack, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { collection, onSnapshot, query, where, doc, updateDoc, arrayRemove, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


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
  Visible: boolean;
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

export default function FavoritosPage() {
  const { user, loading: authLoading, db } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [favoriteExercises, setFavoriteExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
        return;
    }
    if (!user || !db) {
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, async (userDoc) => {
      if (userDoc.exists()) {
        const favoriteIds = userDoc.data().favorites || [];
        if (favoriteIds.length > 0) {
          // Firestore 'in' queries are limited to 30 elements. 
          // If a user can have more favorites, this needs chunking.
          const chunks = [];
          for (let i = 0; i < favoriteIds.length; i += 30) {
            chunks.push(favoriteIds.slice(i, i + 30));
          }
          
          const exercisesData: Exercise[] = [];
          for (const chunk of chunks) {
            if (chunk.length > 0) {
              const exercisesQuery = query(collection(db, 'exercises'), where('__name__', 'in', chunk));
              const exercisesSnapshot = await getDocs(exercisesQuery);
              exercisesSnapshot.forEach(doc => {
                exercisesData.push({ 
                  id: doc.id,
                  ...doc.data() 
                } as Exercise);
              });
            }
          }
          setFavoriteExercises(exercisesData);
        } else {
          setFavoriteExercises([]);
        }
      } else {
        setFavoriteExercises([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching favorites: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, router, db]);

  const removeFromFavorites = async (exerciseId: string) => {
    if (!user || !db) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDocRef, {
        favorites: arrayRemove(exerciseId)
      });
      toast({
        title: "Eliminado de favoritos",
        description: "El ejercicio ha sido eliminado de tus favoritos.",
      });
    } catch (error) {
      console.error("Error removing favorite: ", error);
      toast({ title: "Error", description: "No se pudo eliminar el favorito.", variant: "destructive" });
    }
  };
  
  if (loading || authLoading) {
    return (
        <div className="container mx-auto py-12 px-4">
             <div className="text-left mb-8">
                <h1 className="text-4xl font-bold font-headline tracking-tighter text-primary">
                Mis Ejercicios Favoritos
                </h1>
                <p className="text-xl text-muted-foreground mt-2">
                Aquí encontrarás todos los ejercicios que has marcado como favoritos.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({length: 3}).map((_, index) => (
                    <Card key={index} className="flex flex-col">
                        <Skeleton className="aspect-[4/3] w-full" />
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-5 w-1/3 mt-2" />
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                        <CardFooter>
                        <Skeleton className="h-10 w-full" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-left mb-8">
        <h1 className="text-4xl font-bold font-headline tracking-tighter text-primary">
          Mis Ejercicios Favoritos
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Aquí encontrarás todos los ejercicios que has marcado como favoritos.
        </p>
      </div>
      
      {!user ? (
          <Card className="flex flex-col items-center justify-center text-center py-24 px-6 bg-secondary/50 border-dashed">
            <CardContent className="space-y-4">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <HeartCrack className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Inicia Sesión para Guardar Favoritos</h3>
                <p className="text-muted-foreground">Regístrate o inicia sesión para guardar y organizar tus ejercicios preferidos.</p>
                <Button asChild>
                    <Link href="/login?redirect=/favoritos">
                      <LogIn className="mr-2 h-4 w-4"/>
                      Iniciar Sesión
                    </Link>
                </Button>
            </CardContent>
        </Card>
      ) : favoriteExercises.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center py-24 px-6 bg-secondary/50 border-dashed">
            <CardContent className="space-y-4">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <HeartCrack className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Aún no tienes favoritos</h3>
                <p className="text-muted-foreground">Explora la biblioteca y pulsa el corazón en los ejercicios que te gusten.</p>
                <Button asChild>
                    <Link href="/ejercicios">Ir a la Biblioteca</Link>
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {favoriteExercises.map((exercise) => (
            <Card key={exercise.id} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="relative aspect-[4/3] bg-muted">
                {exercise.Imagen && (
                  <Image
                    src={exercise.Imagen}
                    alt={exercise.Ejercicio}
                    data-ai-hint={exercise.aiHint || 'futsal drill court'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                )}
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="font-bold text-xl">
                  {exercise.Número ? `${exercise.Número} - ` : ''}{exercise.Ejercicio}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow space-y-3 text-sm">
                <div className="text-muted-foreground space-y-1">
                    <p><span className="font-semibold text-foreground">Fase:</span> {exercise.Fase}</p>
                    <p><span className="font-semibold text-foreground">Edad:</span> {exercise.Edad?.map(age => ageCategoryLabels[age] || age).join(', ')}</p>
                    <p><span className="font-semibold text-foreground">Duración:</span> {exercise['Duración (min)']} min</p>
                </div>
                <p className="text-muted-foreground pt-2">
                  {exercise['Descripción de la tarea'] && `${exercise['Descripción de la tarea'].substring(0, 100)}${exercise['Descripción de la tarea'].length > 100 ? '...' : ''}`}
                </p>
              </CardContent>
              <CardFooter className="bg-card border-t p-3">
                <div className="w-full flex justify-between items-center">
                  <Button asChild variant="outline">
                    <Link href={`/ejercicios/${exercise.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Ficha
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeFromFavorites(exercise.id)}>
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
