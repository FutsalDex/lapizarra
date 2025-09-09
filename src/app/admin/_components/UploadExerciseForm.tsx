
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
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
import * as XLSX from 'xlsx';

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
        const arrayBuffer = e.target?.result;
        if (!arrayBuffer) throw new Error("No se pudo leer el archivo.");
        
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const exercises: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!Array.isArray(exercises) || exercises.length === 0) {
            throw new Error("El archivo de Excel está vacío o tiene un formato incorrecto.");
        }

        const exercisesCollection = collection(db, 'exercises');
        let count = 0;
        for (const exercise of exercises) {
            // Basic validation
            if(exercise.title && exercise.category && exercise.description) {
                const tags = typeof exercise.tags === 'string' 
                    ? exercise.tags.split(',').map((t: string) => t.trim()) 
                    : (exercise.tags || []);
                await addDoc(exercisesCollection, { ...exercise, tags });
                count++;
            }
        }
        
        toast({
          title: '¡Éxito!',
          description: `${count} ejercicios han sido añadidos desde el archivo Excel.`,
        });

      } catch (error: any) {
        console.error('Error uploading batch: ', error);
        toast({
          title: 'Error en la carga por lotes',
          description: error.message || 'Por favor, comprueba el formato del archivo Excel.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
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
        <h3 className="text-lg font-medium">Subida por Lotes (Excel)</h3>
        <p className="text-sm text-muted-foreground">
            Sube un archivo Excel (.xlsx) con los ejercicios. Las cabeceras deben ser: title, category, tags, description, image, aiHint.
        </p>
         <div className="mt-4">
            <input
                type="file"
                accept=".xlsx, .xls"
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
                {loading ? 'Subiendo...' : 'Seleccionar Archivo Excel'}
            </Button>
         </div>
      </div>
    </div>
  );
}
