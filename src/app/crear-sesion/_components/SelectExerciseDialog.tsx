
'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Loader2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Exercise {
  id: string;
  Ejercicio: string;
  'Descripción de la tarea': string;
  Categoría: string;
  Fase: string;
  Edad: string[];
  'Duración (min)': string;
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

interface SelectExerciseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onExerciseSelect: (exercise: Exercise) => void;
    currentPhase: 'Fase Inicial' | 'Fase Principal' | 'Fase Final' | null;
}

export default function SelectExerciseDialog({ open, onOpenChange, onExerciseSelect, currentPhase }: SelectExerciseDialogProps) {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('Todas');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedAge, setSelectedAge] = useState('Todas');

  useEffect(() => {
    if (open) {
      if (currentPhase) {
        setSelectedPhase(currentPhase);
      } else {
        setSelectedPhase('Todas');
      }
    }
  }, [open, currentPhase]);
  
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    
    let q;
    if (user) {
        q = query(collection(db, "exercises"), where("Visible", "==", true));
    } else {
        q = query(collection(db, "exercises"), where("Visible", "==", true), limit(15));
    }

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
  }, [user, open]);
  
  const phases = useMemo(() => ['Todas', 'Fase Inicial', 'Fase Principal', 'Fase Final'], []);
  const categories = useMemo(() => ['Todas', ...Array.from(new Set(exercises.map((ex) => ex.Categoría).filter(Boolean)))], [exercises]);
  const ages = useMemo(() => ['Todas', ...Array.from(new Set(exercises.flatMap((ex) => ex.Edad).filter(Boolean)))], [exercises]);

  const filteredExercises = useMemo(() => {
      return exercises.filter((exercise) => {
        const termMatch = (exercise.Ejercicio || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const phaseMatch =
          selectedPhase === 'Todas' || exercise.Fase === selectedPhase;
        const categoryMatch =
          selectedCategory === 'Todas' || exercise.Categoría === selectedCategory;
        const ageMatch = 
          selectedAge === 'Todas' || (exercise.Edad && exercise.Edad.includes(selectedAge));

        return termMatch && phaseMatch && categoryMatch && ageMatch;
      });
  }, [exercises, searchTerm, selectedPhase, selectedCategory, selectedAge]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Seleccionar Ejercicio</DialogTitle>
          <DialogDescription>
            Busca y selecciona un ejercicio de tu biblioteca.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar ejercicio por nombre..."
              className="pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedPhase} onValueChange={setSelectedPhase} disabled={loading || !!currentPhase}>
              <SelectTrigger><SelectValue placeholder="Todas las Fases" /></SelectTrigger>
              <SelectContent>
                {phases.map((phase) => <SelectItem key={phase} value={phase}>{phase}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="Todas las Categorías" /></SelectTrigger>
              <SelectContent>
                {categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedAge} onValueChange={setSelectedAge} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="Todas las Edades" /></SelectTrigger>
              <SelectContent>
                 {ages.map((age) => <SelectItem key={age} value={age}>{age === 'Todas' ? 'Todas las Edades' : ageCategoryLabels[age] || age}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <ScrollArea className="flex-grow h-0 mt-4 pr-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-10 w-10 animate-spin text-primary"/>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No se encontraron ejercicios.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExercises.map((exercise) => (
                <div key={exercise.id} className="border rounded-lg overflow-hidden group cursor-pointer" onClick={() => onExerciseSelect(exercise)}>
                  <div className="relative h-40 bg-muted">
                    <Image
                      src={exercise.Imagen || `https://picsum.photos/seed/${exercise.id}/400/250`}
                      alt={exercise.Ejercicio}
                      data-ai-hint={exercise.aiHint || 'futsal drill court'}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                        <PlusCircle className="h-12 w-12 text-white/70 group-hover:text-white group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold truncate">{exercise.Ejercicio}</p>
                    <p className="text-xs text-muted-foreground">{exercise.Categoría} - {exercise['Duración (min)']} min</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
