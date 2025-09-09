
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const teamSchema = z.object({
  name: z.string().min(3, 'El nombre del equipo debe tener al menos 3 caracteres.'),
  club: z.string().min(3, 'El nombre del club debe tener al menos 3 caracteres.'),
  competition: z.string().optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

export default function CreateTeamForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      club: '',
      competition: '',
    },
  });

  const onSubmit = async (data: TeamFormValues) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para crear un equipo.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'teams'), { 
          ...data,
          ownerId: user.uid,
          createdAt: new Date(),
      });
      toast({
        title: '¡Equipo Creado!',
        description: `El equipo "${data.name}" ha sido creado con éxito.`,
      });
      form.reset();
    } catch (error) {
      console.error('Error creating team: ', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al crear el equipo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Equipo</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Cadete A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="club"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Club</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Futsal Club Ejemplo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="competition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Competición (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Liga Local, Torneo Nacional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Equipo
        </Button>
      </form>
    </Form>
  );
}
