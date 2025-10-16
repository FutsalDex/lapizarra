
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '../../../lib/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Button } from '../../../components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Calendar } from '../../../components/ui/calendar';
import { cn } from '../../../lib/utils';
import { format, addYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { Input } from '../../../components/ui/input';


interface User {
  docId: string;
  email: string;
  role?: 'Admin' | 'Subscribed' | 'Registered' | 'Guest';
  subscription?: string;
  subscriptionStartDate?: Timestamp;
  subscriptionEndDate?: Timestamp;
}

const subscriptionSchema = z.object({
  role: z.string(),
  subscription: z.string(),
  subscriptionStartDate: z.date().optional(),
  subscriptionEndDate: z.date().optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

interface ManageSubscriptionDialogProps {
  user: User;
}

export default function ManageSubscriptionDialog({ user }: ManageSubscriptionDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      role: 'Registered',
      subscription: 'Trial',
    },
  });

  const startDate = form.watch('subscriptionStartDate');

  useEffect(() => {
    if (startDate) {
        const endDate = addYears(startDate, 1);
        form.setValue('subscriptionEndDate', endDate);
    }
  }, [startDate, form]);

  useEffect(() => {
    if (user && open) {
      form.reset({
        role: user.role || 'Registered',
        subscription: user.subscription || 'Trial',
        subscriptionStartDate: user.subscriptionStartDate?.toDate(),
        subscriptionEndDate: user.subscriptionEndDate?.toDate(),
      });
    }
  }, [user, open, form]);

  const onSubmit = async (data: SubscriptionFormValues) => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.docId);
      await updateDoc(userRef, {
        ...data,
        subscriptionStartDate: data.subscriptionStartDate ? Timestamp.fromDate(data.subscriptionStartDate) : null,
        subscriptionEndDate: data.subscriptionEndDate ? Timestamp.fromDate(data.subscriptionEndDate) : null,
      });
      toast({
        title: '¡Suscripción Actualizada!',
        description: `La suscripción para ${user.email} ha sido actualizada.`,
      });
      setOpen(false);
    } catch (error) {
      console.error('Error actualizando la suscripción: ', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al actualizar la suscripción.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left">
          Gestionar Suscripción
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gestionar Suscripción de {user.email}</DialogTitle>
          <DialogDescription>
            Modifica el rol, tipo de suscripción y fechas para este usuario.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol del Usuario</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Subscribed">Subscribed</SelectItem>
                      <SelectItem value="Registered">Registered</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subscription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Suscripción</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Trial">Trial</SelectItem>
                      <SelectItem value="Básico">Básico</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subscriptionStartDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Inicio de Suscripción</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                          {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elige una fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="subscriptionEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Vencimiento (Automática)</FormLabel>
                  <FormControl>
                    <Input
                      readOnly
                      disabled
                      value={field.value ? format(field.value, 'PPP', { locale: es }) : 'Selecciona una fecha de inicio'}
                      className="bg-muted"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
