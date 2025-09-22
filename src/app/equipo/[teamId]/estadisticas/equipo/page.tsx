
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
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
    ShieldCheck,
    AlertTriangle,
    Hourglass,
    Timer,
    ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, QueryConstraint } from 'firebase/firestore';
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

interface PlayerStatCardProps {
    title: string;
    icon: React.ElementType;
    playerName: string;
    value: number | string;
}

const PlayerStatCard = ({ title, icon: Icon, playerName, value }: PlayerStatCardProps) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-base font-bold">{playerName}</p>
        </div>
      </div>
      <p className="text-right text-3xl font-bold mt-2">{value}</p>
    </CardContent>
  </Card>
);

interface Player {
    name: string;
    number: number;
    teamName: string;
    pj: number;
    goals: number;
    assists: number;
    ta: number;
    tr: number;
    faltas: number;
    paradas: number;
    gRec: number;
    position?: string;
    minutosJugados?: number;
}

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
    shotsBlocked: number;
    turnovers: number;
    recoveries: number;
}

type FilterType = 'Todos' | 'Liga' | 'Copa' | 'Torneo' | 'Amistoso';
const filters: FilterType[] = ['Todos', 'Liga', 'Copa', 'Torneo', 'Amistoso'];

export default function TeamSpecificStatsPage() {
    const { user } = useAuth();
    const params = useParams();
    const teamId = params.teamId as string;
    const [stats, setStats] = useState<Stats | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [teamName, setTeamName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');

     useEffect(() => {
        if (!user || !teamId) {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            setLoading(true);

            const teamDocRef = doc(db, 'teams', teamId);
            const teamDoc = await getDoc(teamDocRef);

            if (!teamDoc.exists()) {
                setLoading(false);
                return;
            }
            const currentTeamName = teamDoc.data().name;
            setTeamName(currentTeamName);

            const playersQuery = query(collection(db, 'teams', teamId, 'players'));
            const playersSnapshot = await getDocs(playersQuery);
            const teamPlayers = playersSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                number: doc.data().number,
                position: doc.data().position
            }));

            const queryConstraints: QueryConstraint[] = [where('teamId', '==', teamId), where('isFinished', '==', true)];
            if(activeFilter !== 'Todos') {
                queryConstraints.push(where('matchType', '==', activeFilter));
            }
            
            const matchesQuery = query(collection(db, 'matches'), ...queryConstraints);
            const matchesSnapshot = await getDocs(matchesQuery);
            const matches = matchesSnapshot.docs.map(doc => doc.data());

            if (matches.length === 0) {
                setStats(null);
                setPlayers([]);
                setLoading(false);
                return;
            }

            const newStats: Stats = {
                played: matches.length, won: 0, drawn: 0, lost: 0, fouls: 0, faltasRecibidas: 0,
                goalsFor: 0, goalsFor1stHalf: 0, goalsFor2ndHalf: 0,
                goalsAgainst: 0, goalsAgainst1stHalf: 0, goalsAgainst2ndHalf: 0,
                totalShots: 0, shotsOnTarget: 0, shotsOffTarget: 0, shotsBlocked: 0,
                turnovers: 0, recoveries: 0,
            };
            
            const playerStats: Record<string, Player> = {};
            teamPlayers.forEach(p => {
                playerStats[p.id] = {
                    name: p.name, number: p.number, teamName: currentTeamName, position: p.position,
                    pj: 0, goals: 0, assists: 0, ta: 0, tr: 0, faltas: 0, paradas: 0, gRec: 0, minutosJugados: 0,
                };
            });

            matches.forEach(match => {
                const isLocalTeam = currentTeamName === match.localTeam;
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
                    userPlayers.forEach((p: any) => {
                        if (playerStats[p.id]) {
                            playerStats[p.id].pj += 1;
                            playerStats[p.id].goals += p.goals || 0;
                            playerStats[p.id].assists += p.assists || 0;
                            playerStats[p.id].ta += p.amarillas || 0;
                            playerStats[p.id].tr += p.rojas || 0;
                            playerStats[p.id].faltas += p.faltas || 0;
                            playerStats[p.id].paradas += p.paradas || 0;
                            playerStats[p.id].gRec += p.gRec || 0;
                            playerStats[p.id].minutosJugados += p.timeOnCourt || 0;
                        }
                    });
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

                if (match.teamStats1) {
                  newStats.shotsOnTarget += match.teamStats1.shotsOnTarget || 0;
                  newStats.shotsOffTarget += match.teamStats1.shotsOffTarget || 0;
                  newStats.shotsBlocked += match.teamStats1.shotsBlocked || 0;
                  newStats.turnovers += match.teamStats1.turnovers || 0;
                  newStats.recoveries += match.teamStats1.recoveries || 0;
                }
                if (match.teamStats2) {
                  newStats.shotsOnTarget += match.teamStats2.shotsOnTarget || 0;
                  newStats.shotsOffTarget += match.teamStats2.shotsOffTarget || 0;
                  newStats.shotsBlocked += match.teamStats2.shotsBlocked || 0;
                  newStats.turnovers += match.teamStats2.turnovers || 0;
                  newStats.recoveries += match.teamStats2.recoveries || 0;
                }
            });

            newStats.totalShots = newStats.shotsOnTarget + newStats.shotsOffTarget + newStats.shotsBlocked;

            setStats(newStats);
            setPlayers(Object.values(playerStats));
            setLoading(false);
        };

        fetchStats();
    }, [user, teamId, activeFilter]);

    const topScorer = useMemo(() => players.length > 0 ? players.reduce((max, p) => p.goals > max.goals ? p : max, players[0]) : null, [players]);
    const topAssistant = useMemo(() => players.length > 0 ? players.reduce((max, p) => p.assists > max.assists ? p : max, players[0]) : null, [players]);
    const mostFouls = useMemo(() => players.length > 0 ? players.reduce((max, p) => p.faltas > max.faltas ? p : max, players[0]) : null, [players]);
    const goalkeepers = useMemo(() => players.filter(p => p.position === 'Portero' || p.paradas > 0), [players]);
    const topGoalkeeperSaves = useMemo(() => goalkeepers.length > 0 ? goalkeepers.reduce((max, p) => p.paradas > max.paradas ? p : max, goalkeepers[0]) : null, [goalkeepers]);
    const topGoalkeeperCleanest = useMemo(() => {
        const gksWithGames = goalkeepers.filter(p => p.pj > 0);
        if (gksWithGames.length === 0) return null;
        return gksWithGames.reduce((min, p) => (p.gRec < min.gRec) ? p : min, gksWithGames[0]);
    }, [goalkeepers]);
    const topGoalkeeperMostGoals = useMemo(() => {
        const gksWithGames = goalkeepers.filter(p => p.pj > 0);
        if (gksWithGames.length === 0) return null;
        return gksWithGames.reduce((max, p) => (p.gRec > max.gRec) ? p : max, gksWithGames[0]);
    }, [goalkeepers]);
    const mostMinutesPlayed = useMemo(() => {
        const playersWithMinutes = players.filter(p => (p.minutosJugados || 0) > 0);
        if (playersWithMinutes.length === 0) return null;
        return playersWithMinutes.reduce((max, p) => (p.minutosJugados || 0) > (max.minutosJugados || 0) ? p : max, playersWithMinutes[0]);
    }, [players]);
    const leastMinutesPlayed = useMemo(() => {
        const playersWithMinutes = players.filter(p => (p.minutosJugados || 0) > 0);
        if (playersWithMinutes.length === 0) return null;
        return playersWithMinutes.reduce((min, p) => (p.minutosJugados || 0) < (min.minutosJugados || 0) ? p : min, playersWithMinutes[0]);
    }, [players]);

    const formatTime = (totalSeconds: number) => {
        if (!totalSeconds || totalSeconds < 0) return '00:00';
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

  if(loading && !stats) {
    return (
        <div className="container mx-auto max-w-7xl py-12 px-4 space-y-8">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4 space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="text-left">
                <div className="flex items-center gap-4">
                    <Trophy className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
                        Estadísticas de {teamName}
                        </h1>
                        <p className="text-lg text-muted-foreground mt-1">
                        Un resumen de la actividad y el rendimiento de tu equipo.
                        </p>
                    </div>
                </div>
            </div>
             <Button asChild variant="outline">
              <Link href={`/equipo/${teamId}/estadisticas`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
        </div>
        
        <Card>
            <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
                {filters.map(filter => (
                    <Button 
                        key={filter} 
                        variant={activeFilter === filter ? 'default' : 'outline'}
                        onClick={() => setActiveFilter(filter)}
                    >
                        {filter}
                    </Button>
                ))}
            </div>
            </CardContent>
        </Card>

        {loading ? (
             <div className="space-y-8">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        ) : !stats ? (
            <Card className="text-center py-16">
                 <CardContent>
                    <p className="text-muted-foreground">No hay suficientes datos para mostrar estadísticas con el filtro actual.</p>
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

             {players.length > 0 && !loading && (
                <Card>
                    <CardHeader>
                        <CardTitle>Jugadores Destacados</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {topScorer && topScorer.goals > 0 && <PlayerStatCard title="Máximo Goleador" icon={Goal} playerName={topScorer.name} value={topScorer.goals} />}
                        {topAssistant && topAssistant.assists > 0 && <PlayerStatCard title="Máximo Asistente" icon={Hand} playerName={topAssistant.name} value={topAssistant.assists} />}
                        {mostFouls && mostFouls.faltas > 0 && <PlayerStatCard title="Más Faltas" icon={AlertTriangle} playerName={mostFouls.name} value={mostFouls.faltas} />}
                        {topGoalkeeperSaves && topGoalkeeperSaves.paradas > 0 && <PlayerStatCard title="Portero con más Paradas" icon={Shield} playerName={topGoalkeeperSaves.name} value={topGoalkeeperSaves.paradas} />}
                        {topGoalkeeperCleanest && <PlayerStatCard title="Portero Menos Goleado" icon={ShieldCheck} playerName={topGoalkeeperCleanest.name} value={topGoalkeeperCleanest.gRec} />}
                        {topGoalkeeperMostGoals && topGoalkeeperMostGoals.gRec > 0 && <PlayerStatCard title="Portero Más Goleado" icon={ShieldAlert} playerName={topGoalkeeperMostGoals.name} value={topGoalkeeperMostGoals.gRec} />}
                        {mostMinutesPlayed && <PlayerStatCard title="Más Minutos Jugados" icon={Hourglass} playerName={mostMinutesPlayed.name} value={formatTime(mostMinutesPlayed.minutosJugados || 0)} />}
                        {leastMinutesPlayed && <PlayerStatCard title="Menos Minutos Jugados" icon={Timer} playerName={leastMinutesPlayed.name} value={formatTime(leastMinutesPlayed.minutosJugados || 0)} />}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Rendimiento del Equipo</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-1">
                    <StatCard title="Tiros Totales" value={stats.totalShots} icon={Crosshair} />
                    <StatCard title="Tiros a Puerta" value={stats.shotsOnTarget} icon={Goal} />
                    <StatCard title="Tiros Fuera" value={stats.shotsOffTarget} icon={ShieldOff} />
                    <StatCard title="Tiros Bloqueados" value={stats.shotsBlocked} icon={Hand} />
                    <StatCard title="Faltas Cometidas" value={stats.fouls} icon={AlertOctagon} />
                    <StatCard title="Faltas Recibidas" value={stats.faltasRecibidas} icon={ShieldCheck} />
                    <StatCard title="Pérdidas de Balón" value={stats.turnovers} icon={RotateCcw} />
                    <StatCard title="Robos de Balón" value={stats.recoveries} icon={Shuffle} />
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


