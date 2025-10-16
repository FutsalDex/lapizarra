
'use client';

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../hooks/use-toast';
import { useAuth } from '../../../context/AuthContext';
import { Loader2, ShieldCheck } from 'lucide-react';
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

export default function GrantAdminClaim() {
  const { user, functions } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGrantAdmin = async () => {
    if (!user || !user.email || !functions) {
      toast({ title: 'Error', description: 'Debes iniciar sesión y la conexión con Firebase debe estar activa.', variant: 'destructive' });
      return;
    }
    setLoading(true);

    try {
      const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
      const result = await setAdminClaim({ email: user.email });
      
      // The custom claim is set on the backend. The user needs to re-authenticate
      // or force-refresh the token to see the change.
      await user.getIdToken(true); // Force refresh the ID token

      toast({
        title: '¡Rol de Administrador Otorgado!',
        description: 'Se te ha concedido el rol de administrador. Puede que necesites refrescar la página.',
      });
    } catch (error: any) {
      console.error('Error granting admin role:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo otorgar el rol de administrador.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="secondary" disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <ShieldCheck className="mr-2 h-5 w-5" />
          )}
          Otorgarme Rol de Admin
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar Rol de Administrador?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción te dará permisos de administrador sobre todos los datos de la aplicación.
            Este es un paso de desarrollo y no debe estar disponible para usuarios finales.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleGrantAdmin} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sí, otorgar rol
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
