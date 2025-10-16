
'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Loader2, PlusCircle, Search } from 'lucide-react';
import Image from 'next/image';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useAuth } from '../../../context/AuthContext';

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
  userId?: string;
}

interface SelectExerciseDialogProps {
  children: React.ReactNode;
  phase: string;
  onExerciseSelect: (exercise: Exercise) => void;
}

const ageCategoryLabels: { [key: string]: string } = {
    'benjamin': 'Benjamín (8-9 años)',
    'alevin': 'Alevín (10-11 años)',
    'infantil': 'Infantil (12-13 años)',
    'cadete': 'Cadete (14-15 años)',
    'juvenil': 'Juvenil (16-18 años)',
    'senior': 'Senior (+18 años)',
};


export default function SelectExerciseDialog({ children, phase, onExerciseSelect }: SelectExerciseDialogProps) {
  const { user, loading: authLoading, db } = useAuth();
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedAge, setSelectedAge] = useState('Todas');
  const [ownerFilter, setOwnerFilter] = useState('todos'); // 'biblioteca', 'mios', 'todos'
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (authLoading || !db) return;
    setLoading(true);

    const publicExercisesQuery = query(collection(db, "exercises"), where("Visible", "==", true));
    
    const unsubPublic = onSnapshot(publicExercisesQuery, (publicSnapshot) => {
        const publicExercises = publicSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
        
        if (user) {
            const userExercisesQuery = query(collection(db, "exercises"), where("userId", "==", user.uid));
            const unsubUser = onSnapshot(userExercisesQuery, (userSnapshot) => {
                const userExercises = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
                const combined = [...publicExercises, ...userExercises];
                const uniqueExercises = Array.from(new Map(combined.map(ex => [ex.id, ex])).values());
                setAllExercises(uniqueExercises);
                setLoading(false);
            }, (err) => {
                console.error("Error fetching user exercises:", err);
                setAllExercises(publicExercises); // Fallback to public
                setLoading(false);
            });
            return () => unsubUser();
        } else {
            setAllExercises(publicExercises);
            setLoading(false);
        }
    }, (err) => {
        console.error("Error fetching public exercises:", err);
        setLoading(false);
    });

    return () => unsubPublic();

  }, [open, user, authLoading, db]);

  const categories = useMemo(() => ['Todas', ...Array.from(new Set(allExercises.map((ex) => ex.Categoría).filter(Boolean)))], [allExercises]);
  const ages = useMemo(() => ['Todas', ...Array.from(new Set(allExercises.flatMap((ex) => ex.Edad).filter(Boolean)))], [allExercises]);

  const filteredExercises = useMemo(() => {
    let exercisesToFilter = allExercises;

    if (ownerFilter === 'biblioteca') {
        exercisesToFilter = exercisesToFilter.filter(ex => ex.Visible);
    } else if (ownerFilter === 'mios' && user) {
        exercisesToFilter = exercisesToFilter.filter(ex => ex.userId === user.uid);
    }
    
    return exercisesToFilter.filter(exercise => {
      const termMatch = (exercise.Ejercicio || '').toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = selectedCategory === 'Todas' || exercise.Categoría === selectedCategory;
      const ageMatch = selectedAge === 'Todas' || (exercise.Edad && exercise.Edad.includes(selectedAge));
      
      return termMatch && categoryMatch && ageMatch;
    });
  }, [allExercises, searchTerm, selectedCategory, selectedAge, ownerFilter, user]);

  const handleSelect = (exercise: Exercise) => {
    onExerciseSelect(exercise);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Seleccionar Ejercicio para {phase}</DialogTitle>
          <DialogDescription>
            Busca y filtra en la biblioteca de ejercicios o en tus propias creaciones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
              placeholder="Buscar por nombre..."
              className="pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Categoría" /></SelectTrigger>
                <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat === 'Todas' ? 'Todas las Categorías' : cat}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={selectedAge} onValueChange={setSelectedAge}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Edad" /></SelectTrigger>
                <SelectContent>
                    {ages.map(age => <SelectItem key={age} value={age}>{age === 'Todas' ? 'Todas las Edades' : ageCategoryLabels[age] || age}</SelectItem>)}
                </SelectContent>
            </Select>
             <div className="col-span-1 md:col-span-2">
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Origen del ejercicio" /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="todos">Todos los ejercicios</SelectItem>
                      <SelectItem value="biblioteca">Solo Biblioteca Pública</SelectItem>
                      <SelectItem value="mios" disabled={!user}>Solo Mis Ejercicios</SelectItem>
                  </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-grow h-0 pr-4 mt-4">
            {loading ? (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            ) : filteredExercises.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
                No hay ejercicios que coincidan con tus filtros.
            </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredExercises.map((exercise) => (
                <div
                    key={exercise.id}
                    className="border rounded-lg overflow-hidden group cursor-pointer"
                    onClick={() => handleSelect(exercise)}
                >
                    <div className="relative h-40 bg-muted">
                    <Image
                        src={
                        exercise.Imagen ||
                        `https://picsum.photos/seed/${exercise.id}/400/250`
                        }
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
                    <p className="font-semibold truncate">
                        {exercise.Ejercicio}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {exercise.Categoría} - {exercise['Duración (min)']} min
                    </p>
                    </div>
                </div>
                ))}
            </div>
            )}
        </ScrollArea>
        <DialogClose asChild>
            <Button type="button" variant="outline" className="mt-4">Cancelar</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
