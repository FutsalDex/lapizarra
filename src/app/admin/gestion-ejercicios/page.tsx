
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import UploadExerciseForm from '../_components/UploadExerciseForm';
import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function GestionEjerciciosPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
       <div className="mb-8 flex justify-end">
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Link>
        </Button>
      </div>

      <div className="text-left mb-12">
        <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">
          Añadir Nuevo Ejercicio
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Completa el formulario para añadir un nuevo ejercicio a la biblioteca.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulario de Nuevo Ejercicio</CardTitle>
          <CardDescription>
           Rellena todos los campos para crear un nuevo ejercicio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadExerciseForm />
        </CardContent>
      </Card>
    </div>
  );
}
