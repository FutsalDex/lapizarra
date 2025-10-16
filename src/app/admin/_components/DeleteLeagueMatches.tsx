
'use client';

import { useState } from 'react';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { Button } from '../../../components/ui/button';
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
} from "../../../components/ui/alert-dialog";
import { useToast } from '../../../hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function DeleteLeagueMatches() {
  const { db } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'matches'), where('matchType', '==', 'Liga'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: "No hay partidos de liga",
          description: "No se encontraron partidos de tipo 'Liga' para eliminar.",
        });
        setLoading(false);
        return;
      }

      // Firestore allows a maximum of 500 operations in a single batch.
      const batches = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;

      querySnapshot.forEach((doc) => {
        currentBatch.delete(doc.ref);
        operationCount++;
        if (operationCount === 500) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }
      });
      if(operationCount > 0) {
        batches.push(currentBatch);
      }
      
      await Promise.all(batches.map(batch => batch.commit()));

      toast({
        title: '¡Éxito!',
        description: `Se han eliminado ${querySnapshot.size} partidos de liga de la base de datos.`,
      });

    } catch (error) {
      console.error('Error deleting league matches: ', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al eliminar los partidos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Eliminar Partidos de Liga
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminarán permanentemente todos los partidos de tipo "Liga" de la base de datos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sí, eliminar todo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
