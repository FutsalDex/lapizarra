
'use client';

import { useState, useEffect } from 'react';
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
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface Exercise {
  id: string;
  Número?: string;
  Ejercicio: string;
  Categoría: string;
  Imagen?: string;
  visible: boolean;
}

export default function ExerciseList() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'exercises'), (snapshot) => {
      const exercisesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            Número: data.Número,
            Ejercicio: data.Ejercicio,
            Categoría: data.Categoría,
            Imagen: data.Imagen,
            visible: data.visible,
          } as Exercise
      });
      setExercises(exercisesData.sort((a,b) => (a.Ejercicio || '').localeCompare(b.Ejercicio || '')));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleVisibilityChange = async (exerciseId: string, newVisibility: boolean) => {
    setUpdatingId(exerciseId);
    const exerciseRef = doc(db, 'exercises', exerciseId);
    try {
      await updateDoc(exerciseRef, { visible: newVisibility });
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

  const filteredExercises = exercises.filter(exercise =>
    (exercise.Ejercicio || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-start">
        <Input
          placeholder="Buscar ejercicio por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
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
                <TableHead className="text-right">Visible</TableHead>
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
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                         {updatingId === exercise.id && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Switch
                            checked={exercise.visible}
                            onCheckedChange={(checked) => handleVisibilityChange(exercise.id, checked)}
                            disabled={updatingId === exercise.id}
                            aria-label={`Visibilidad de ${exercise.Ejercicio}`}
                        />
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
          No se encontraron ejercicios con ese nombre.
        </div>
      )}
    </div>
  );
}

    

    