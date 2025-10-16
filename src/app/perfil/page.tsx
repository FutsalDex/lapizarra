
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, KeyRound, CalendarDays } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const profileSchema = z.object({
  displayName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida.'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres.'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

const roleMapping = {
  'Registered': 'Registrado',
  'Subscribed': 'Suscrito',
  'Admin': 'Administrador',
};

type EnglishRole = keyof typeof roleMapping;


export default function PerfilPage() {
  const { user, userProfile, auth } = useAuth();
  const { toast } = useToast();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleUpdateProfile = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      await updateProfile(user, { displayName: values.displayName });
      toast({
        title: '¡Perfil Actualizado!',
        description: 'Tu nombre se ha actualizado correctamente.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async (values: z.infer<typeof passwordSchema>) => {
    if (!user || !user.email) return;
    setLoadingPassword(true);

    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // If re-authentication is successful, update the password
      await updatePassword(user, values.newPassword);

      toast({
        title: '¡Contraseña Cambiada!',
        description: 'Tu contraseña se ha cambiado con éxito.',
      });
      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: 'Error al cambiar la contraseña',
        description: 'La contraseña actual es incorrecta o ha ocurrido otro error.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  if (!user) {
    return null;
  }

  const startDate = userProfile?.subscriptionStartDate?.toDate();
  const endDate = userProfile?.subscriptionEndDate?.toDate();
  const userRole = userProfile?.role as EnglishRole | undefined;
  const translatedRole = userRole ? roleMapping[userRole] || userRole : 'N/A';

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4 space-y-8">
      <div className="text-left">
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">Mi Perfil</h1>
        <p className="text-lg text-muted-foreground mt-2">Gestiona tu información personal y la seguridad de tu cuenta.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User />Información del Perfil</CardTitle>
          <CardDescription>Actualiza tu nombre de usuario y tu email.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email || ''} disabled />
                <p className="text-xs text-muted-foreground">El email no puede ser modificado.</p>
              </div>
              <Button type="submit" disabled={loadingProfile}>
                {loadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
       <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays />Información de Suscripción</CardTitle>
            <CardDescription>Detalles sobre tu plan actual.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Plan Actual</Label>
                <Input value={userProfile?.subscription || 'N/A'} disabled />
              </div>
               <div className="space-y-2">
                <Label>Rol</Label>
                <Input value={translatedRole} disabled />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <Input value={startDate ? format(startDate, "PPP", { locale: es }) : 'N/A'} disabled />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Vencimiento</Label>
                <Input value={endDate ? format(endDate, "PPP", { locale: es }) : 'N/A'} disabled />
              </div>
          </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound />Cambiar Contraseña</CardTitle>
          <CardDescription>Para mayor seguridad, asegúrate de utilizar una contraseña segura.</CardDescription>
        </CardHeader>
        <CardContent>
           <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handleUpdatePassword)} className="space-y-4">
               <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña Actual</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loadingPassword}>
                {loadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cambiar Contraseña
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
