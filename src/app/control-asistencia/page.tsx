
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ClipboardCheck } from 'lucide-react';

export default function ControlAsistenciaPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="text-center mb-12">
         <div className="flex justify-center mb-4">
            <ClipboardCheck className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Control de Asistencia
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Registra y consulta la asistencia de tus jugadores.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Estamos trabajando en esta sección. Pronto podrás llevar un registro detallado de la asistencia a entrenamientos y partidos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
