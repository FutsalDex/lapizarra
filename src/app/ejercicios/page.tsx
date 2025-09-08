
'use client';

import { useState } from 'react';
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
import { Bookmark, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const exercises = [
  {
    title: 'Rondo 4 vs 2',
    category: 'Técnica',
    tags: ['Pase', 'Control', 'Presión'],
    description:
      'Clásico rondo para mejorar la velocidad del pase y la presión tras pérdida.',
    image: 'https://picsum.photos/400/250',
    aiHint: 'futsal drill'
  },
  {
    title: 'Transición Ataque-Defensa 3 vs 2',
    category: 'Táctica',
    tags: ['Transición', 'Superioridad', 'Defensa'],
    description:
      'Ejercicio para trabajar las transiciones rápidas y la toma de decisiones en superioridad e inferioridad numérica.',
    image: 'https://picsum.photos/400/251',
    aiHint: 'futsal tactics'
  },
  {
    title: 'Finalización con Oposición',
    category: 'Finalización',
    tags: ['Tiro', '1v1', 'Definición'],
    description:
      'Los atacantes intentan finalizar contra un defensor activo, mejorando la definición bajo presión.',
    image: 'https://picsum.photos/400/252',
    aiHint: 'futsal shooting'
  },
  {
    title: 'Salida de Presión 3+1',
    category: 'Táctica',
    tags: ['Salida de balón', 'Presión alta', 'Movilidad'],
    description:
      'Simula la salida desde el portero contra un equipo que presiona alto, buscando líneas de pase seguras.',
    image: 'https://picsum.photos/400/253',
    aiHint: 'futsal game'
  },
  {
    title: 'Juego de Posesión con Comodines',
    category: 'Técnica',
    tags: ['Posesión', 'Movilidad', 'Apoyos'],
    description:
      'Dos equipos compiten por la posesión con la ayuda de comodines ofensivos para crear superioridades.',
    image: 'https://picsum.photos/400/254',
    aiHint: 'team huddle'
  },
  {
    title: 'Estrategia de Córner Ofensivo',
    category: 'Estrategia',
    tags: ['ABP', 'Bloqueos', 'Movimientos'],
    description:
      'Diseño y repetición de jugadas ensayadas para saques de esquina, buscando generar ocasiones de gol.',
    image: 'https://picsum.photos/400/255',
    aiHint: 'futsal strategy'
  },
];

const categories = [
  'Todos',
  'Técnica',
  'Táctica',
  'Finalización',
  'Estrategia',
];

export default function EjerciciosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExercises.map((exercise, index) => (
          <Card key={index} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="relative aspect-video">
              <Image
                src={exercise.image}
                alt={exercise.title}
                data-ai-hint={exercise.aiHint}
                fill
                className="object-cover"
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
    </div>
  );
}
