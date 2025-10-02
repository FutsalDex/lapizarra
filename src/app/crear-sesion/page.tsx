
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Pencil,
  Plus,
  CalendarIcon,
  Trash2,
  Save,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const ExerciseSlot = ({
  title,
  onClick,
  isMain = false,
}: {
  title: string;
  onClick: () => void;
  isMain?: boolean;
}) => (
  <Card
    className={cn(
      'relative flex flex-col items-center justify-center text-center p-4 border-2 border-dashed h-48 hover:border-primary hover:bg-accent/50 transition-colors',
      isMain && 'border-primary'
    )}
  >
    <CardHeader className="p-0">
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-0 mt-2">
      <Button size="icon" variant="outline" onClick={onClick}>
        <Plus className="h-6 w-6" />
      </Button>
    </CardContent>
  </Card>
);

export default function CrearSesionPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [mainExercises, setMainExercises] = useState(2);

  const addMainExercise = () => {
    setMainExercises((prev) => prev + 1);
  };

  const handleSelectExercise = (phase: string) => {
    // Placeholder function for when exercise selection is implemented
    console.log(`Selecting exercise for: ${phase}`);
  };

  return (
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

      <div className="space-y-12">
        {/* Section 1: Session Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Sesión</CardTitle>
            <CardDescription>
              Completa los datos básicos de tu entrenamiento.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="training-date">Día de entrenamiento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="training-date"
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, 'PPP', { locale: es })
                    ) : (
                      <span>Elige una fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="microcycle">Microciclo</Label>
              <Input id="microcycle" type="number" placeholder="Ej: 1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-number">Número de sesión</Label>
              <Input id="session-number" type="number" placeholder="Ej: 1" />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Planning */}
        <Card>
          <CardHeader>
            <CardTitle>Planificación</CardTitle>
            <CardDescription>
              ¿Qué necesitas trabajar en esta sesión?
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="players">Jugadores de campo</Label>
              <Input id="players" type="number" placeholder="Ej: 16" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="space">Espacio disponible</Label>
              <Select>
                <SelectTrigger id="space">
                  <SelectValue placeholder="Selecciona el espacio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-court">Campo completo</SelectItem>
                  <SelectItem value="half-court">Medio campo</SelectItem>
                  <SelectItem value="small-area">Espacio reducido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="objectives">Objetivos</Label>
              <Select>
                <SelectTrigger id="objectives">
                  <SelectValue placeholder="Selecciona objetivos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attack">Ataque</SelectItem>
                  <SelectItem value="defense">Defensa</SelectItem>
                  <SelectItem value="transition">Transiciones</SelectItem>
                  <SelectItem value="strategy">Estrategia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Exercises */}
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary mb-2">
            Estructura de la Sesión
          </h2>
          <p className="text-muted-foreground mb-6">
            Selecciona los ejercicios para cada fase del entrenamiento.
          </p>

          <div className="space-y-8">
            {/* Warm-up */}
            <div>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">
                Calentamiento
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <ExerciseSlot
                  title="Tarea Inicial"
                  onClick={() => handleSelectExercise('initial')}
                />
              </div>
            </div>

            {/* Main Part */}
            <div>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">
                Parte Principal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {Array.from({ length: mainExercises }).map((_, index) => (
                  <ExerciseSlot
                    key={index}
                    title={`Tarea ${index + 1}`}
                    onClick={() => handleSelectExercise(`main-${index}`)}
                  />
                ))}
                <Card className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed h-48 bg-transparent">
                  <CardHeader className="p-0">
                    <CardTitle className="text-lg font-semibold text-muted-foreground">
                      Añadir Tarea
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 mt-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={addMainExercise}
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Cool-down */}
            <div>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">
                Vuelta a la Calma
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <ExerciseSlot
                  title="Tarea Final"
                  onClick={() => handleSelectExercise('final')}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Section 4: Actions */}
        <div className="flex flex-col md:flex-row justify-end items-center gap-4">
           <Button variant="outline" size="lg">
            <ClipboardList className="mr-2 h-5 w-5" />
            Ver Ficha de Sesión
          </Button>
          <Button variant="secondary" size="lg">
            <Sparkles className="mr-2 h-5 w-5" />
            Generar con IA
          </Button>
          <Button size="lg">
            <Save className="mr-2 h-5 w-5" />
            Guardar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
