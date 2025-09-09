
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import UploadExerciseForm from '../_components/UploadExerciseForm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function GestionEjerciciosPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
       <div className="mb-8">
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Link>
        </Button>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline tracking-tighter text-primary">
          Gestión de Ejercicios
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Añade nuevos ejercicios a la biblioteca de la aplicación.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subir Ejercicios</CardTitle>
          <CardDescription>
            Añade nuevos ejercicios a la biblioteca, ya sea
            de forma individual o por lotes subiendo un archivo Excel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadExerciseForm />
        </CardContent>
      </Card>
    </div>
  );
}
