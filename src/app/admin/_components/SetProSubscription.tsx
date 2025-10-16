
'use client';

import { useState } from 'react';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
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
import { Loader2, Crown } from 'lucide-react';
import { errorEmitter } from '../../../lib/firebase/error-emitter';
import { FirestorePermissionError } from '../../../lib/firebase/errors';
import { useAuth } from '../../../context/AuthContext';

export default function SetProSubscription() {
  const { db } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpdateToPro = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const usersCollection = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollection);

      if (querySnapshot.empty) {
        toast({
          title: "No hay usuarios",
          description: "No se encontraron usuarios para actualizar.",
        });
        setLoading(false);
        return;
      }

      const batches = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;

      querySnapshot.forEach((doc) => {
        currentBatch.update(doc.ref, { subscription: 'Pro', role: 'Suscrito' });
        operationCount++;
        if (operationCount === 500) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }
      });
      if (operationCount > 0) {
        batches.push(currentBatch);
      }
      
      await Promise.all(batches.map(batch => batch.commit().catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'users collection',
          operation: 'update',
        }));
      })));

      toast({
        title: '¡Éxito!',
        description: `Se han actualizado ${querySnapshot.size} usuarios a la suscripción "Pro".`,
      });

    } catch (error: any) {
       errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'users collection',
          operation: 'list',
        }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="secondary" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Crown className="mr-2 h-4 w-4" />
          )}
          Poner a todos como Pro
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción establecerá la suscripción de TODOS los usuarios a "Pro" y su rol a "Suscrito". Esta acción es masiva y debe usarse con precaución.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpdateToPro} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sí, actualizar todo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
