
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function MisEstadisticasPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="text-center mb-12">
         <div className="flex justify-center mb-4">
            <BarChart3 className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Mis Estadísticas
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Un resumen visual del rendimiento de tu equipo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Estamos trabajando en esta sección. Pronto podrás ver gráficos y estadísticas clave de tu temporada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
