
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  ClipboardCheck,
  Trophy,
  PenSquare,
  ClipboardList,
  CalendarDays,
  LifeBuoy,
  ArrowRight,
  ShieldPlus,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const modules = [
   {
    title: 'Gestión de Equipos',
    description: 'Crea nuevos equipos, gestiona sus miembros y accede a sus paneles de control.',
    icon: ShieldPlus,
    href: '/gestion-equipos',
  },
  {
    title: 'Mis Sesiones',
    description: 'Encuentra y organiza todas las sesiones de entrenamiento que has creado manualmente.',
    icon: ClipboardList,
    href: '/mis-sesiones',
  },
   {
    title: 'Mis Ejercicios',
    description: 'Aporta ejercicios a la comunidad, gestiónalos y gana puntos para tu suscripción.',
    icon: Upload,
    href: '/mis-ejercicios',
  },
    {
    title: 'Mis Eventos',
    description: 'Visualiza la cronología de todos tus partidos y sesiones de entrenamiento guardados.',
    icon: CalendarDays,
    href: '/mis-eventos',
  },
   {
    title: 'Marcador Rápido',
    description: 'Usa un marcador con crono para un partido rápido o una sesión de entrenamiento.',
    icon: PenSquare,
    href: '/marcador',
  },
   {
    title: 'Soporte Técnico',
    description: 'Chatea con nuestro entrenador por IA configurado para darte respuestas sobre dudas, órdenes, etc.',
    icon: LifeBuoy,
    href: '/soporte-tecnico',
  },
];

export default function MiEquipoPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto max-w-7xl py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline tracking-tighter text-primary">
          Panel de Mi Equipo
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
            {user ? `Bienvenido, ${user.displayName || user.email}. ` : ''}
            Aquí tienes el centro de mando para tu equipo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((item) => (
          <Card key={item.title} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader className="flex-row items-center gap-4 space-y-0">
                <div className="p-3 bg-primary/10 rounded-lg">
                     <item.icon className="h-6 w-6 text-primary" />
                </div>
              <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={item.href}>
                  Ir a {item.title} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
