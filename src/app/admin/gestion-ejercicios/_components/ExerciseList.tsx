
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

interface Exercise {
  id: string;
  name: string;
  category: string;
  isVisible: boolean;
}

export default function ExerciseList() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Query all exercises, not just visible ones
    const unsubscribe = onSnapshot(collection(db, 'exercises'), (snapshot) => {
      const exercisesData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.data().title,
        category: doc.data().category,
        isVisible: doc.data().isVisible,
      } as Exercise));
      setExercises(exercisesData.sort((a,b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleVisibilityChange = async (exerciseId: string, newVisibility: boolean) => {
    setUpdatingId(exerciseId);
    const exerciseRef = doc(db, 'exercises', exerciseId);
    try {
      await updateDoc(exerciseRef, { isVisible: newVisibility });
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
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                <TableHead>Nombre del Ejercicio</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Visible</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredExercises.map((exercise) => (
                <TableRow key={exercise.id}>
                    <TableCell className="font-medium">{exercise.name}</TableCell>
                    <TableCell>
                        <Badge variant="secondary">{exercise.category || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                         {updatingId === exercise.id && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Switch
                            checked={exercise.isVisible}
                            onCheckedChange={(checked) => handleVisibilityChange(exercise.id, checked)}
                            disabled={updatingId === exercise.id}
                            aria-label={`Visibilidad de ${exercise.name}`}
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
