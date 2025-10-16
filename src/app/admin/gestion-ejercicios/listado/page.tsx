
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import ExerciseList from '../_components/ExerciseList';
import { Button } from '../../../../components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ClipboardList } from 'lucide-react';

export default function ListadoEjerciciosPage() {
  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <div className="mb-8 flex justify-end">
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Link>
        </Button>
      </div>

      <div className="text-center mb-12">
         <div className="flex justify-center mb-4">
            <ClipboardList className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Gestionar Biblioteca de Ejercicios
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Activa o desactiva la visibilidad de los ejercicios para los usuarios.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Todos los Ejercicios</CardTitle>
          <CardDescription>
            Usa el interruptor para cambiar la visibilidad de un ejercicio en la biblioteca pública.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExerciseList />
        </CardContent>
      </Card>
    </div>
  );
}
