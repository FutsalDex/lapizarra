
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
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { addDoc, collection, doc, getDoc, updateDoc, Timestamp, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import SelectExerciseDialog from './_components/SelectExerciseDialog';
import Image from 'next/image';
import SessionSheetPreviewDialog from './_components/SessionSheetPreviewDialog';
import '@/app/print.css';
import DownloadOptionsDialog from './_components/DownloadOptionsDialog';

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
  microcycle: z.string().optional(),
  sessionNumber: z.string().min(1, 'El número de sesión es obligatorio.'),
  players: z.string().optional(),
  space: z.string().optional(),
  objectives: z.string().optional(),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

const ExerciseCard = ({
  exercise,
  onSelect,
  onRemove,
  title,
}: {
  exercise: Exercise | null;
  onSelect: () => void;
  onRemove: () => void;
  title: string;
}) => {
  if (exercise) {
    return (
      <Card className="relative group overflow-hidden h-48 flex flex-col">
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
          <Button size="icon" variant="secondary" className="h-8 w-8" onClick={onSelect}>
            <Replace className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="destructive" className="h-8 w-8" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="relative flex flex-col items-center justify-center text-center p-4 border-2 border-dashed h-48 hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <CardHeader className="p-0">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 mt-2">
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground">
          <Plus className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
};


export default function CrearSesionPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('sessionId');

    const [isSaving, setIsSaving] = useState(false);
    
    // State for selected exercises
    const [initialExercises, setInitialExercises] = useState<(Exercise | null)[]>([null]);
    const [mainExercises, setMainExercises] = useState<(Exercise | null)[]>([null, null]);
    const [finalExercises, setFinalExercises] = useState<(Exercise | null)[]>([null]);

    // State for dialogs
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentSelection, setCurrentSelection] = useState<{type: 'initial' | 'main' | 'final', index: number} | null>(null);


    const form = useForm<SessionFormValues>({
        resolver: zodResolver(sessionSchema),
        defaultValues: {
            date: new Date(),
            sessionNumber: '1',
            microcycle: '',
            players: '',
            space: '',
            objectives: '',
        },
    });
    
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
                        players: sessionData.players || '',
                        space: sessionData.space || '',
                        objectives: sessionData.objectives || '',
                    });
                }
            };
            fetchSession();
        }
    }, [sessionId, form]);


    const handleSelectClick = (type: 'initial' | 'main' | 'final', index: number) => {
        setCurrentSelection({ type, index });
        setIsDialogOpen(true);
    };

    const handleExerciseSelected = (exercise: Exercise) => {
        if (currentSelection) {
            switch (currentSelection.type) {
                case 'initial':
                    setInitialExercises(prev => {
                        const newInitial = [...prev];
                        newInitial[currentSelection.index] = exercise;
                        return newInitial;
                    });
                    break;
                case 'main':
                    setMainExercises(prev => {
                        const newMain = [...prev];
                        newMain[currentSelection.index] = exercise;
                        return newMain;
                    });
                    break;
                case 'final':
                    setFinalExercises(prev => {
                        const newFinal = [...prev];
                        newFinal[currentSelection.index] = exercise;
                        return newFinal;
                    });
                    break;
            }
        }
        setIsDialogOpen(false);
        setCurrentSelection(null);
    };

    const addExerciseSlot = (type: 'initial' | 'main' | 'final') => {
        const updaters = {
            'initial': { set: setInitialExercises, limit: 2 },
            'main': { set: setMainExercises, limit: 2 },
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
        microcycle: data.microcycle || '',
        sessionNumber: data.sessionNumber || '1',
        players: data.players || '',
        space: data.space || '',
        objectives: data.objectives || '',
    };

    const sessionData = {
        ...sanitizedData,
        userId: user.uid,
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

  const handleViewSheet = () => {
    const sessionData = {
      ...form.getValues(),
      initialExercise: initialExercises[0],
      mainExercises: mainExercises,
      finalExercise: finalExercises[0],
      date: form.getValues('date')?.toISOString(),
    };
    localStorage.setItem('sessionSheetData', JSON.stringify(sessionData));
    window.open('/crear-sesion/ficha', '_blank');
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
            <CardTitle>Planificación</CardTitle>
            <CardDescription>
              ¿Qué necesitas trabajar en esta sesión?
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
            <FormField
                control={form.control}
                name="players"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jugadores de campo</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 16" {...field}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                 )}
            />
             <FormField
                control={form.control}
                name="space"
                render={({ field }) => (
                     <FormItem>
                        <FormLabel>Espacio disponible</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona el espacio" />
                            </SelectTrigger>
                          </FormControl>
                            <SelectContent>
                                <SelectItem value="full-court">Campo completo</SelectItem>
                                <SelectItem value="half-court">Medio campo</SelectItem>
                                <SelectItem value="small-area">Espacio reducido</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                 )}
            />
            <FormField
                control={form.control}
                name="objectives"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Objetivos</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona objetivos" />
                            </SelectTrigger>
                          </FormControl>
                            <SelectContent>
                                <SelectItem value="attack">Ataque</SelectItem>
                                <SelectItem value="defense">Defensa</SelectItem>
                                <SelectItem value="transition">Transiciones</SelectItem>
                                <SelectItem value="strategy">Estrategia</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
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
                    key={index}
                    exercise={ex}
                    onSelect={() => handleSelectClick('initial', index)}
                    onRemove={() => removeExerciseSlot('initial', index)}
                    title={`Tarea Inicial ${index + 1}`}
                  />
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
                    key={index}
                    exercise={ex}
                    onSelect={() => handleSelectClick('main', index)}
                    onRemove={() => removeExerciseSlot('main', index)}
                    title={`Tarea Principal ${index + 1}`}
                />
                ))}
                 {mainExercises.length < 2 && (
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
                    key={index}
                    exercise={ex}
                    onSelect={() => handleSelectClick('final', index)}
                    onRemove={() => removeExerciseSlot('final', index)}
                    title={`Tarea Final ${index + 1}`}
                  />
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
           <DownloadOptionsDialog onDownload={handleViewSheet}>
              <Button variant="outline" size="lg" type="button">
                <ClipboardList className="mr-2 h-5 w-5" />
                Ver Ficha de Sesión
              </Button>
           </DownloadOptionsDialog>
          <Button variant="secondary" size="lg" type="button" disabled>
            <Sparkles className="mr-2 h-5 w-5" />
            Generar con IA
          </Button>
          <Button size="lg" type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-5 w-5" />}
            {sessionId ? 'Actualizar Sesión' : 'Guardar Sesión'}
          </Button>
        </div>
      </form>
     </Form>
    </div>

    <SelectExerciseDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onExerciseSelect={handleExerciseSelected}
    />
    </>
  );
}
