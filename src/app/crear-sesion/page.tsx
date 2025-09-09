
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, Filter, ClipboardList, ListPlus, ListChecks, ListEnd } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


interface Exercise {
  id: string;
  name: string;
  duration: string;
  sessionPhase: string;
  category: string;
  isVisible: boolean;
}

export default function CrearSesionPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  
  const [initialExercise, setInitialExercise] = useState<string | undefined>(undefined);
  const [mainExercises, setMainExercises] = useState<string[]>([]);
  const [finalExercise, setFinalExercise] = useState<string | undefined>(undefined);

  const [mainCategories, setMainCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  useEffect(() => {
    const q = query(collection(db, "exercises"), where("isVisible", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const exercisesData = snapshot.docs.map(doc => ({ 
          id: doc.id,
          name: doc.data().name || doc.data().title,
          ...doc.data() 
      } as Exercise));
      setAllExercises(exercisesData);
      
      const uniqueCategories = Array.from(new Set(exercisesData
        .filter(ex => ex.sessionPhase === 'Parte Principal')
        .map(ex => ex.category)
        .filter(Boolean)));
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
    allExercises.filter(ex => ex.sessionPhase === 'Calentamiento'), 
  [allExercises]);
  
  const coolDownExercises = useMemo(() => 
    allExercises.filter(ex => ex.sessionPhase === 'Vuelta a la Calma'),
  [allExercises]);

  const filteredMainExercises = useMemo(() => {
    return allExercises.filter(ex => 
      ex.sessionPhase === 'Parte Principal' &&
      (selectedCategories.length === 0 || selectedCategories.includes(ex.category))
    );
  }, [allExercises, selectedCategories]);

  const handleMainExerciseToggle = (exerciseId: string) => {
    setMainExercises(prev => {
      if (prev.includes(exerciseId)) {
        return prev.filter(id => id !== exerciseId);
      }
      if (prev.length < 4) {
        return [...prev, exerciseId];
      }
      toast({ title: "Límite alcanzado", description: "Puedes seleccionar hasta 4 ejercicios para la fase principal.", variant: "destructive" });
      return prev;
    });
  };

  const handleCategoryToggle = (category: string) => {
      setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  }
  
  const selectedSessionExercises = useMemo(() => {
    const initial = allExercises.find(ex => ex.id === initialExercise);
    const main = mainExercises.map(id => allExercises.find(ex => ex.id === id)).filter(Boolean);
    const final = allExercises.find(ex => ex.id === finalExercise);
    return { initial, main, final };
  }, [allExercises, initialExercise, mainExercises, finalExercise]);

  const totalDuration = useMemo(() => {
      const initialDuration = parseInt(selectedSessionExercises.initial?.duration || '0', 10);
      const mainDuration = selectedSessionExercises.main.reduce((acc, ex) => acc + parseInt(ex?.duration || '0', 10), 0);
      const finalDuration = parseInt(selectedSessionExercises.final?.duration || '0', 10);
      return initialDuration + mainDuration + finalDuration;
  }, [selectedSessionExercises]);


  const handleSaveSession = () => {
    if (!initialExercise || mainExercises.length === 0 || !finalExercise) {
        toast({ title: "Faltan ejercicios", description: "Debes seleccionar al menos un ejercicio para cada fase.", variant: "destructive"});
        return;
    }
    // Placeholder for save functionality
    console.log("Saving session:", {initialExercise, mainExercises, finalExercise});
    toast({ title: "¡Sesión Guardada!", description: "Tu plan de entrenamiento ha sido guardado."});
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                {/* Fase Inicial */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ListPlus/> Fase Inicial</CardTitle>
                        <CardDescription>Selecciona 1 ejercicio para el calentamiento.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select onValueChange={setInitialExercise} value={initialExercise}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un ejercicio de calentamiento" />
                            </SelectTrigger>
                            <SelectContent>
                                {warmUpExercises.map(ex => (
                                    <SelectItem key={ex.id} value={ex.id}>{ex.name} ({ex.duration} min)</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {filteredMainExercises.map(ex => (
                                <div key={ex.id} className="flex items-center space-x-3">
                                    <Checkbox 
                                        id={ex.id} 
                                        checked={mainExercises.includes(ex.id)}
                                        onCheckedChange={() => handleMainExerciseToggle(ex.id)}
                                        disabled={!mainExercises.includes(ex.id) && mainExercises.length >= 4}
                                    />
                                    <label htmlFor={ex.id} className="text-sm font-medium leading-none w-full">
                                        {ex.name} <span className="text-muted-foreground">({ex.duration} min)</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                 {/* Fase Final */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ListEnd/> Fase Final</CardTitle>
                        <CardDescription>Selecciona 1 ejercicio para la vuelta a la calma.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Select onValueChange={setFinalExercise} value={finalExercise}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un ejercicio de vuelta a la calma" />
                            </SelectTrigger>
                            <SelectContent>
                                {coolDownExercises.map(ex => (
                                    <SelectItem key={ex.id} value={ex.id}>{ex.name} ({ex.duration} min)</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                             <p className="text-sm text-muted-foreground">{selectedSessionExercises.initial?.name || 'No seleccionado'}</p>
                        </div>
                        <Separator/>
                        <div>
                             <h4 className="font-semibold text-primary">Fase Principal ({selectedSessionExercises.main.length}/4)</h4>
                             {selectedSessionExercises.main.length > 0 ? (
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                                    {selectedSessionExercises.main.map(ex => <li key={ex!.id}>{ex!.name}</li>)}
                                </ul>
                             ) : (
                                <p className="text-sm text-muted-foreground">No hay ejercicios seleccionados</p>
                             )}
                        </div>
                        <Separator/>
                        <div>
                            <h4 className="font-semibold text-primary">Fase Final</h4>
                            <p className="text-sm text-muted-foreground">{selectedSessionExercises.final?.name || 'No seleccionado'}</p>
                        </div>
                        <Separator/>
                         <div className="text-lg font-bold">
                            Duración Total: {totalDuration} minutos
                        </div>

                         <Button size="lg" className="w-full" onClick={handleSaveSession}>
                           <Save className="mr-2 h-4 w-4"/> Guardar Sesión
                         </Button>

                    </CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}


    