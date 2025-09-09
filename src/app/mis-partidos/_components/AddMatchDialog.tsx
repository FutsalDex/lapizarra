
'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const matchSchema = z.object({
  localTeam: z.string().min(1, "El nombre del equipo local es requerido."),
  visitorTeam: z.string().min(1, "El nombre del equipo visitante es requerido."),
  date: z.date({ required_error: 'Debes seleccionar una fecha.' }),
  time: z.string().optional(),
  matchType: z.string().min(1, "Debes seleccionar un tipo de partido."),
  competition: z.string().optional(),
  matchday: z.string().optional(),
});

type MatchFormValues = z.infer<typeof matchSchema>;

interface AddMatchDialogProps {
  children: React.ReactNode;
}

export default function AddMatchDialog({ children }: AddMatchDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      localTeam: '',
      visitorTeam: '',
      date: new Date(),
      time: '',
      matchType: '',
      competition: '',
      matchday: '',
    },
  });

  const onSubmit = async (data: MatchFormValues) => {
    if (!user) {
      toast({ title: 'Error', description: 'Debes iniciar sesión para añadir un partido.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'matches'), {
        ...data,
        userId: user.uid,
        localScore: 0,
        visitorScore: 0,
        status: 'pending',
        createdAt: new Date(),
      });
      toast({ title: '¡Éxito!', description: 'El partido ha sido añadido.' });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error adding match: ', error);
      toast({ title: 'Error', description: 'Hubo un problema al añadir el partido.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Partido</DialogTitle>
          <DialogDescription>
            Introduce los datos básicos del partido. Podrás añadir las estadísticas más tarde.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="localTeam" className="text-right">Equipo Local</Label>
              <FormField
                control={form.control}
                name="localTeam"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="visitorTeam" className="text-right">Equipo Visitante</Label>
                <FormField
                    control={form.control}
                    name="visitorTeam"
                    render={({ field }) => (
                    <FormItem className="col-span-2">
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
             <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Fecha y Hora</Label>
                <div className="col-span-2 grid grid-cols-2 gap-2">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}
                                    >
                                    {field.value ? (format(field.value, "PPP", { locale: es })) : (<span>Elige fecha</span>)}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                                </PopoverContent>
                            </Popover>
                             <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl><Input type="time" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Tipo de Partido</Label>
                 <FormField
                    control={form.control}
                    name="matchType"
                    render={({ field }) => (
                    <FormItem className="col-span-2">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Amistoso">Amistoso</SelectItem>
                                <SelectItem value="Liga">Liga</SelectItem>
                                <SelectItem value="Torneo">Torneo</SelectItem>
                                <SelectItem value="Copa">Copa</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="competition" className="text-right">Competición</Label>
                <FormField
                    control={form.control}
                    name="competition"
                    render={({ field }) => (
                    <FormItem className="col-span-2">
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="matchday" className="text-right">Jornada</Label>
                <FormField
                    control={form.control}
                    name="matchday"
                    render={({ field }) => (
                    <FormItem className="col-span-2">
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

            <DialogFooter>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar y Editar
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
