
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Star } from 'lucide-react';
import LoyaltyStatus from './_components/LoyaltyStatus';

export default function SuscripcionPage() {
  return (
    <div className="container mx-auto max-w-5xl py-12 px-4">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Star className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Mi Suscripción y Puntos
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Gestiona tu plan, consulta tus puntos de fidelización y aporta a la
          comunidad.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Programa de Fidelización</CardTitle>
          <CardDescription>
            Gana puntos subiendo ejercicios y obtén descuentos en tu
            renovación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoyaltyStatus />
        </CardContent>
      </Card>
    </div>
  );
}
