
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '../../lib/firebase/error-emitter';
import { useToast } from '../../hooks/use-toast';
import { FirestorePermissionError } from '../../lib/firebase/errors';

export default function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: any) => {
      if (process.env.NODE_ENV === 'development') {
        // En desarrollo, lanzamos el error para que Next.js lo capture y muestre el overlay.
        // Esto es mucho más útil para depurar reglas de seguridad.
        setTimeout(() => {
          throw error;
        }, 0);
      } else {
        // En producción, mostramos un toast genérico.
        console.error("Firebase Permission Error:", error);
        toast({
          variant: "destructive",
          title: "Error de Permiso",
          description: "No tienes permiso para realizar esta acción.",
        });
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null; // Este componente no renderiza nada.
}
