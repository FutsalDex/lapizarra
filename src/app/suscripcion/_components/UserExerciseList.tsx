
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { Edit, Trash2 } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import UploadExerciseForm from '../../admin/_components/UploadExerciseForm';

interface Exercise {
  id: string;
  Ejercicio: string;
  Categoría: string;
  Fase: string;
  Visible: boolean;
}

export default function UserExerciseList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'exercises'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const exercisesData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Exercise)
      );
      setExercises(exercisesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'exercises', id));
      toast({
        title: 'Ejercicio eliminado',
        description: 'Tu ejercicio ha sido eliminado correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el ejercicio.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!user) {
    return <p>Inicia sesión para ver tus ejercicios.</p>;
  }

  if (exercises.length === 0) {
    return <p>Aún no has subido ningún ejercicio.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre del Ejercicio</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Fase</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exercises.map((exercise) => (
            <TableRow key={exercise.id}>
              <TableCell className="font-medium">{exercise.Ejercicio}</TableCell>
              <TableCell>{exercise.Categoría}</TableCell>
              <TableCell>{exercise.Fase}</TableCell>
              <TableCell>{exercise.Visible ? 'Público' : 'En revisión'}</TableCell>
              <TableCell className="text-right">
                <UploadExerciseForm exerciseToEdit={exercise} onFinished={() => {}}>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </UploadExerciseForm>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(exercise.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
