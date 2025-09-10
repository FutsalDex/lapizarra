
'use client';
import { useState, useEffect } from 'react';
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
    Minus,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
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

interface Stats {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    fouls: number;
    goalsFor: number;
    goalsFor1stHalf: number;
    goalsFor2ndHalf: number;
    goalsAgainst: number;
    goalsAgainst1stHalf: number;
    goalsAgainst2ndHalf: number;
    shotsOnTarget: number;
    shotsOffTarget: number;
    shotsBlocked: number;
    turnovers: number;
    recoveries: number;
}

interface Player {
    name: string;
    goals: number;
    assists: number;
    ta: number;
    tr: number;
    faltas: number;
}

interface PlayerLeader {
    name: string;
    value: number;
}

interface Leaderboards {
    topScorer: PlayerLeader;
    topAssister: PlayerLeader;
    mostYellowCards: PlayerLeader;
    mostRedCards: PlayerLeader;
    mostFouls: PlayerLeader;
}

export default function MisEstadisticasPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [leaders, setLeaders] = useState<Leaderboards | null>(null);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            setLoading(true);

            // Get all teams owned by the user
            const teamsQuery = query(collection(db, 'teams'), where('ownerId', '==', user.uid));
            const teamsSnapshot = await getDocs(teamsQuery);
            const teamIds = teamsSnapshot.docs.map(doc => doc.id);
            const teamNames = teamsSnapshot.docs.map(doc => doc.data().name);

            if (teamIds.length === 0) {
                setLoading(false);
                return;
            }

            // Get all matches for those teams
            const matchesQuery = query(collection(db, 'matches'), where('teamId', 'in', teamIds), where('isFinished', '==', true));
            const matchesSnapshot = await getDocs(matchesQuery);
            const matches = matchesSnapshot.docs.map(doc => doc.data());

            const newStats: Stats = {
                played: matches.length,
                won: 0,
                drawn: 0,
                lost: 0,
                fouls: 0,
                goalsFor: 0,
                goalsFor1stHalf: 0,
                goalsFor2ndHalf: 0,
                goalsAgainst: 0,
                goalsAgainst1stHalf: 0,
                goalsAgainst2ndHalf: 0,
                shotsOnTarget: 0, // Need to add to match data
                shotsOffTarget: 0, // Need to add to match data
                shotsBlocked: 0, // Need to add to match data
                turnovers: 0, // Need to add to match data
                recoveries: 0, // Need to add to match data
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

            setStats(newStats);
            
            // Fetch all players for leaderboards
            const playersQuery = collectionGroup(db, 'players');
            const playersSnapshot = await getDocs(playersQuery);
            const allPlayers = playersSnapshot.docs
                .filter(doc => teamIds.includes(doc.ref.parent.parent?.id || ''))
                .map(doc => doc.data() as Player);
                
            const newLeaders: Leaderboards = {
                topScorer: { name: 'N/A', value: 0},
                topAssister: { name: 'N/A', value: 0},
                mostYellowCards: { name: 'N/A', value: 0},
                mostRedCards: { name: 'N/A', value: 0},
                mostFouls: { name: 'N/A', value: 0},
            };

            allPlayers.forEach(p => {
                if(p.goals > newLeaders.topScorer.value) newLeaders.topScorer = { name: p.name, value: p.goals };
                if(p.assists > newLeaders.topAssister.value) newLeaders.topAssister = { name: p.name, value: p.assists };
                if(p.ta > newLeaders.mostYellowCards.value) newLeaders.mostYellowCards = { name: p.name, value: p.ta };
                if(p.tr > newLeaders.mostRedCards.value) newLeaders.mostRedCards = { name: p.name, value: p.tr };
                if(p.faltas > newLeaders.mostFouls.value) newLeaders.mostFouls = { name: p.name, value: p.faltas };
            });

            setLeaders(newLeaders);
            setLoading(false);
        };

        fetchStats();
    }, [user]);

  if(loading) {
    return (
        <div className="container mx-auto max-w-7xl py-12 px-4 space-y-8">
            <Skeleton className="h-24 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    )
  }

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

        {!stats || !leaders ? (
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
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <StatCard title="Partidos Jugados" value={stats.played} icon={Trophy} />
                    <StatCard title="Ganados" value={stats.won} icon={TrendingUp} />
                    <StatCard title="Empatados" value={stats.drawn} icon={Shield} />
                    <StatCard title="Perdidos" value={stats.lost} icon={TrendingDown} />
                    <StatCard title="Faltas Cometidas" value={stats.fouls} icon={AlertOctagon} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Rendimiento del Equipo</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <StatCard title="Tiros a Puerta" value={stats.shotsOnTarget} icon={Goal} />
                    <StatCard title="Tiros Fuera" value={stats.shotsOffTarget} icon={ShieldOff} />
                    <StatCard title="Tiros Bloqueados" value={stats.shotsBlocked} icon={Hand} />
                    <StatCard title="Pérdidas de Balón" value={stats.turnovers} icon={RotateCcw} />
                    <StatCard title="Robos de Balón" value={stats.recoveries} icon={Shuffle} />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Goles a Favor</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 grid-cols-3">
                        <StatCard title="Totales" value={stats.goalsFor} icon={Plus} />
                        <StatCard title="1ª Parte" value={stats.goalsFor1stHalf} icon={Plus} />
                        <StatCard title="2ª Parte" value={stats.goalsFor2ndHalf} icon={Plus} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Goles en Contra</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 grid-cols-3">
                        <StatCard title="Totales" value={stats.goalsAgainst} icon={Minus} />
                        <StatCard title="1ª Parte" value={stats.goalsAgainst1stHalf} icon={Minus} />
                        <StatCard title="2ª Parte" value={stats.goalsAgainst2ndHalf} icon={Minus} />
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Jugadores Destacados</CardTitle>
                    <CardDescription>Resumen de los líderes estadísticos de la temporada.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <PlayerStatCard title="Máximo Goleador" name={leaders.topScorer.name} value={leaders.topScorer.value} icon={Award} iconBgColor="bg-green-100" iconColor="text-green-600" />
                    <PlayerStatCard title="Máximo Asistente" name={leaders.topAssister.name} value={leaders.topAssister.value} icon={Hand} iconBgColor="bg-blue-100" iconColor="text-blue-600" />
                    <PlayerStatCard title="Más Tarjetas Amarillas" name={leaders.mostYellowCards.name} value={leaders.mostYellowCards.value} icon={RectangleVertical} iconBgColor="bg-yellow-100" iconColor="text-yellow-600" />
                    <PlayerStatCard title="Más Tarjetas Rojas" name={leaders.mostRedCards.name} value={leaders.mostRedCards.value} icon={RectangleHorizontal} iconBgColor="bg-red-100" iconColor="text-red-600" />
                    <PlayerStatCard title="Más Faltas Cometidas" name={leaders.mostFouls.name} value={leaders.mostFouls.value} icon={Footprints} iconBgColor="bg-orange-100" iconColor="text-orange-600" />
                </CardContent>
            </Card>
        </>
        )}
    </div>
  );
}
