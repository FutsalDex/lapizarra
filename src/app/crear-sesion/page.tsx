
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  generateTrainingSession,
  type GenerateTrainingSessionInput,
  type GenerateTrainingSessionOutput,
} from '@/ai/flows/generate-training-session';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Loader2, Zap } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const formSchema = z.object({
  teamDescription: z
    .string()
    .min(10, 'Describe tu equipo con al menos 10 caracteres.'),
  trainingGoals: z
    .string()
    .min(10, 'Define tus objetivos con al menos 10 caracteres.'),
  sessionFocus: z
    .string()
    .min(5, 'El enfoque debe tener al menos 5 caracteres.'),
  preferredSessionLengthMinutes: z.number().min(30).max(120),
});

export default function CrearSesionPage() {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<GenerateTrainingSessionOutput | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamDescription: '',
      trainingGoals: '',
      sessionFocus: '',
      preferredSessionLengthMinutes: 60,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setSession(null);
    setError(null);
    try {
      const result = await generateTrainingSession(
        values as GenerateTrainingSessionInput
      );
      setSession(result);
    } catch (e) {
      setError('Hubo un error al generar la sesión. Inténtalo de nuevo.');
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline tracking-tighter text-primary">
          Generador de Sesiones con IA
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Diseña entrenamientos a medida para tu equipo en segundos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Configura tu Entrenamiento</CardTitle>
            <CardDescription>
              Proporciona los detalles y deja que LaPizarra AI cree la sesión
              perfecta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="teamDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción del Equipo</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ej: Equipo Sub-16, nivel intermedio, buena técnica pero problemas en defensa."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trainingGoals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objetivos del Entrenamiento</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ej: Mejorar la salida de balón bajo presión y las transiciones ofensivas."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sessionFocus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foco Principal</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Transiciones ataque-defensa"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredSessionLengthMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Duración de la sesión: {field.value} minutos
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={30}
                          max={120}
                          step={5}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full font-bold" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Generar Sesión
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold font-headline text-center">
            Plan de Sesión Generado
          </h2>
          {loading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <Card className="bg-destructive/10 border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
              </CardContent>
            </Card>
          )}
          {session && (
            <Card className="bg-background">
              <CardHeader>
                <CardTitle>¡Sesión Lista!</CardTitle>
                <CardDescription>
                  Aquí tienes el plan de entrenamiento generado por la IA.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible defaultValue="item-1">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="font-bold">Calentamiento</AccordionTrigger>
                    <AccordionContent className="prose prose-sm max-w-none text-muted-foreground">
                      {session.warmUp}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="font-bold">Ejercicios Principales</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc pl-5 space-y-4 text-muted-foreground">
                        {session.mainExercises.map((exercise, index) => (
                          <li key={index}>{exercise}</li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="font-bold">Vuelta a la Calma</AccordionTrigger>
                    <AccordionContent className="prose prose-sm max-w-none text-muted-foreground">
                      {session.coolDown}
                    </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="item-4">
                    <AccordionTrigger className="font-bold">Notas del Entrenador</AccordionTrigger>
                    <AccordionContent className="prose prose-sm max-w-none text-muted-foreground">
                     {session.coachNotes}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )}
          {!session && !loading && !error && (
             <Card className="flex flex-col items-center justify-center text-center py-16 px-6 bg-secondary/50 border-dashed">
                <CardContent className="space-y-4">
                   <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">Tu sesión de entrenamiento aparecerá aquí una vez generada.</p>
                </CardContent>
              </Card>
          )}
        </div>
      </div>
    </div>
  );
}
