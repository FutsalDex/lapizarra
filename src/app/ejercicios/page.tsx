'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Heart, Search, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { collection, onSnapshot, query, where, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';


interface Exercise {
  id: string;
  Número?: string;
  Ejercicio: string;
  'Descripción de la tarea': string;
  Objetivos: string;
  'Fase de la Sesión': string;
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

export default function EjerciciosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('Todas');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedAge, setSelectedAge] = useState('Todas');

  useEffect(() => {
    const q = query(collection(db, "exercises"), where("Visible", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const exercisesData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
      } as Exercise));
      setExercises(exercisesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching exercises: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
            setFavorites(doc.data().favorites || []);
        }
    });
    return () => unsubscribe();
  }, [user]);
  
  const toggleFavorite = async (exerciseId: string) => {
    if (!user) {
        toast({ title: "Inicia sesión", description: "Debes iniciar sesión para guardar favoritos.", variant: "destructive" });
        return;
    }
    const userDocRef = doc(db, 'users', user.uid);
    const isFavorite = favorites.includes(exerciseId);

    try {
        await updateDoc(userDocRef, {
            favorites: isFavorite ? arrayRemove(exerciseId) : arrayUnion(exerciseId)
        }, { merge: true });

        toast({
            title: isFavorite ? "Eliminado de favoritos" : "Añadido a favoritos",
            description: `El ejercicio ha sido ${isFavorite ? 'eliminado de' : 'añadido a'} tus favoritos.`,
        });
    } catch (error) {
        console.error("Error updating favorites: ", error);
        toast({ title: "Error", description: "No se pudo actualizar tus favoritos.", variant: "destructive" });
    }
};

  const phases = useMemo(() => ['Todas', ...Array.from(new Set(exercises.map((ex) => ex['Fase de la Sesión']).filter(Boolean)))], [exercises]);
  const categories = useMemo(() => ['Todas', ...Array.from(new Set(exercises.map((ex) => ex.Categoría).filter(Boolean)))], [exercises]);
  const ages = useMemo(() => ['Todas', ...Array.from(new Set(exercises.flatMap((ex) => ex.Edad).filter(Boolean)))], [exercises]);

  const filteredExercises = useMemo(() => {
      return exercises.filter((exercise) => {
        const termMatch = (exercise.Ejercicio || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const phaseMatch =
          selectedPhase === 'Todas' || exercise['Fase de la Sesión'] === selectedPhase;
        const categoryMatch =
          selectedCategory === 'Todas' || exercise.Categoría === selectedCategory;
        const ageMatch = 
          selectedAge === 'Todas' || (exercise.Edad && exercise.Edad.includes(selectedAge));

        return termMatch && phaseMatch && categoryMatch && ageMatch;
      });
  }, [exercises, searchTerm, selectedPhase, selectedCategory, selectedAge]);


  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-left mb-8">
        <h1 className="text-4xl font-bold font-headline tracking-tighter text-primary">
          Biblioteca de Ejercicios
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Explora nuestra colección de ejercicios de futsal. Filtra por nombre, fase, categoría o edad.
        </p>
      </div>

      <div className="mb-8 p-4 bg-card rounded-lg shadow-sm border space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar ejercicio por nombre..."
              className="pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
            <Select value={selectedPhase} onValueChange={setSelectedPhase} disabled={loading}>
              <SelectTrigger className="w-full h-11">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Todas las Fases" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {phases.map((phase) => (
                  <SelectItem key={phase} value={phase}>
                    {phase}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={loading}>
              <SelectTrigger className="w-full h-11">
                 <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Todas las Categorías" />
                 </div>
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedAge} onValueChange={setSelectedAge} disabled={loading}>
              <SelectTrigger className="w-full h-11">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Todas las Edades" />
                </div>
              </SelectTrigger>
              <SelectContent>
                 {ages.map((age) => (
                  <SelectItem key={age} value={age}>
                    {age === 'Todas' ? 'Todas las Edades' : ageCategoryLabels[age] || age}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        <p className="text-sm text-muted-foreground">Mostrando {filteredExercises.length} de {exercises.length} ejercicios.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({length: 6}).map((_, index) => (
                <Card key={index} className="flex flex-col">
                    <Skeleton className="h-60 w-full" />
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
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
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredExercises.map((exercise) => (
          <Card key={exercise.id} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
             <div className="relative h-60 bg-muted">
                <Image
                    src={exercise.Imagen || `https://picsum.photos/seed/${exercise.id}/400/300`}
                    alt={exercise.Ejercicio || 'Imagen del ejercicio'}
                    data-ai-hint={exercise.aiHint || 'futsal drill court'}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
             </div>

            <CardHeader className="pb-3">
              <CardTitle className="font-bold text-xl">
                 {exercise.Número ? `${exercise.Número} - ` : ''}{exercise.Ejercicio}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-3 text-sm">
                <div className="text-muted-foreground space-y-1">
                    <p><span className="font-semibold text-foreground">Fase:</span> {exercise['Fase de la Sesión']}</p>
                    <p><span className="font-semibold text-foreground">Edad:</span> {exercise.Edad?.map(age => ageCategoryLabels[age] || age).join(', ')}</p>
                    <p><span className="font-semibold text-foreground">Duración:</span> {exercise['Duración (min)']} min</p>
                </div>
                {exercise['Descripción de la tarea'] && (
                    <p className="text-muted-foreground pt-2">
                        {`${exercise['Descripción de la tarea'].substring(0, 100)}${exercise['Descripción de la tarea'].length > 100 ? '...' : ''}`}
                    </p>
                )}
            </CardContent>
            <CardFooter className="bg-card border-t p-3">
                <div className="w-full flex justify-between items-center">
                    <Button asChild variant="outline">
                        <Link href={`/ejercicios/${exercise.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Ficha
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleFavorite(exercise.id)} disabled={!user}>
                        <Heart className={`h-5 w-5 ${favorites.includes(exercise.id) ? 'text-primary fill-current' : 'text-muted-foreground'}`} />
                    </Button>
                </div>
            </CardFooter>
          </Card>
        ))}
         {filteredExercises.length === 0 && (
          <div className="col-span-full text-center py-16">
            <p className="text-muted-foreground">No se encontraron ejercicios con los filtros actuales.</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
