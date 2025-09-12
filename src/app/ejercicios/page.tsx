
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Heart, Search, Eye, Filter, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { collection, onSnapshot, query, where, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';


interface Exercise {
  id: string;
  id_ejercicio?: string;
  Nombre_del_ejercicio: string;
  Descripción_de_la_tarea: string;
  Objetivos: string;
  Fase_de_la_sesión: string;
  Categoria: string;
  Etiquetas_de_edad: string[];
  Jugadores: string;
  Duracion: string;
  Materiales_y_espacio: string;
  Variantes_del_ejercicio?: string;
  Consejos_para_el_entrenador?: string;
  URL_de_la_imagen_del_ejercicio?: string;
  visible: boolean;
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
    const q = query(collection(db, "exercises"), where("visible", "==", true));
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
        const userDoc = await getDoc(userDocRef);
        // Firestore update with merge: true will create the document if it doesn't exist.
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

  const phases = useMemo(() => ['Todas', ...Array.from(new Set(exercises.map((ex) => ex.Fase_de_la_sesión).filter(Boolean)))], [exercises]);
  const categories = useMemo(() => ['Todas', ...Array.from(new Set(exercises.map((ex) => ex.Categoria).filter(Boolean)))], [exercises]);
  const ages = useMemo(() => ['Todas', ...Array.from(new Set(exercises.flatMap((ex) => ex.Etiquetas_de_edad).filter(Boolean)))], [exercises]);

  const filteredExercises = useMemo(() => {
      return exercises.filter((exercise) => {
        const termMatch = exercise.Nombre_del_ejercicio
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const phaseMatch =
          selectedPhase === 'Todas' || exercise.Fase_de_la_sesión === selectedPhase;
        const categoryMatch =
          selectedCategory === 'Todas' || exercise.Categoria === selectedCategory;
        const ageMatch = 
          selectedAge === 'Todas' || (exercise.Etiquetas_de_edad && exercise.Etiquetas_de_edad.includes(selectedAge));

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
        <p className="text-sm text-muted-foreground">Total de ejercicios: {filteredExercises.length}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({length: 6}).map((_, index) => (
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
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredExercises.map((exercise) => (
          <Card key={exercise.id} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
             <div className="relative aspect-[4/3] bg-muted">
                {exercise.URL_de_la_imagen_del_ejercicio && (
                     <Image
                        src={exercise.URL_de_la_imagen_del_ejercicio}
                        alt={exercise.Nombre_del_ejercicio}
                        data-ai-hint={exercise.aiHint || 'futsal drill court'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                )}
             </div>

            <CardHeader className="pb-3">
              <CardTitle className="font-bold text-xl">
                 {exercise.id_ejercicio ? `${exercise.id_ejercicio} - ` : ''}{exercise.Nombre_del_ejercicio}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-3 text-sm">
                <div className="text-muted-foreground space-y-1">
                    <p><span className="font-semibold text-foreground">Fase:</span> {exercise.Fase_de_la_sesión}</p>
                    <p><span className="font-semibold text-foreground">Edad:</span> {exercise.Etiquetas_de_edad?.map(age => ageCategoryLabels[age] || age).join(', ')}</p>
                    <p><span className="font-semibold text-foreground">Duración:</span> {exercise.Duracion} min</p>
                </div>
                <p className="text-muted-foreground pt-2">
                    {exercise.Descripción_de_la_tarea && `${exercise.Descripción_de_la_tarea.substring(0, 100)}${exercise.Descripción_de_la_tarea.length > 100 ? '...' : ''}`}
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
                    <Button variant="ghost" size="icon" onClick={() => toggleFavorite(exercise.id)}>
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
