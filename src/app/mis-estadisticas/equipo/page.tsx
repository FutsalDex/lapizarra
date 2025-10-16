
'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
    Trophy,
    Shield,
    TrendingUp,
    TrendingDown,
    AlertOctagon,
    Goal,
    ShieldOff,
    Shuffle,
    RotateCcw,
    Hand,
    Plus,
    Minus,
    ArrowLeft,
    Crosshair,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    subtitle?: string;
    color?: string;
}

const StatCard = ({ title, value, icon: Icon, subtitle, color = 'text-primary' }: StatCardProps) => (
    <Card>
        <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-primary/10`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                </div>
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </CardContent>
    </Card>
);

interface Stats {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    fouls: number;
    faltasRecibidas: number;
    goalsFor: number;
    goalsFor1stHalf: number;
    goalsFor2ndHalf: number;
    goalsAgainst: number;
    goalsAgainst1stHalf: number;
    goalsAgainst2ndHalf: number;
    totalShots: number;
    shotsOnTarget: number;
    shotsOffTarget: number;
    turnovers: number;
    recoveries: number;
    yellowCards: number;
}

export default function TeamStatsPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            setLoading(true);
            const teamsQuery = query(collection(db, 'teams'), where('ownerId', '==', user.uid));
            const teamsSnapshot = await getDocs(teamsQuery);
            const teamIds = teamsSnapshot.docs.map(doc => doc.id);
            const teamNames = teamsSnapshot.docs.map(doc => doc.data().name);

            if (teamIds.length === 0) {
                setLoading(false);
                return;
            }

            const matchesQuery = query(collection(db, 'matches'), where('teamId', 'in', teamIds), where('isFinished', '==', true));
            const matchesSnapshot = await getDocs(matchesQuery);
            const matches = matchesSnapshot.docs.map(doc => doc.data());


            const newStats: Stats = {
                played: matches.length, won: 0, drawn: 0, lost: 0, fouls: 0, faltasRecibidas: 0,
                goalsFor: 0, goalsFor1stHalf: 0, goalsFor2ndHalf: 0,
                goalsAgainst: 0, goalsAgainst1stHalf: 0, goalsAgainst2ndHalf: 0,
                totalShots: 0, shotsOnTarget: 0, shotsOffTarget: 0,
                turnovers: 0, recoveries: 0, yellowCards: 0
            };

            matches.forEach(match => {
                const isLocalTeam = teamNames.includes(match.localTeam);
                const userScore = isLocalTeam ? match.localScore : match.visitorScore;
                const opponentScore = isLocalTeam ? match.visitorScore : match.localScore;

                if (userScore > opponentScore) newStats.won++;
                else if (userScore < opponentScore) newStats.lost++;
                else newStats.drawn++;
                
                newStats.goalsFor += userScore;
                newStats.goalsAgainst += opponentScore;

                const userPlayers = isLocalTeam ? match.localPlayers : match.visitorPlayers;
                if (userPlayers) {
                    newStats.fouls += userPlayers.reduce((acc: number, p: any) => acc + (p.faltas || 0), 0);
                    newStats.yellowCards += userPlayers.reduce((acc: number, p: any) => acc + (p.amarillas || 0), 0);
                    newStats.shotsOnTarget += userPlayers.reduce((acc: number, p: any) => acc + (p.tirosPuerta || 0), 0);
                    newStats.shotsOffTarget += userPlayers.reduce((acc: number, p: any) => acc + (p.tirosFuera || 0), 0);
                    newStats.recoveries += userPlayers.reduce((acc: number, p: any) => acc + (p.recuperaciones || 0), 0);
                    newStats.turnovers += userPlayers.reduce((acc: number, p: any) => acc + (p.perdidas || 0), 0);
                }
                 if(match.opponentStats1) {
                    newStats.faltasRecibidas += match.opponentStats1.fouls || 0;
                }
                if(match.opponentStats2) {
                    newStats.faltasRecibidas += match.opponentStats2.fouls || 0;
                }
                
                const goals = match.events?.filter((e: any) => e.type === 'goal') || [];
                goals.forEach((goal: any) => {
                    const goalIsForUserTeam = (isLocalTeam && goal.team === 'local') || (!isLocalTeam && goal.team === 'visitor');
                    if (goalIsForUserTeam) {
                        if(goal.period === '1ª Parte') newStats.goalsFor1stHalf++;
                        if(goal.period === '2ª Parte') newStats.goalsFor2ndHalf++;
                    } else {
                         if(goal.period === '1ª Parte') newStats.goalsAgainst1stHalf++;
                         if(goal.period === '2ª Parte') newStats.goalsAgainst2ndHalf++;
                    }
                })
            });

            newStats.totalShots = newStats.shotsOnTarget + newStats.shotsOffTarget;

            setStats(newStats);
            setLoading(false);
        };

        fetchStats();
    }, [user]);

  if(loading) {
    return (
        <div className="container mx-auto max-w-7xl py-12 px-4 space-y-8">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    )
  }
  
  const YellowCardIcon = () => (
    <div className="w-4 h-5 bg-yellow-400 border border-yellow-600 rounded-sm" />
  );

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4 space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="text-left">
                <div className="flex items-center gap-4">
                    <Trophy className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
                        Estadísticas del Equipo
                        </h1>
                        <p className="text-lg text-muted-foreground mt-1">
                        Un resumen de tu actividad y el rendimiento de tu equipo.
                        </p>
                    </div>
                </div>
            </div>
             <Button asChild variant="outline">
              <Link href="/mis-estadisticas">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
        </div>

        {!stats ? (
            <Card className="text-center py-16">
                 <CardContent>
                    <p className="text-muted-foreground">No hay suficientes datos para mostrar estadísticas.</p>
                    <p className="text-sm text-muted-foreground mt-2">Juega y finaliza algunos partidos para empezar a ver tus datos aquí.</p>
                </CardContent>
            </Card>
        ) : (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Resumen General de Partidos</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard title="Partidos Jugados" value={stats.played} icon={Trophy} />
                    <StatCard title="Ganados" value={stats.won} icon={TrendingUp} />
                    <StatCard title="Empatados" value={stats.drawn} icon={Shield} />
                    <StatCard title="Perdidos" value={stats.lost} icon={TrendingDown} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Rendimiento del Equipo</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard title="Tiros Totales" value={stats.totalShots} icon={Crosshair} />
                    <StatCard title="Tiros a Puerta" value={stats.shotsOnTarget} icon={Goal} />
                    <StatCard title="Tiros Fuera" value={stats.shotsOffTarget} icon={ShieldOff} />
                    <StatCard title="Faltas Cometidas" value={stats.fouls} icon={AlertOctagon} />
                    <StatCard title="Faltas Recibidas" value={stats.faltasRecibidas} icon={ShieldCheck} />
                    <StatCard title="Pérdidas de Balón" value={stats.turnovers} icon={RotateCcw} />
                    <StatCard title="Robos de Balón" value={stats.recoveries} icon={Shuffle} />
                    <StatCard title="Tarjetas Amarillas" value={stats.yellowCards} icon={YellowCardIcon} />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Goles a Favor</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 grid-cols-1">
                        <StatCard title="Totales" value={stats.goalsFor} icon={Plus} />
                        <StatCard title="1ª Parte" value={stats.goalsFor1stHalf} icon={Plus} />
                        <StatCard title="2ª Parte" value={stats.goalsFor2ndHalf} icon={Plus} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Goles en Contra</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 grid-cols-1">
                        <StatCard title="Totales" value={stats.goalsAgainst} icon={Minus} />
                        <StatCard title="1ª Parte" value={stats.goalsAgainst1stHalf} icon={Minus} />
                        <StatCard title="2ª Parte" value={stats.goalsAgainst2ndHalf} icon={Minus} />
                    </CardContent>
                </Card>
            </div>
        </>
        )}
    </div>
  );
}
