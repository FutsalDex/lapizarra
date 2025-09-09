
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Shield } from 'lucide-react';
import UploadExerciseForm from './_components/UploadExerciseForm';

export default function AdminPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline tracking-tighter text-primary">
          Panel de Administración
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Gestión central de LaPizarra.
        </p>
      </div>

      <Tabs defaultValue="upload-exercises">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="upload-exercises">
            <Upload className="mr-2 h-4 w-4" />
            Subir Ejercicios
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload-exercises">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Ejercicios</CardTitle>
              <CardDescription>
                Añade nuevos ejercicios a la biblioteca de la aplicación, ya sea
                de forma individual o por lotes subiendo un archivo JSON.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadExerciseForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
