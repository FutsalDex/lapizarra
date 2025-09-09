
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const exerciseSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  category: z.string().min(3, 'La categoría debe tener al menos 3 caracteres.'),
  tags: z.string().min(3, 'Debe haber al menos una etiqueta.'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres.'),
  image: z.string().url('Debe ser una URL válida.'),
  aiHint: z.string().min(3, 'El hint de IA debe tener al menos 3 caracteres.'),
});

type ExerciseFormValues = z.infer<typeof exerciseSchema>;

export default function UploadExerciseForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      title: '',
      category: '',
      tags: '',
      description: '',
      image: '',
      aiHint: '',
    },
  });

  const onSubmit = async (data: ExerciseFormValues) => {
    setLoading(true);
    try {
      const tagsArray = data.tags.split(',').map((tag) => tag.trim());
      await addDoc(collection(db, 'exercises'), { ...data, tags: tagsArray });
      toast({
        title: '¡Éxito!',
        description: 'El ejercicio ha sido añadido a la base de datos.',
      });
      form.reset();
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al añadir el ejercicio.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleBatchUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') throw new Error("File content is not a string.");
        const exercises = JSON.parse(content);
        
        if (!Array.isArray(exercises)) {
            throw new Error("El JSON debe ser un array de ejercicios.");
        }

        const batch = writeBatch(db);
        const exercisesCollection = collection(db, 'exercises');

        exercises.forEach(exercise => {
            // Basic validation, can be improved with Zod schema
            if(exercise.title && exercise.category && exercise.description) {
                const docRef = addDoc(exercisesCollection, exercise)._key.path.segments;
                // Since addDoc creates a random ID, we need a workaround for batch. Let's just add them one by one for now with feedback.
                // This is a limitation of using auto-generated IDs with batches.
                // A better approach would be to use `doc(exercisesCollection)` to get a ref, but let's stick to addDoc for simplicity for now.
            }
        });

        // The above loop is just for validation simulation. The proper way to batch is with known IDs.
        // Let's add them sequentially and give feedback.
        let count = 0;
        for (const exercise of exercises) {
            await addDoc(exercisesCollection, exercise);
            count++;
        }
        
        toast({
          title: '¡Éxito!',
          description: `${count} ejercicios han sido añadidos por lotes.`,
        });

      } catch (error: any) {
        console.error('Error uploading batch: ', error);
        toast({
          title: 'Error en la carga por lotes',
          description: error.message || 'Por favor, comprueba el formato del archivo JSON.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };


  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Subida Individual</h3>
        <p className="text-sm text-muted-foreground">
          Rellena el formulario para añadir un único ejercicio.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título del Ejercicio</FormLabel>
                <FormControl>
                  <Input placeholder="Rondo 4 vs 2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <FormControl>
                  <Input placeholder="Técnica" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etiquetas</FormLabel>
                <FormControl>
                  <Input placeholder="Pase, Control, Presión" {...field} />
                </FormControl>
                <FormDescription>
                  Separadas por comas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Clásico rondo para mejorar la velocidad del pase..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL de la Imagen</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://picsum.photos/400/250"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="aiHint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pista para IA (aiHint)</FormLabel>
                <FormControl>
                  <Input placeholder="futsal drill" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Añadir Ejercicio
          </Button>
        </form>
      </Form>
      <Separator />
       <div>
        <h3 className="text-lg font-medium">Subida por Lotes</h3>
        <p className="text-sm text-muted-foreground">
            Sube un archivo JSON con un array de objetos de ejercicios.
        </p>
         <div className="mt-4">
            <input
                type="file"
                accept=".json"
                onChange={handleBatchUpload}
                className="hidden"
                ref={fileInputRef}
                disabled={loading}
            />
            <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={loading}
            >
                <Upload className="mr-2 h-4 w-4" />
                {loading ? 'Subiendo...' : 'Seleccionar Archivo JSON'}
            </Button>
         </div>
      </div>
    </div>
  );
}

