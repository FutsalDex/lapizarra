
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Bookmark, Search, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface Exercise {
  id: string;
  title: string;
  category: string;
  tags: string[];
  description: string;
  image: string;
  aiHint: string;
}

export default function EjerciciosPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  useEffect(() => {
    const exercisesCol = collection(db, 'exercises');
    const unsubscribe = onSnapshot(exercisesCol, (snapshot) => {
      const exercisesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
      setExercises(exercisesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching exercises: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const categories = ['Todos', ...Array.from(new Set(exercises.map((ex) => ex.category)))];

  const filteredExercises = exercises.filter((exercise) => {
    const termMatch = exercise.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const categoryMatch =
      selectedCategory === 'Todos' || exercise.category === selectedCategory;
    return termMatch && categoryMatch;
  });

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline tracking-tighter text-primary">
          Biblioteca de Ejercicios
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Explora, filtra y encuentra la inspiración para tu próximo
          entrenamiento.
        </p>
      </div>

      <div className="mb-8 p-4 bg-card rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar ejercicio por nombre..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({length: 6}).map((_, index) => (
                <Card key={index}>
                    <Skeleton className="h-[200px] w-full" />
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                         <Skeleton className="h-4 w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-6 w-1/3" />
                    </CardFooter>
                </Card>
            ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExercises.map((exercise) => (
          <Card key={exercise.id} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="relative aspect-video">
              <Image
                src={exercise.image}
                alt={exercise.title}
                data-ai-hint={exercise.aiHint}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="font-headline text-xl">
                  {exercise.title}
                </CardTitle>
                <Button variant="ghost" size="icon" className="flex-shrink-0 -mt-2 -mr-2">
                  <Bookmark className="h-5 w-5 text-muted-foreground hover:text-primary" />
                </Button>
              </div>
              <CardDescription>{exercise.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground text-sm">
                {exercise.description}
              </p>
            </CardContent>
            <CardFooter>
              <div className="flex flex-wrap gap-2">
                {exercise.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
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
