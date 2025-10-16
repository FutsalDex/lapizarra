
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { Button } from '../../components/ui/button';
import {
  Pencil,
  Plus,
  CalendarIcon,
  Trash2,
  Save,
  ClipboardList,
  Sparkles,
  Replace,
  Loader2,
  Users,
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Calendar } from '../../components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Separator } from '../../components/ui/separator';
import { useAuth } from '../../context/AuthContext';
import { addDoc, collection, doc, getDoc, updateDoc, Timestamp, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useToast } from '../../hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import SelectExerciseDialog from './_components/SelectExerciseDialog';
import DownloadOptionsDialog from './_components/DownloadOptionsDialog';
import Link from 'next/link';


interface Exercise {
  id: string;
  Ejercicio: string;
  'Duración (min)': string;
  Imagen?: string;
  aiHint?: string;
  [key: string]: any;
}

const sessionSchema = z.object({
  date: z.date().optional(),
  team: z.string().optional(),
  season: z.string().optional(),
  club: z.string().optional(),
  microcycle: z.string().optional(),
  sessionNumber: z.string().min(1, 'El número de sesión es obligatorio.'),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

type PhaseType = 'Fase Inicial' | 'Fase Principal' | 'Fase Final';

const ExerciseCard = ({
  exercise,
  onRemove,
  title,
  children,
}: {
  exercise: Exercise | null;
  onRemove: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (exercise) {
    return (
      <div className="relative group">
        <Card className="overflow-hidden h-48 flex flex-col">
          <Image
            src={exercise.Imagen || `https://picsum.photos/seed/${exercise.id}/400/250`}
            alt={exercise.Ejercicio}
            data-ai-hint={exercise.aiHint || 'futsal drill court'}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/60" />
          <CardHeader className="relative z-10 p-2 text-white">
            <CardTitle className="text-sm font-bold truncate">{exercise.Ejercicio}</CardTitle>
            <CardDescription className="text-xs text-gray-300">
              {exercise['Duración (min)']} min
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 mt-auto p-2 flex gap-2">
            {children}
            <Button size="icon" variant="destructive" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-48">
      {children}
    </div>
  );
};


export default function CrearSesionPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('sessionId');
    const teamId = searchParams.get('teamId');

    const [isSaving, setIsSaving] = useState(false);
    
    // State for selected exercises
    const [initialExercises, setInitialExercises] = useState<(Exercise | null)[]>([null]);
    const [mainExercises, setMainExercises] = useState<(Exercise | null)[]>([null, null]);
    const [finalExercises, setFinalExercises] = useState<(Exercise | null)[]>([null]);


    const form = useForm<SessionFormValues>({
        resolver: zodResolver(sessionSchema),
        defaultValues: {
            date: new Date(),
            sessionNumber: '1',
            microcycle: '',
            team: '',
            season: '',
            club: '',
        },
    });

     useEffect(() => {
        if (teamId) {
            const fetchTeamData = async () => {
                const teamDocRef = doc(db, 'teams', teamId);
                const teamDoc = await getDoc(teamDocRef);
                if (teamDoc.exists()) {
                    const data = teamDoc.data();
                    // Set default values for the form from the team data
                    form.setValue('team', data.name);
                    form.setValue('club', data.club);
                }
            };
            fetchTeamData();
        }
    }, [teamId, form]);
    
     useEffect(() => {
        if (sessionId) {
            const fetchSession = async () => {
                const sessionRef = doc(db, 'sessions', sessionId);
                const sessionSnap = await getDoc(sessionRef);
                if (sessionSnap.exists()) {
                    const sessionData = sessionSnap.data();

                    const fetchExercises = async (ids: string[]) => {
                        if (ids.length === 0) return [];
                        const exercisesData: Record<string, Exercise> = {};
                        const chunks = [];
                        for (let i = 0; i < ids.length; i += 30) {
                            chunks.push(ids.slice(i, i + 30));
                        }
                        for(const chunk of chunks) {
                            const exercisesQuery = query(collection(db, 'exercises'), where('__name__', 'in', chunk));
                            const exercisesSnapshot = await getDocs(exercisesQuery);
                            exercisesSnapshot.forEach(doc => {
                                exercisesData[doc.id] = { id: doc.id, ...doc.data() } as Exercise;
                            });
                        }
                        return ids.map(id => exercisesData[id] || null);
                    }
                    
                    const populatedInitial = await fetchExercises(sessionData.initialExercises || []);
                    const populatedMain = await fetchExercises(sessionData.mainExercises || []);
                    const populatedFinal = await fetchExercises(sessionData.finalExercises || []);
                    
                    setInitialExercises(populatedInitial.length > 0 ? populatedInitial : [null]);
                    setMainExercises(populatedMain.length > 0 ? populatedMain : [null, null]);
                    setFinalExercises(populatedFinal.length > 0 ? populatedFinal : [null]);
                    
                    form.reset({
                        date: (sessionData.date as Timestamp).toDate(),
                        microcycle: sessionData.microcycle || '',
                        sessionNumber: sessionData.sessionNumber,
                        team: sessionData.team || '',
                        club: sessionData.club || '',
                        season: sessionData.season || '',
                    });
                }
            };
            fetchSession();
        }
    }, [sessionId, form]);


    const handleExerciseSelected = (type: 'initial' | 'main' | 'final', index: number, exercise: Exercise) => {
         switch (type) {
            case 'initial':
                setInitialExercises(prev => {
                    const newExercises = [...prev];
                    newExercises[index] = exercise;
                    return newExercises;
                });
                break;
            case 'main':
                setMainExercises(prev => {
                    const newExercises = [...prev];
                    newExercises[index] = exercise;
                    return newExercises;
                });
                break;
            case 'final':
                    setFinalExercises(prev => {
                    const newExercises = [...prev];
                    newExercises[index] = exercise;
                    return newExercises;
                });
                break;
        }
    };

    const addExerciseSlot = (type: 'initial' | 'main' | 'final') => {
        const updaters = {
            'initial': { set: setInitialExercises, limit: 2 },
            'main': { set: setMainExercises, limit: 4 },
            'final': { set: setFinalExercises, limit: 2 }
        };
        
        const updater = updaters[type];

        updater.set(prev => prev.length < updater.limit ? [...prev, null] : prev);
    }
    
    const removeExerciseSlot = (type: 'initial' | 'main' | 'final', index: number) => {
        const updater = {
            'initial': setInitialExercises,
            'main': setMainExercises,
            'final': setFinalExercises
        }[type];
        
        updater(prev => {
            const newArr = prev.filter((_, i) => i !== index);
            return newArr.length > 0 ? newArr : [null]; // Always keep at least one slot
        });
    }

  const handleSaveSession = async (data: SessionFormValues) => {
    if (!user) {
        toast({ title: 'Error', description: 'Debes iniciar sesión para guardar una sesión.', variant: 'destructive'});
        return;
    }
    
    const allExercises = [...initialExercises, ...mainExercises, ...finalExercises].filter(Boolean);
    if (allExercises.length === 0) {
        toast({ title: 'Sesión vacía', description: 'Debes añadir al menos un ejercicio para guardar la sesión.', variant: 'destructive'});
        return;
    }

    setIsSaving(true);
    
    const sanitizedData = {
        date: data.date,
        team: data.team || '',
        season: data.season || '',
        club: data.club || '',
        microcycle: data.microcycle || '',
        sessionNumber: data.sessionNumber || '1',
    };

    const sessionData = {
        ...sanitizedData,
        userId: user.uid,
        teamId: teamId || null,
        initialExercises: initialExercises.map(ex => ex?.id).filter(Boolean),
        mainExercises: mainExercises.map(ex => ex?.id).filter(Boolean),
        finalExercises: finalExercises.map(ex => ex?.id).filter(Boolean),
    };
    
    try {
        if (sessionId) {
            const sessionRef = doc(db, 'sessions', sessionId);
            await updateDoc(sessionRef, {
                ...sessionData,
                updatedAt: serverTimestamp()
            });
            toast({ title: '¡Sesión Actualizada!', description: 'Tu sesión de entrenamiento ha sido actualizada.' });
        } else {
            const newSession = await addDoc(collection(db, 'sessions'), {
                ...sessionData,
                createdAt: serverTimestamp(),
            });
            toast({ title: '¡Sesión Guardada!', description: 'Tu sesión de entrenamiento ha sido guardada.' });
            router.push(`/crear-sesion?sessionId=${newSession.id}`);
        }
    } catch (error) {
        console.error("Error saving session: ", error);
        toast({ title: 'Error', description: 'No se pudo guardar la sesión.', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  }

  const getSessionDataForPreview = () => {
    return {
      ...form.getValues(),
      initialExercises: initialExercises.filter(Boolean) as Exercise[],
      mainExercises: mainExercises.filter(Boolean) as Exercise[],
      finalExercises: finalExercises.filter(Boolean) as Exercise[],
      date: form.getValues('date')?.toISOString(),
    };
  };

  return (
    <>
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Pencil className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Creador de Sesiones
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Diseña tu sesión de entrenamiento paso a paso o deja que la IA te
          ayude.
        </p>
      </div>

     <Form {...form}>
     <form onSubmit={form.handleSubmit(handleSaveSession)} className="space-y-12">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Sesión</CardTitle>
            <CardDescription>
              Completa los datos básicos de tu entrenamiento.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Día de entrenamiento</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={'outline'}
                            className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.value && 'text-muted-foreground'
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elige una fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            locale={es}
                            />
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="microcycle"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Microciclo</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ej: 1" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
                control={form.control}
                name="sessionNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de sesión</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Datos del Equipo</CardTitle>
            <CardDescription>
              Información sobre el equipo y los recursos para esta sesión.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <FormField
                    control={form.control}
                    name="season"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temporada</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: 2024-2025" {...field}/>
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
                        <FormLabel>Club</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del club" {...field}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                     )}
                 />
                 <FormField
                    control={form.control}
                    name="team"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Cadete A" {...field}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                     )}
                 />
            </div>
             <Separator/>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold font-headline text-primary mb-2">
            Estructura de la Sesión
          </h2>
          <p className="text-muted-foreground mb-6">
            Selecciona los ejercicios para cada fase del entrenamiento.
          </p>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">
                Fase Inicial
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {initialExercises.map((ex, index) => (
                  <ExerciseCard
                    key={`initial-${index}`}
                    exercise={ex}
                    onRemove={() => removeExerciseSlot('initial', index)}
                    title={`Tarea Inicial ${index + 1}`}
                  >
                    <SelectExerciseDialog onExerciseSelect={(exercise) => handleExerciseSelected('initial', index, exercise)} phase="Fase Inicial">
                      {ex ? (
                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                          <Replace className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Card className="relative flex flex-col items-center justify-center text-center p-4 border-2 border-dashed h-48 hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer">
                            <CardHeader className="p-0">
                                <CardTitle className="text-lg font-semibold">{`Tarea Inicial ${index + 1}`}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 mt-2">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground">
                                <Plus className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>
                      )}
                    </SelectExerciseDialog>
                  </ExerciseCard>
                ))}
                 {initialExercises.length < 2 && (
                  <Card className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed h-48 bg-transparent hover:border-primary hover:bg-accent/50 cursor-pointer" onClick={() => addExerciseSlot('initial')}>
                    <CardHeader className="p-0">
                      <CardTitle className="text-lg font-semibold text-muted-foreground">
                        Añadir Tarea
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 mt-2">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-secondary-foreground">
                        <Plus className="h-6 w-6" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">
                Fase Principal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {mainExercises.map((ex, index) => (
                  <ExerciseCard
                    key={`main-${index}`}
                    exercise={ex}
                    onRemove={() => removeExerciseSlot('main', index)}
                    title={`Tarea Principal ${index + 1}`}
                  >
                    <SelectExerciseDialog onExerciseSelect={(exercise) => handleExerciseSelected('main', index, exercise)} phase="Fase Principal">
                      {ex ? (
                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                          <Replace className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Card className="relative flex flex-col items-center justify-center text-center p-4 border-2 border-dashed h-48 hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer">
                            <CardHeader className="p-0">
                                <CardTitle className="text-lg font-semibold">{`Tarea Principal ${index + 1}`}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 mt-2">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground">
                                <Plus className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>
                      )}
                    </SelectExerciseDialog>
                  </ExerciseCard>
                ))}
                 {mainExercises.length < 4 && (
                  <Card className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed h-48 bg-transparent hover:border-primary hover:bg-accent/50 cursor-pointer" onClick={() => addExerciseSlot('main')}>
                    <CardHeader className="p-0">
                      <CardTitle className="text-lg font-semibold text-muted-foreground">
                        Añadir Tarea
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 mt-2">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-secondary-foreground">
                        <Plus className="h-6 w-6" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">
                Fase Final
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {finalExercises.map((ex, index) => (
                  <ExerciseCard
                    key={`final-${index}`}
                    exercise={ex}
                    onRemove={() => removeExerciseSlot('final', index)}
                    title={`Tarea Final ${index + 1}`}
                  >
                    <SelectExerciseDialog onExerciseSelect={(exercise) => handleExerciseSelected('final', index, exercise)} phase="Fase Final">
                      {ex ? (
                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                          <Replace className="h-4 w-4" />
                        </Button>
                      ) : (
                         <Card className="relative flex flex-col items-center justify-center text-center p-4 border-2 border-dashed h-48 hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer">
                            <CardHeader className="p-0">
                                <CardTitle className="text-lg font-semibold">{`Tarea Final ${index + 1}`}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 mt-2">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground">
                                <Plus className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>
                      )}
                    </SelectExerciseDialog>
                  </ExerciseCard>
                ))}
                 {finalExercises.length < 2 && (
                  <Card className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed h-48 bg-transparent hover:border-primary hover:bg-accent/50 cursor-pointer" onClick={() => addExerciseSlot('final')}>
                    <CardHeader className="p-0">
                      <CardTitle className="text-lg font-semibold text-muted-foreground">
                        Añadir Tarea
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 mt-2">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-secondary-foreground">
                        <Plus className="h-6 w-6" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col md:flex-row justify-end items-center gap-4">
           <DownloadOptionsDialog onDownload={getSessionDataForPreview}>
              <Button variant="outline" size="lg" type="button">
                <ClipboardList className="mr-2 h-5 w-5" />
                Ver Ficha de Sesión
              </Button>
           </DownloadOptionsDialog>
          <Button size="lg" type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-5 w-5" />}
            {sessionId ? 'Actualizar Sesión' : 'Guardar Sesión'}
          </Button>
        </div>
      </form>
     </Form>
    </div>
    </>
  );
}
