
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Star, CheckCircle, Send } from 'lucide-react';
import LoyaltyStatus from './_components/LoyaltyStatus';
import { Button } from '@/components/ui/button';

const basicFeatures = [
    'Acceso completo a la biblioteca de ejercicios',
    'Creación de sesiones de entrenamiento ilimitadas',
    'Gestión de 1 equipo',
];

const proFeatures = [
    'Todas las ventajas del Plan Básico',
    'Gestión de equipos ilimitada',
    'Compartir equipos con tu cuerpo técnico',
    'Estadísticas avanzadas y comparativas',
];


export default function SuscripcionPage() {
  return (
    <div className="container mx-auto max-w-5xl py-12 px-4 space-y-12">
      <div className="text-center">
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
      
      <div>
         <h2 className="text-3xl font-bold font-headline text-center text-primary mb-8">Planes de Suscripción</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <Card className="border-2">
                <CardHeader>
                    <CardTitle className="text-2xl">Plan Básico</CardTitle>
                    <CardDescription>Ideal para entrenadores individuales que quieren llevar su planificación al siguiente nivel.</CardDescription>
                    <p className="text-4xl font-bold text-primary pt-4">9,95€<span className="text-lg font-normal text-muted-foreground">/año</span></p>
                </CardHeader>
                <CardContent className="space-y-3">
                    {basicFeatures.map(feature => (
                        <div key={feature} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-1 shrink-0"/>
                            <p className="text-muted-foreground">{feature}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card className="border-2 border-primary shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">Plan Pro</CardTitle>
                    <CardDescription>Perfecto para cuerpos técnicos y entrenadores que gestionan múltiples equipos y quieren el máximo rendimiento.</CardDescription>
                    <p className="text-4xl font-bold text-primary pt-4">19,95€<span className="text-lg font-normal text-muted-foreground">/año</span></p>
                </CardHeader>
                <CardContent className="space-y-3">
                    {proFeatures.map(feature => (
                        <div key={feature} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-1 shrink-0"/>
                            <p className="text-muted-foreground">{feature}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
         </div>
      </div>
      
      <Card className="bg-secondary/70">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Send className="h-6 w-6"/>Instrucciones de Pago</CardTitle>
            <CardDescription>Para activar o renovar tu suscripción, sigue estos sencillos pasos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <p className="font-semibold text-lg">1. Envía tu pago por Bizum al:</p>
                <p className="text-2xl font-bold text-primary tracking-widest bg-background p-2 rounded-md inline-block mt-2">607 820 029</p>
            </div>
            <div>
                 <p className="font-semibold text-lg">2. Usa el siguiente concepto en el pago:</p>
                 <p className="text-lg font-mono text-primary bg-background p-2 rounded-md inline-block mt-2">LaPizarra (tu correo electrónico)</p>
                 <p className="text-xs text-muted-foreground mt-1">Ejemplo: LaPizarra (entrenador@email.com)</p>
            </div>
            <p className="text-sm text-muted-foreground pt-2">Tu cuenta se activará o renovará en un plazo máximo de 24 horas. Recibirás un correo de confirmación. ¡Gracias por tu confianza!</p>
        </CardContent>
      </Card>

    </div>
  );
}
