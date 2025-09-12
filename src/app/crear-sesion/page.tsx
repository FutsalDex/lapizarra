
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { collection, onSnapshot, query, where, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, Filter, ClipboardList, ListPlus, ListChecks, ListEnd, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


interface Exercise {
  id: string;
  Nombre_del_ejercicio: string;
  Duracion: string;
  Fase_de_la_sesión: string;
  Categoria: string;
  visible: boolean;
}

const sessionSchema = z.object({
  initialExercise: z.string().min(1, 'Debes seleccionar un ejercicio de calentamiento.'),
  mainExercises: z.array(z.string()).min(1, 'Debes seleccionar al menos un ejercicio principal.'),
  finalExercise: z.string().min(1, 'Debes seleccionar un ejercicio de vuelta a la calma.'),
  sessionNumber: z.string().optional(),
  date: z.date({ required_error: 'Debes seleccionar una fecha.' }),
  season: z.string().optional(),
  club: z.string().optional(),
  team: z.string().optional(),
});

type SessionFormValues = z.infer<typeof sessionSchema>;


export default function CrearSesionPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  
  const [mainCategories, setMainCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      initialExercise: '',
      mainExercises: [],
      finalExercise: '',
      sessionNumber: '',
      date: new Date(),
      season: '',
      club: '',
      team: '',
    },
  });

  useEffect(() => {
    const q = query(collection(db, "exercises"), where("visible", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const exercisesData = snapshot.docs.map(doc => ({ 
          id: doc.id,
          ...doc.data() 
      } as Exercise));
      setAllExercises(exercisesData);
      
      const uniqueCategories = Array.from(new Set(exercisesData
        .filter(ex => ex.Fase_de_la_sesión === 'Parte Principal' && ex.Categoria)
        .map(ex => ex.Categoria)));
      setMainCategories(uniqueCategories);

      setLoading(false);
    }, (error) => {
      console.error("Error fetching exercises: ", error);
      setLoading(false);
      toast({ title: "Error", description: "No se pudieron cargar los ejercicios.", variant: "destructive" });
    });

    return () => unsubscribe();
  }, [toast]);

  const warmUpExercises = useMemo(() => 
    allExercises.filter(ex => ex.Fase_de_la_sesión === 'Calentamiento'), 
  [allExercises]);
  
  const coolDownExercises = useMemo(() => 
    allExercises.filter(ex => ex.Fase_de_la_sesión === 'Vuelta a la Calma'),
  [allExercises]);

  const filteredMainExercises = useMemo(() => {
    return allExercises.filter(ex => 
      ex.Fase_de_la_sesión === 'Parte Principal' &&
      (selectedCategories.length === 0 || selectedCategories.includes(ex.Categoria))
    );
  }, [allExercises, selectedCategories]);

  const handleCategoryToggle = (category: string) => {
      setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  }
  
  const selectedSessionExercises = useMemo(() => {
    const values = form.getValues();
    const initial = allExercises.find(ex => ex.id === values.initialExercise);
    const main = values.mainExercises.map(id => allExercises.find(ex => ex.id === id)).filter(Boolean);
    const final = allExercises.find(ex => ex.id === values.finalExercise);
    return { initial, main, final };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allExercises, form.watch()]);

  const totalDuration = useMemo(() => {
      const initialDuration = parseInt(selectedSessionExercises.initial?.Duracion || '0', 10);
      const mainDuration = selectedSessionExercises.main.reduce((acc, ex) => acc + parseInt(ex?.Duracion || '0', 10), 0);
      const finalDuration = parseInt(selectedSessionExercises.final?.Duracion || '0', 10);
      return initialDuration + mainDuration + finalDuration;
  }, [selectedSessionExercises]);


  const onSubmit = async (data: SessionFormValues) => {
    if (!user) {
      toast({ title: "Acción requerida", description: "Debes iniciar sesión para guardar una sesión.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'sessions'), {
        userId: user.uid,
        ...data,
        createdAt: new Date(),
      });
      toast({ title: "¡Sesión Guardada!", description: "Tu plan de entrenamiento ha sido guardado." });
      form.reset();
      setSelectedCategories([]);
    } catch (error) {
      console.error("Error saving session: ", error);
      toast({ title: "Error", description: "Hubo un problema al guardar la sesión.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <div className="text-left mb-12">
        <h1 className="text-4xl font-bold font-headline tracking-tighter text-primary">
          Crear Sesión
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Selecciona ejercicios de nuestra biblioteca para construir tu propio plan de entrenamiento.
        </p>
      </div>

      {loading ? (
          <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-8">
                  {/* Fase Inicial */}
                  <Card>
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2"><ListPlus/> Fase Inicial</CardTitle>
                          <CardDescription>Selecciona 1 ejercicio para el calentamiento.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <FormField
                            control={form.control}
                            name="initialExercise"
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un ejercicio de calentamiento" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      {warmUpExercises.map(ex => (
                                          <SelectItem key={ex.id} value={ex.id}>{ex.Nombre_del_ejercicio} ({ex.Duracion} min)</SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                      </CardContent>
                  </Card>

                  {/* Fase Principal */}
                  <Card>
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2"><ListChecks/> Fase Principal</CardTitle>
                          <CardDescription>Selecciona hasta 4 ejercicios. Puedes filtrar por categorías.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                          <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2"><Filter className="h-4 w-4"/>Filtrar por Categorías</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {mainCategories.map(category => (
                                      <div key={category} className="flex items-center space-x-2">
                                          <Checkbox 
                                              id={`cat-${category}`} 
                                              checked={selectedCategories.includes(category)}
                                              onCheckedChange={() => handleCategoryToggle(category)}
                                          />
                                          <label htmlFor={`cat-${category}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                              {category}
                                          </label>
                                      </div>
                                  ))}
                              </div>
                          </div>
                          <Separator />
                          <FormField
                            control={form.control}
                            name="mainExercises"
                            render={() => (
                                <FormItem>
                                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                    {filteredMainExercises.map(ex => (
                                        <FormField
                                            key={ex.id}
                                            control={form.control}
                                            name="mainExercises"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center space-x-3">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(ex.id)}
                                                            onCheckedChange={(checked) => {
                                                                const isCurrentlyChecked = field.value?.includes(ex.id);
                                                                const currentLength = field.value?.length || 0;
                                                                
                                                                if (checked && !isCurrentlyChecked && currentLength >= 4) {
                                                                    toast({ title: "Límite alcanzado", description: "Puedes seleccionar hasta 4 ejercicios para la fase principal.", variant: "destructive" });
                                                                    return;
                                                                }
                                                                
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), ex.id])
                                                                    : field.onChange(field.value?.filter(id => id !== ex.id));
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="text-sm font-medium leading-none w-full !mt-0">
                                                        {ex.Nombre_del_ejercicio} <span className="text-muted-foreground">({ex.Duracion} min)</span>
                                                    </FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                      </CardContent>
                  </Card>

                   {/* Fase Final */}
                  <Card>
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2"><ListEnd/> Fase Final</CardTitle>
                          <CardDescription>Selecciona 1 ejercicio para la vuelta a la calma.</CardDescription>
                      </CardHeader>
                      <CardContent>
                           <FormField
                            control={form.control}
                            name="finalExercise"
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Selecciona un ejercicio de vuelta a la calma" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {coolDownExercises.map(ex => (
                                            <SelectItem key={ex.id} value={ex.id}>{ex.Nombre_del_ejercicio} ({ex.Duracion} min)</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                               </FormItem>
                            )}
                           />
                      </CardContent>
                  </Card>
                
                  {/* Detalles Adicionales */}
                  <Card>
                    <CardHeader>
                        <CardTitle>Detalles Adicionales de la Sesión</CardTitle>
                        <CardDescription>Introduce los datos generales para identificar esta sesión.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="sessionNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número de Sesión</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: 14" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Fecha</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd/MM/yyyy")
                                      ) : (
                                        <span>Elige una fecha</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > new Date() || date < new Date("1900-01-01")
                                    }
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
                            name="season"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Temporada</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: 2024-2025" {...field} />
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
                                        <Input placeholder="Ej: AD Alcorcón FS" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="team"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Equipo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Cadete A" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                  </Card>

              </div>

              {/* Resumen Sesión */}
              <div className="lg:sticky top-24">
                  <Card>
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2"><ClipboardList/> Resumen de la Sesión</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                          <div>
                              <h4 className="font-semibold text-primary">Fase Inicial</h4>
                              <p className="text-sm text-muted-foreground">{selectedSessionExercises.initial?.Nombre_del_ejercicio || 'No seleccionado'}</p>
                          </div>
                          <Separator/>
                          <div>
                              <h4 className="font-semibold text-primary">Fase Principal ({selectedSessionExercises.main.length}/4)</h4>
                              {selectedSessionExercises.main.length > 0 ? (
                                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                                      {selectedSessionExercises.main.map(ex => ex ? <li key={ex.id}>{ex.Nombre_del_ejercicio}</li>: null)}
                                  </ul>
                              ) : (
                                  <p className="text-sm text-muted-foreground">No hay ejercicios seleccionados</p>
                              )}
                          </div>
                          <Separator/>
                          <div>
                              <h4 className="font-semibold text-primary">Fase Final</h4>
                              <p className="text-sm text-muted-foreground">{selectedSessionExercises.final?.Nombre_del_ejercicio || 'No seleccionado'}</p>
                          </div>
                          <Separator/>
                          <div className="text-lg font-bold">
                              Duración Total: {totalDuration} minutos
                          </div>

                          <Button type="submit" size="lg" className="w-full" disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                            {saving ? 'Guardando...' : 'Guardar Sesión'}
                          </Button>

                      </CardContent>
                  </Card>
              </div>
          </form>
        </Form>
      )}
    </div>
  );
}

    