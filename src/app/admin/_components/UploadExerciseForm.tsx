
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
import { Loader2, Upload, FileQuestion, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import * as XLSX from 'xlsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const ageCategories = [
    { id: 'benjamin', label: 'Benjamín (8-9 años)' },
    { id: 'alevin', label: 'Alevín (10-11 años)' },
    { id: 'infantil', label: 'Infantil (12-13 años)' },
    { id: 'cadete', label: 'Cadete (14-15 años)' },
    { id: 'juvenil', label: 'Juvenil (16-18 años)' },
    { id: 'senior', label: 'Senior (+18 años)' },
] as const;


const exerciseSchema = z.object({
  name: z.string().min(5, 'El nombre debe tener al menos 5 caracteres.'),
  number: z.string().optional(),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  objectives: z.string().min(10, 'Los objetivos deben tener al menos 10 caracteres.'),
  sessionPhase: z.string().min(1, 'Debes seleccionar una fase.'),
  category: z.string().min(1, 'Debes seleccionar una categoría.'),
  ageCategories: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Tienes que seleccionar al menos una categoría de edad.",
  }),
  players: z.string().min(1, 'Indica el número de jugadores.'),
  duration: z.string().min(1, 'Debes seleccionar una duración.'),
  materials: z.string().min(3, 'Indica los materiales necesarios.'),
  variants: z.string().optional(),
  coachTips: z.string().optional(),
  imageUrl: z.string().url('Debe ser una URL válida.').optional().or(z.literal('')),
  isVisible: z.boolean().default(true),
});

type ExerciseFormValues = z.infer<typeof exerciseSchema>;

export default function UploadExerciseForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: '',
      number: '',
      description: '',
      objectives: '',
      sessionPhase: '',
      category: '',
      ageCategories: [],
      players: '',
      duration: '',
      materials: '',
      variants: '',
      coachTips: '',
      imageUrl: '',
      isVisible: true,
    },
  });

  const onSubmit = async (data: ExerciseFormValues) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'exercises'), { 
          title: data.name, // Mapping to legacy 'title'
          tags: [], // Tags seem to be deprecated in new form, let's keep it empty
          image: data.imageUrl || `https://picsum.photos/400/250?random=${Date.now()}`,
          aiHint: 'futsal drill', // Default AI hint
          ...data 
      });
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
            const exerciseName = exercise.name || exercise.Ejercicio;
            if(exerciseName) {
                // Map excel columns to our new schema
                const docData = {
                  ...exercise,
                  name: exerciseName,
                  title: exerciseName, // mapping
                  ageCategories: typeof exercise.ageCategories === 'string' ? exercise.ageCategories.split(',').map(s => s.trim()) : [],
                  image: exercise.imageUrl || `https://picsum.photos/400/250?random=${Date.now()}`,
                  tags: [],
                  aiHint: 'futsal drill',
                  isVisible: true,
                };
                await addDoc(exercisesCollection, docData);
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
    <div className="space-y-12">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nombre del Ejercicio</FormLabel>
                        <FormControl>
                        <Input placeholder="Nombre descriptivo del ejercicio" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Número (Opcional)</FormLabel>
                        <FormControl>
                        <Input placeholder="Ej: 001, A-63" {...field} />
                        </FormControl>
                        <FormDescription>Identificador numérico o alfanumérico.</FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Descripción de la Tarea</FormLabel>
                    <FormControl>
                    <Textarea
                        placeholder="Explica detalladamente en qué consiste el ejercicio..."
                        {...field}
                    />
                    </FormControl>
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
                    <FormControl>
                    <Textarea
                        placeholder="¿Qué se busca mejorar con este ejercicio? Ej: Control del balón, pase corto, definición..."
                        {...field}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                control={form.control}
                name="sessionPhase"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Fase de la Sesión</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una fase" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Calentamiento">Calentamiento</SelectItem>
                          <SelectItem value="Parte Principal">Parte Principal</SelectItem>
                          <SelectItem value="Vuelta a la Calma">Vuelta a la Calma</SelectItem>
                        </SelectContent>
                      </Select>
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
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Técnica">Técnica</SelectItem>
                          <SelectItem value="Táctica">Táctica</SelectItem>
                          <SelectItem value="Físico">Físico</SelectItem>
                           <SelectItem value="Psicológico">Psicológico</SelectItem>
                           <SelectItem value="Estrategia">Estrategia</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <FormField
                control={form.control}
                name="ageCategories"
                render={() => (
                    <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Categorías de Edad</FormLabel>
                      <FormDescription>
                        Selecciona una o más categorías.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {ageCategories.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="ageCategories"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {item.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
                />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <FormField
                    control={form.control}
                    name="players"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Número de jugadores</FormLabel>
                        <FormControl>
                        <Input placeholder="Ej: 8-12 jugadores" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Duración (minutos)</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una duración" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="5">5 minutos</SelectItem>
                           <SelectItem value="10">10 minutos</SelectItem>
                           <SelectItem value="15">15 minutos</SelectItem>
                           <SelectItem value="20">20 minutos</SelectItem>
                           <SelectItem value="25">25 minutos</SelectItem>
                           <SelectItem value="30">30 minutos</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
             <FormField
                control={form.control}
                name="materials"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Espacio y Materiales Necesarios</FormLabel>
                    <FormControl>
                    <Textarea
                        placeholder="Ej: Media pista, 10 conos, 5 balones..."
                        {...field}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            
            <FormField
                control={form.control}
                name="variants"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Variantes (Opcional)</FormLabel>
                    <FormControl>
                    <Textarea
                        placeholder="Posibles modificaciones o progresiones del ejercicio..."
                        {...field}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="coachTips"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Consejos para el Entrenador (Opcional)</FormLabel>
                    <FormControl>
                    <Textarea
                        placeholder="Puntos clave a observar, correcciones comunes, cómo motivar..."
                        {...field}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL de la Imagen (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://ejemplo.com/imagen.png"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Si se deja vacío, se usará una imagen genérica.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

            <FormField
                control={form.control}
                name="isVisible"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">Visibilidad del Ejercicio</FormLabel>
                        <FormDescription>
                        Si está activado, el ejercicio será visible para todos los usuarios. Si está desactivado, se ocultará.
                        </FormDescription>
                    </div>
                    <FormControl>
                        <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    </FormItem>
                )}
             />


          <Button type="submit" size="lg" className="w-full font-bold" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Añadir Ejercicio
          </Button>
        </form>
      </Form>
      
      <Separator />

       <div>
        <h3 className="text-lg font-medium mb-2">Subida por Lotes (Excel)</h3>
         <Alert className="mb-4">
            <FileQuestion className="h-4 w-4" />
            <AlertTitle>¿Cómo funciona?</AlertTitle>
            <AlertDescription>
                Sube un archivo Excel (.xlsx) con los ejercicios. Asegúrate de que las cabeceras de las columnas coincidan con los nombres de los campos del formulario (ej: 'name', 'sessionPhase', 'ageCategories'). Para las categorías de edad, usa los identificadores ('benjamin', 'alevin') separados por comas.
            </AlertDescription>
        </Alert>

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

    