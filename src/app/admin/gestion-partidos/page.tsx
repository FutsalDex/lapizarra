
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import UploadMatchForm from '../_components/UploadMatchForm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';

export default function GestionPartidosPage() {
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
        <div className="flex items-center gap-4">
            <Trophy className="h-10 w-10 text-primary"/>
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">
                Añadir Partidos por Lote
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                Sube un archivo Excel para añadir múltiples partidos a la base de datos de una sola vez.
                </p>
            </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subida de Partidos desde Excel</CardTitle>
          <CardDescription>
           Asegúrate de que el archivo Excel tiene el formato correcto antes de subirlo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadMatchForm />
        </CardContent>
      </Card>
    </div>
  );
}
