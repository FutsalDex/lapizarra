'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
  DialogClose,
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
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';

const matchSchema = z.object({
  localTeam: z.string().min(1, "El nombre del equipo local es requerido."),
  visitorTeam: z.string().min(1, "El nombre del equipo visitante es requerido."),
  date: z.date({ required_error: 'Debes seleccionar una fecha.' }),
  hour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  matchType: z.string().min(1, "Debes seleccionar un tipo de partido."),
  competition: z.string().optional(),
  matchday: z.string().optional(),
});

type MatchFormValues = z.infer<typeof matchSchema>;

interface TeamData {
    name: string;
    competition?: string;
}

interface AddMatchDialogProps {
  children: React.ReactNode;
  teamId: string;
  matchData?: any; // To edit existing match
}

export default function AddMatchDialog({ children, teamId, matchData }: AddMatchDialogProps) {
  const { user, db } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teamDataState, setTeamDataState] = useState<TeamData | null>(null);

  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      localTeam: '',
      visitorTeam: '',
      date: new Date(),
      hour: '00:00',
      matchType: '',
      competition: '',
      matchday: '',
    },
  });

  const matchType = form.watch('matchType');

   useEffect(() => {
    const fetchTeamData = async () => {
        if (!teamId || !db) return;
        const teamDocRef = doc(db, 'teams', teamId);
        const teamDoc = await getDoc(teamDocRef);
        if(teamDoc.exists()) {
            const data = teamDoc.data() as TeamData;
            setTeamDataState(data);
            if (form.getValues('matchType') === 'Liga' || !matchData) {
              form.setValue('competition', data.competition || '');
            }
        }
    }

    if (open) {
        fetchTeamData();
    }
   }, [teamId, open, form, matchData, db]);


  useEffect(() => {
    if (matchData && open) {
        const matchDate = new Date(matchData.date);
        form.reset({
            ...matchData,
            date: matchDate,
            hour: format(matchDate, 'HH:mm'),
        });
    } else if (teamDataState) {
        form.reset({
            localTeam: '',
            visitorTeam: '',
            date: new Date(),
            hour: '12:00',
            matchType: '',
            competition: teamDataState.competition || '',
            matchday: '',
        })
    }
  }, [matchData, teamDataState, form, open]);


  const onSubmit = async (data: MatchFormValues) => {
    if (!user || !db) {
      toast({ title: 'Error', description: 'Debes iniciar sesión para gestionar partidos.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    
    const [hours, minutes] = data.hour.split(':').map(Number);
    const combinedDate = new Date(data.date);
    combinedDate.setHours(hours, minutes);

    const submissionData = {
        ...data,
        date: combinedDate.toISOString(),
        teamId: teamId,
        userId: user.uid,
        competition: data.matchType === 'Liga' ? data.competition : '',
    };
    
    // Remove hour from submission data as it's now part of the ISO date
    delete (submissionData as any).hour;


    try {
        if(matchData?.id) {
            const matchRef = doc(db, 'matches', matchData.id);
            await updateDoc(matchRef, submissionData);
            toast({ title: '¡Éxito!', description: 'El partido ha sido actualizado.' });
        } else {
             await addDoc(collection(db, 'matches'), {
                ...submissionData,
                localScore: 0,
                visitorScore: 0,
                status: 'pending',
                createdAt: new Date(),
            });
            toast({ title: '¡Éxito!', description: 'El partido ha sido añadido.' });
        }

      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error saving match: ', error);
      toast({ title: 'Error', description: 'Hubo un problema al guardar el partido.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{matchData?.id ? 'Editar Partido' : 'Añadir Nuevo Partido'}</DialogTitle>
          <DialogDescription>
            Introduce los datos básicos del partido. Podrás añadir las estadísticas más tarde.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="localTeam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipo Local</FormLabel>
                    <div className="flex items-center gap-2">
                         <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <Button type="button" variant="outline" onClick={() => form.setValue('localTeam', teamDataState?.name || '')}>Mi Equipo</Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visitorTeam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipo Visitante</FormLabel>
                    <div className="flex items-center gap-2">
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                         <Button type="button" variant="outline" onClick={() => form.setValue('visitorTeam', teamDataState?.name || '')}>Mi Equipo</Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                         <FormLabel>Fecha</FormLabel>
                         <Popover>
                            <div className="relative">
                                <FormControl>
                                    <Input
                                        value={field.value ? format(field.value, 'dd/MM/yyyy') : ''}
                                        onChange={(e) => {
                                            const date = parse(e.target.value, 'dd/MM/yyyy', new Date());
                                            if (!isNaN(date.getTime())) {
                                                field.onChange(date);
                                            }
                                        }}
                                        placeholder="DD/MM/AAAA"
                                    />
                                </FormControl>
                                <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                                    <CalendarIcon className="h-4 w-4 opacity-50" />
                                </Button>
                                </PopoverTrigger>
                            </div>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es}/>
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="hour"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                         <FormLabel>Hora</FormLabel>
                            <FormControl>
                               <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <FormField
                    control={form.control}
                    name="matchType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tipo de Partido</FormLabel>
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

             <div className="grid grid-cols-2 gap-4">
                 {matchType === 'Liga' && (
                    <FormField
                        control={form.control}
                        name="competition"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Competición</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 )}
                 <FormField
                    control={form.control}
                    name="matchday"
                    render={({ field }) => (
                    <FormItem>
                         <FormLabel>Jornada</FormLabel>
                        <FormControl><Input placeholder="Ej: Jornada 5" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
            <DialogFooter className="pt-4">
                 <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancelar</Button>
                 </DialogClose>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {matchData?.id ? 'Guardar Cambios' : 'Guardar y Editar'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
