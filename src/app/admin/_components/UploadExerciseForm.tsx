
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Button } from '../../../components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../hooks/use-toast';
import { Loader2, Upload, FileQuestion } from 'lucide-react';
import { Separator } from '../../../components/ui/separator';
import * as XLSX from 'xlsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Checkbox } from '../../../components/ui/checkbox';
import { Switch } from '../../../components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { useAuth } from '../../../context/AuthContext';


const ageCategories = [
    { id: 'benjamin', label: 'Benjamín (8-9 años)' },
    { id: 'alevin', label: 'Alevín (10-11 años)' },
    { id: 'infantil', label: 'Infantil (12-13 años)' },
    { id: 'cadete', label: 'Cadete (14-15 años)' },
    { id: 'juvenil', label: 'Juvenil (16-18 años)' },
    { id: 'senior', label: 'Senior (+18 años)' },
] as const;


const exerciseSchema = z.object({
  Número: z.string().optional(),
  Ejercicio: z.string().min(5, 'El nombre debe tener al menos 5 caracteres.'),
  'Descripción de la tarea': z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  Objetivos: z.string().min(10, 'Los objetivos deben tener al menos 10 caracteres.'),
  Fase: z.string().min(1, 'Debes seleccionar una fase.'),
  Categoría: z.string().min(1, 'Debes seleccionar una categoría.'),
  Edad: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Tienes que seleccionar al menos una categoría de edad.",
  }),
  'Número de jugadores': z.string().min(1, 'Indica el número de jugadores.'),
  'Duración (min)': z.string().min(1, 'Debes seleccionar una duración.'),
  'Espacio y materiales necesarios': z.string().min(3, 'Indica los materiales necesarios.'),
  Variantes: z.string().optional(),
  'Consejos para el entrenador': z.string().optional(),
  Imagen: z.string().url('Debe ser una URL válida.').optional().or(z.literal('')),
  Visible: z.boolean().default(true),
});

type ExerciseFormValues = z.infer<typeof exerciseSchema>;

interface UploadExerciseFormProps {
  exerciseToEdit?: any;
  onFinished?: () => void;
  children?: React.ReactNode;
  showBatchUpload?: boolean;
}


export default function UploadExerciseForm({ exerciseToEdit, onFinished, children, showBatchUpload = false }: UploadExerciseFormProps) {
  const { toast } = useToast();
  const { user, db } = useAuth();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isEditMode = !!exerciseToEdit;

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: isEditMode ? exerciseToEdit : {
      Número: '',
      Ejercicio: '',
      'Descripción de la tarea': '',
      Objetivos: '',
      Fase: '',
      Categoría: '',
      Edad: [],
      'Número de jugadores': '',
      'Duración (min)': '',
      'Espacio y materiales necesarios': '',
      Variantes: '',
      'Consejos para el entrenador': '',
      Imagen: '',
      Visible: true,
    },
  });

  useEffect(() => {
    if (isEditMode && exerciseToEdit) {
      form.reset(exerciseToEdit);
    }
  }, [exerciseToEdit, form, isEditMode])


  const onSubmit = async (data: ExerciseFormValues) => {
    setLoading(true);
    try {
      if (isEditMode) {
        const docRef = doc(db, 'exercises', exerciseToEdit.id);
        await updateDoc(docRef, data);
        toast({
          title: '¡Éxito!',
          description: 'El ejercicio ha sido actualizado.',
        });
      } else {
        await addDoc(collection(db, 'exercises'), {
          ...data,
          Imagen: data.Imagen || `https://picsum.photos/400/250?random=${Date.now()}`,
          aiHint: 'futsal drill',
          userId: user?.uid, // Associate exercise with the user
          createdAt: new Date(),
        });
        toast({
          title: '¡Éxito!',
          description: 'El ejercicio ha sido añadido a la base de datos.',
        });
        form.reset();
      }
      if (onFinished) onFinished();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error adding/updating document: ', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al guardar el ejercicio.',
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
        const exercisesData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!Array.isArray(exercisesData) || exercisesData.length === 0) {
            throw new Error("El archivo de Excel está vacío o tiene un formato incorrecto.");
        }

        const exercisesCollection = collection(db, 'exercises');
        let count = 0;
        for (const exercise of exercisesData) {
            const exerciseName = exercise.Ejercicio;
            if (exerciseName) {
                const ageCategoriesArray = typeof exercise.Edad === 'string'
                  ? exercise.Edad.split(',').map((s:string) => s.trim().toLowerCase())
                  : [];

                const docData = {
                  Número: exercise.Número?.toString() || '',
                  Ejercicio: exerciseName,
                  'Descripción de la tarea': exercise['Descripción de la tarea'] || '',
                  Objetivos: exercise.Objetivos || '',
                  Fase: exercise['Fase'] || '',
                  Categoría: exercise.Categoría || '',
                  Edad: ageCategoriesArray,
                  'Número de jugadores': exercise['Número de jugadores']?.toString() || '',
                  'Duración (min)': exercise['Duración (min)']?.toString() || '',
                  'Espacio y materiales necesarios': exercise['Espacio y materiales necesarios'] || '',
                  Variantes: exercise.Variantes || '',
                  'Consejos para el entrenador': exercise['Consejos para el entrenador'] || '',
                  Imagen: exercise.Imagen || `https://picsum.photos/400/250?random=${Date.now() + count}`,
                  Visible: exercise.Visible !== undefined ? !!exercise.Visible : true,
                  userId: user?.uid, // Associate exercise with the user
                  createdAt: new Date(),
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
  
  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-h-[70vh] overflow-y-auto p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <FormField
                  control={form.control}
                  name="Ejercicio"
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
                  name="Número"
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
              name="Descripción de la tarea"
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
              name="Objetivos"
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
              name="Fase"
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
                        <SelectItem value="Fase Inicial">Fase Inicial</SelectItem>
                        <SelectItem value="Fase Principal">Fase Principal</SelectItem>
                        <SelectItem value="Fase Final">Fase Final</SelectItem>
                      </SelectContent>
                    </Select>
                  <FormMessage />
                  </FormItem>
              )}
              />
               <FormField
              control={form.control}
              name="Categoría"
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
                        <SelectItem value="Posesión y circulación del balón">Posesión y circulación del balón</SelectItem>
                        <SelectItem value="Conducción y regate">Conducción y regate</SelectItem>
                        <SelectItem value="Finalización">Finalización</SelectItem>
                        <SelectItem value="Técnica individual y combinada">Técnica individual y combinada</SelectItem>
                        <SelectItem value="Transiciones (ofensivas y defensivas)">Transiciones (ofensivas y defensivas)</SelectItem>
                        <SelectItem value="sistema táctico ofensivo">sistema táctico ofensivo</SelectItem>
                        <SelectItem value="Coordinación, agilidad y velocidad">Coordinación, agilidad y velocidad</SelectItem>
                        <SelectItem value="Balón parado y remates">Balón parado y remates</SelectItem>
                        <SelectItem value="Superioridades e inferioridades numéricas">Superioridades e inferioridades numéricas</SelectItem>
                        <SelectItem value="Pase y control">Pase y control</SelectItem>
                      </SelectContent>
                    </Select>
                  <FormMessage />
                  </FormItem>
              )}
              />
          </div>
          
          <FormField
              control={form.control}
              name="Edad"
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
                      name="Edad"
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
                  name="Número de jugadores"
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
              name="Duración (min)"
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
              name="Espacio y materiales necesarios"
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
              name="Variantes"
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
              name="Consejos para el entrenador"
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
          name="Imagen"
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
              name="Visible"
              render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                      <FormLabel className="text-base">Visibilidad del Ejercicio</FormLabel>
                      <FormDescription>
                        Para que tu ejercicio se contabilice en el programa de fidelización debe estar activado. La activación supone la visibilidad de tu ejercicio en la biblioteca de ejercicios de la aplicación, esto significa que tu ejercicio será visible por cualquier otro usuario.
Si no deseas compartir tu ejercicio ni que se sume a tu programa de fidelización , desbloquea el botón de visualización
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

          {!isEditMode && (
            <Button type="submit" size="lg" className="w-full font-bold" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Añadir Ejercicio
            </Button>
          )}
        </form>
    </Form>
  )

  if(isEditMode) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Ejercicio</DialogTitle>
            <DialogDescription>
              Modifica los detalles del ejercicio y guarda los cambios.
            </DialogDescription>
          </DialogHeader>
          {formContent}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }


  return (
    <div className="space-y-12">
      {formContent}
      
      {showBatchUpload && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-2">Subida por Lotes (Excel)</h3>
            <Alert className="mb-4">
                <FileQuestion className="h-4 w-4" />
                <AlertTitle>¿Cómo funciona?</AlertTitle>
                <AlertDescription>
                    Sube un archivo Excel (.xlsx) con los ejercicios. Asegúrate de que las cabeceras de las columnas coincidan con los nombres de los campos del formulario (ej: 'Ejercicio', 'Fase', 'Edad'). Para las categorías de edad, usa los identificadores ('benjamin', 'alevin') separados por comas.
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
        </>
      )}
    </div>
  );
}
