
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LifeBuoy } from 'lucide-react';

export default function SoporteTecnicoPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="text-center mb-12">
         <div className="flex justify-center mb-4">
            <LifeBuoy className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Soporte Técnico
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Chatea con nuestro entrenador por IA.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Estamos trabajando en esta sección. Pronto podrás interactuar con nuestro asistente de IA para resolver tus dudas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
