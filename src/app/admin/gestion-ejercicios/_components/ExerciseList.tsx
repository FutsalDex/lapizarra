
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import UploadExerciseForm from '../../_components/UploadExerciseForm';


interface Exercise {
  id: string;
  Número?: string;
  Ejercicio: string;
  Categoría: string;
  Imagen?: string;
  Visible: boolean;
  [key: string]: any; // Allow other properties
}

export default function ExerciseList() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas las Categorías');
  const [visibilityFilter, setVisibilityFilter] = useState('Todos'); // 'Todos', 'Visible', 'Oculto'
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'exercises'), (snapshot) => {
      const exercisesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data
          } as Exercise
      });
      setExercises(exercisesData.sort((a,b) => (a.Ejercicio || '').localeCompare(b.Ejercicio || '')));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const categories = useMemo(() => ['Todas las Categorías', ...Array.from(new Set(exercises.map((ex) => ex.Categoría).filter(Boolean)))], [exercises]);


  const handleVisibilityChange = async (exerciseId: string, newVisibility: boolean) => {
    setUpdatingId(exerciseId);
    const exerciseRef = doc(db, 'exercises', exerciseId);
    try {
      await updateDoc(exerciseRef, { Visible: newVisibility });
      toast({
        title: 'Visibilidad actualizada',
        description: `El ejercicio ahora está ${newVisibility ? 'visible' : 'oculto'}.`,
      });
    } catch (error) {
      console.error('Error updating visibility: ', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la visibilidad del ejercicio.',
        variant: 'destructive',
      });
    } finally {
        setUpdatingId(null);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    const exerciseRef = doc(db, 'exercises', exerciseId);
    try {
      await deleteDoc(exerciseRef);
      toast({
        title: "Ejercicio Eliminado",
        description: "El ejercicio ha sido eliminado permanentemente."
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el ejercicio.',
        variant: 'destructive',
      });
    }
  }

  const filteredExercises = useMemo(() => {
      return exercises.filter(exercise => {
        const termMatch = (exercise.Ejercicio || '').toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = selectedCategory === 'Todas las Categorías' || exercise.Categoría === selectedCategory;
        const visibilityMatch = 
            visibilityFilter === 'Todos' ||
            (visibilityFilter === 'Visible' && exercise.Visible) ||
            (visibilityFilter === 'Oculto' && !exercise.Visible);
        
        return termMatch && categoryMatch && visibilityMatch;
      })
  }, [exercises, searchTerm, selectedCategory, visibilityFilter]);


  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Buscar ejercicio por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:col-span-1"
        />
         <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
        </Select>
         <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
            <SelectTrigger>
                <SelectValue placeholder="Filtrar por visibilidad" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Visible">Visible</SelectItem>
                <SelectItem value="Oculto">Oculto</SelectItem>
            </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border overflow-x-auto">
        {loading ? (
             <div className="space-y-2 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        ) : (
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Imagen</TableHead>
                <TableHead>Nombre del Ejercicio</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredExercises.map((exercise) => (
                <TableRow key={exercise.id}>
                    <TableCell className="font-medium">{exercise.Número || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="w-16 h-10 relative bg-muted rounded-md overflow-hidden">
                        <Image 
                          src={exercise.Imagen || `https://picsum.photos/seed/${exercise.id}/160/100`}
                          alt={exercise.Ejercicio}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{exercise.Ejercicio}</TableCell>
                    <TableCell>
                        <Badge variant="secondary">{exercise.Categoría || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center justify-end gap-2">
                         {updatingId === exercise.id ? <Loader2 className="h-4 w-4 animate-spin" /> :
                         <Switch
                            checked={exercise.Visible}
                            onCheckedChange={(checked) => handleVisibilityChange(exercise.id, checked)}
                            disabled={updatingId === exercise.id}
                            aria-label={`Visibilidad de ${exercise.Ejercicio}`}
                        />
                        }
                        <UploadExerciseForm exerciseToEdit={exercise}>
                           <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                           </Button>
                        </UploadExerciseForm>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro de que quieres eliminar este ejercicio?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el ejercicio de la base de datos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteExercise(exercise.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                       </div>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        )}
      </div>
      {!loading && filteredExercises.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          No se encontraron ejercicios con los filtros actuales.
        </div>
      )}
    </div>
  );
}

    
