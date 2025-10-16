
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const teamSchema = z.object({
  name: z.string().min(3, 'El nombre del equipo debe tener al menos 3 caracteres.'),
  club: z.string().min(3, 'El nombre del club debe tener al menos 3 caracteres.'),
  competition: z.string().optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

interface TeamFormProps {
  children?: React.ReactNode;
  teamData?: any;
}

export default function TeamForm({ children, teamData }: TeamFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const isEditMode = !!teamData;

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      club: '',
      competition: '',
    },
  });

  useEffect(() => {
    if (teamData && open) {
      form.reset({
        name: teamData.name || '',
        club: teamData.club || '',
        competition: teamData.competition || '',
      });
    } else if (!isEditMode) {
      form.reset({
        name: '',
        club: '',
        competition: '',
      });
    }
  }, [teamData, open, form, isEditMode]);

  const onSubmit = async (data: TeamFormValues) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para realizar esta acción.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      if (isEditMode) {
        const teamRef = doc(db, 'teams', teamData.id);
        await updateDoc(teamRef, data);
        toast({
          title: '¡Equipo Actualizado!',
          description: `El equipo "${data.name}" ha sido actualizado con éxito.`,
        });
      } else {
        await addDoc(collection(db, 'teams'), {
          ...data,
          ownerId: user.uid,
          createdAt: new Date(),
        });
        toast({
          title: '¡Equipo Creado!',
          description: `El equipo "${data.name}" ha sido creado con éxito.`,
        });
      }
      form.reset();
      if(isEditMode) setOpen(false);

    } catch (error) {
      console.error('Error guardando el equipo: ', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al guardar el equipo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
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
              <FormLabel>Competición</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Liga Local, Torneo Nacional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className={isEditMode ? 'hidden' : ''}>
           <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Equipo
            </Button>
        </div>
      </form>
    </Form>
  )

  if (isEditMode) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Equipo</DialogTitle>
            <DialogDescription>
              Modifica la información de tu equipo.
            </DialogDescription>
          </DialogHeader>
          {formContent}
           <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return formContent;
}
