
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { 
    BarChart3,
    Trophy,
    Users,
    ArrowRight,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const statModules = [
    {
        title: 'Estadísticas del Equipo',
        description: 'Resumen del rendimiento en partidos: victorias, derrotas, goles a favor, goles en contra y más métricas globales.',
        icon: Trophy,
        href: '/mis-estadisticas/equipo',
    },
    {
        title: 'Estadísticas de Jugadores',
        description: 'Consulta las estadísticas individuales de todos los jugadores de tus equipos: goles, asistencias, tarjetas y más.',
        icon: Users,
        href: '/mis-estadisticas/jugadores',
    }
]

export default function MisEstadisticasPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="text-left">
                <div className="flex items-center gap-4">
                    <BarChart3 className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
                        Mis Estadísticas
                        </h1>
                        <p className="text-lg text-muted-foreground mt-1">
                        Selecciona qué estadísticas quieres consultar.
                        </p>
                    </div>
                </div>
            </div>
             <Button asChild variant="outline">
              <Link href="/mi-equipo">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Panel
              </Link>
            </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {statModules.map(mod => (
                 <Card key={mod.title} className="flex flex-col hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-3 bg-primary/10 rounded-lg">
                                <mod.icon className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-xl font-bold">{mod.title}</CardTitle>
                        </div>
                        <CardDescription>{mod.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="mt-auto">
                        <Button asChild className="w-full">
                            <Link href={mod.href}>
                                Ver Estadísticas <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                 </Card>
            ))}
        </div>
    </div>
  );
}

