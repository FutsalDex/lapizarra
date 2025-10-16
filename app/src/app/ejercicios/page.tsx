
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Heart, Search, Eye, Filter, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import Image from 'next/image';
import { collection, onSnapshot, query, where, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/use-toast';
import Link from 'next/link';


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

const EXERCISES_PER_PAGE = 12;

export default function EjerciciosPage() {
  const { user, loading: authLoading, db } = useAuth();
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedAge, setSelectedAge] = useState('Todas');
  const [selectedPhase, setSelectedPhase] = useState('Todas');
  const [sortBy, setSortBy] = useState('name_asc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (authLoading || !db) return;
    
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
  }, [user, authLoading, db]);

  useEffect(() => {
    if (!user || !db) return;
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
            setFavorites(doc.data().favorites || []);
        }
    });
    return () => unsubscribe();
  }, [user, db]);
  
  const toggleFavorite = async (exerciseId: string) => {
    if (!user || !db) {
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

  const categories = useMemo(() => ['Todas', ...Array.from(new Set(exercises.map((ex) => ex.Categoría).filter(Boolean)))], [exercises]);
  const ages = useMemo(() => ['Todas', ...Array.from(new Set(exercises.flatMap((ex) => ex.Edad).filter(Boolean)))], [exercises]);
  const phases = useMemo(() => ['Todas', ...Array.from(new Set(exercises.map((ex) => ex.Fase).filter(Boolean)))], [exercises]);


  const filteredExercises = useMemo(() => {
      const filtered = exercises.filter((exercise) => {
        const termMatch = (exercise.Ejercicio || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const categoryMatch =
          selectedCategory === 'Todas' || exercise.Categoría === selectedCategory;
        const ageMatch = 
          selectedAge === 'Todas' || (exercise.Edad && exercise.Edad.includes(selectedAge));
        const phaseMatch =
            selectedPhase === 'Todas' || exercise.Fase === selectedPhase;

        return termMatch && categoryMatch && ageMatch && phaseMatch;
      });

      const sorted = filtered.sort((a, b) => {
          if (sortBy === 'name_asc') {
              return (a.Ejercicio || '').localeCompare(b.Ejercicio || '');
          }
          if (sortBy === 'number_asc' || sortBy === 'number_desc') {
            // Treat non-numeric and empty strings as very large numbers
            const numA = parseInt(a.Número?.trim() || '999999', 10);
            const numB = parseInt(b.Número?.trim() || '999999', 10);

            if (isNaN(numA) && isNaN(numB)) return 0;
            if (isNaN(numA)) return 1; // Put NaNs at the end
            if (isNaN(numB)) return -1;
            
            return sortBy === 'number_asc' ? numA - numB : numB - numA;
          }
          return 0;
      });

      return sorted;

  }, [exercises, searchTerm, selectedCategory, selectedAge, selectedPhase, sortBy]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedAge, selectedPhase, sortBy]);


  const paginatedExercises = useMemo(() => {
      const startIndex = (currentPage - 1) * EXERCISES_PER_PAGE;
      const endIndex = startIndex + EXERCISES_PER_PAGE;
      return filteredExercises.slice(startIndex, endIndex);
  }, [filteredExercises, currentPage]);

  const totalPages = Math.ceil(filteredExercises.length / EXERCISES_PER_PAGE);

  const handlePageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
          setCurrentPage(newPage);
      }
  }


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
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative md:col-span-1 lg:col-span-2">
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
                    {phase === 'Todas' ? 'Todas las Fases' : phase}
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
                    {category === 'Todas' ? 'Todas las Categorías' : category}
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
         <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Mostrando {filteredExercises.length} de {exercises.length} ejercicios.</p>
             <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full max-w-[200px] h-9">
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Ordenar por..." />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="name_asc">Nombre (A-Z)</SelectItem>
                    <SelectItem value="number_asc">Número Ejercicio (asc)</SelectItem>
                    <SelectItem value="number_desc">Número Ejercicio (desc)</SelectItem>
                </SelectContent>
            </Select>
        </div>
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
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedExercises.map((exercise) => (
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
                        <p><span className="font-semibold text-foreground">Fase:</span> {exercise.Fase}</p>
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
        </div>

        {filteredExercises.length === 0 && (
            <div className="col-span-full text-center py-16">
                <p className="text-muted-foreground">No se encontraron ejercicios con los filtros actuales.</p>
            </div>
        )}

        {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-12">
                <Button variant="outline" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Anterior
                </Button>
                <span className="text-sm font-medium">
                    Página {currentPage} de {totalPages}
                </span>
                <Button variant="outline" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        )}
      </>
      )}
    </div>
  );
}
