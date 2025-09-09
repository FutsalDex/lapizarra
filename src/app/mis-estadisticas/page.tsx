
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { 
    BarChart3, 
    Users, 
    Target, 
    Activity, 
    Calendar,
    Trophy,
    Shield,
    TrendingUp,
    TrendingDown,
    AlertOctagon,
    Goal,
    ShieldOff,
    Shuffle,
    RotateCcw,
    Award,
    RectangleVertical,
    RectangleHorizontal,
    Footprints,
    ArrowLeft,
    Hand,
    Plus,
    Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    subtitle?: string;
    color?: string;
}

const StatCard = ({ title, value, icon: Icon, subtitle, color = 'text-primary' }: StatCardProps) => (
    <Card>
        <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-primary/10`}>
                <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
                 {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
        </CardContent>
    </Card>
);

const PlayerStatCard = ({ title, name, value, icon: Icon, iconBgColor = 'bg-gray-100', iconColor = 'text-gray-600' }: { title: string, name: string, value: string | number, icon: React.ElementType, iconBgColor?: string, iconColor?: string }) => (
    <Card>
        <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
                 <div className={`p-1.5 rounded-full ${iconBgColor}`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                 </div>
                <p className="text-sm font-semibold text-muted-foreground">{title}</p>
            </div>
            <p className="text-xl font-bold">{name}</p>
            <p className="text-lg text-muted-foreground">{value}</p>
        </CardContent>
    </Card>
)

export default function MisEstadisticasPage() {
  return (
    <div className="container mx-auto max-w-7xl py-12 px-4 space-y-8">
        <div className="flex justify-between items-center">
            <div className="text-left">
                <div className="flex items-center gap-4">
                    <BarChart3 className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
                        Mis Estadísticas Generales
                        </h1>
                        <p className="text-lg text-muted-foreground mt-1">
                        Un resumen de tu actividad y el rendimiento de tu equipo.
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


        <Card>
            <CardHeader>
                <CardTitle>Resumen General de Partidos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <StatCard title="Partidos Jugados" value="3" icon={Trophy} />
                <StatCard title="Ganados" value="2" icon={TrendingUp} />
                <StatCard title="Empatados" value="1" icon={Shield} />
                <StatCard title="Perdidos" value="0" icon={TrendingDown} />
                <StatCard title="Faltas Cometidas" value="16" icon={AlertOctagon} />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Rendimiento del Equipo</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <StatCard title="Tiros a Puerta" value="12" icon={Goal} />
                <StatCard title="Tiros Fuera" value="9" icon={ShieldOff} />
                <StatCard title="Tiros Bloqueados" value="7" icon={Hand} />
                <StatCard title="Pérdidas de Balón" value="9" icon={RotateCcw} />
                <StatCard title="Robos de Balón" value="9" icon={Shuffle} />
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <Card>
                <CardHeader>
                    <CardTitle>Goles a Favor</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 grid-cols-3">
                    <StatCard title="Totales" value="13" icon={Plus} />
                    <StatCard title="1ª Parte" value="11" icon={Plus} />
                    <StatCard title="2ª Parte" value="2" icon={Plus} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Goles en Contra</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 grid-cols-3">
                    <StatCard title="Totales" value="7" icon={Minus} />
                    <StatCard title="1ª Parte" value="6" icon={Minus} />
                    <StatCard title="2ª Parte" value="1" icon={Minus} />
                </CardContent>
            </Card>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Jugadores Destacados</CardTitle>
                <CardDescription>Resumen de los líderes estadísticos de la temporada.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <PlayerStatCard title="Máximo Goleador" name="Iker Rando" value="4" icon={Award} iconBgColor="bg-green-100" iconColor="text-green-600" />
                <PlayerStatCard title="Máximo Asistente" name="Roger" value="5" icon={Hand} iconBgColor="bg-blue-100" iconColor="text-blue-600" />
                <PlayerStatCard title="Más Tarjetas Amarillas" name="Dani" value="1" icon={RectangleVertical} iconBgColor="bg-yellow-100" iconColor="text-yellow-600" />
                <PlayerStatCard title="Más Tarjetas Rojas" name="N/A" value="0" icon={RectangleHorizontal} iconBgColor="bg-red-100" iconColor="text-red-600" />
                <PlayerStatCard title="Más Faltas Cometidas" name="Marc Montoro" value="4" icon={Footprints} iconBgColor="bg-orange-100" iconColor="text-orange-600" />
            </CardContent>
        </Card>

    </div>
  );
}

    