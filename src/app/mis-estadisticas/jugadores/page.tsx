
'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
    Users, 
    ArrowLeft,
    Goal,
    Hand,
    AlertTriangle,
    Shield,
    ShieldCheck,
    Hourglass,
    Timer,
    ShieldAlert,
    Crosshair,
    ShieldOff,
    Shuffle,
    RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, collectionGroup, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

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
    vs1: number;
    position?: string;
    minutosJugados?: number;
    tirosPuerta: number;
    tirosFuera: number;
    recuperaciones: number;
    perdidas: number;
}

interface StatCardProps {
    title: string;
    icon: React.ElementType;
    playerName: string;
    value: number | string;
}

const StatCard = ({ title, icon: Icon, playerName, value }: StatCardProps) => (
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

const YellowCardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H18C18.5523 4 19 4.44772 19 5V16C19 16.5523 18.5523 17 18 17H6C5.44772 17 5 16.5523 5 16V5C5 4.44772 4.55228 4 4 4Z" fill="#FBBF24" stroke="#D97706" strokeWidth="2"/>
    </svg>
);

const RedCardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H18C18.5523 4 19 4.44772 19 5V16C19 16.5523 18.5523 17 18 17H6C5.44772 17 5 16.5523 5 16V5C5 4.44772 4.55228 4 4 4Z" fill="#F87171" stroke="#B91C1C" strokeWidth="2"/>
    </svg>
);

type FilterType = 'Todos' | 'Liga' | 'Copa' | 'Torneo' | 'Amistoso';
const filters: FilterType[] = ['Todos', 'Liga', 'Copa', 'Torneo', 'Amistoso'];

export default function PlayerStatsPage() {
    const { user } = useAuth();
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');

     useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchPlayersAndStats = async () => {
            setLoading(true);

            // 1. Get user's teams
            const teamsQuery = query(collection(db, 'teams'), where('ownerId', '==', user.uid));
            const teamsSnapshot = await getDocs(teamsQuery);
            const teamsMap = new Map(teamsSnapshot.docs.map(doc => [doc.id, doc.data().name]));
            const teamIds = Array.from(teamsMap.keys());
            
            if (teamIds.length === 0) {
                setLoading(false);
                return;
            }

            // 2. Get players from those teams
            const playersGroupQuery = collectionGroup(db, 'players');
            const playersSnapshot = await getDocs(playersGroupQuery);
            const teamPlayers = playersSnapshot.docs
                .filter(doc => teamIds.includes(doc.ref.parent.parent?.id || ''))
                .map(doc => ({
                    id: doc.id,
                    name: doc.data().name,
                    number: doc.data().number,
                    position: doc.data().position,
                    teamId: doc.ref.parent.parent?.id || '',
                }));

            // 3. Get matches based on filter
            const queryConstraints: QueryConstraint[] = [where('teamId', 'in', teamIds), where('isFinished', '==', true)];
            if (activeFilter !== 'Todos') {
                queryConstraints.push(where('matchType', '==', activeFilter));
            }
            const matchesQuery = query(collection(db, 'matches'), ...queryConstraints);
            const matchesSnapshot = await getDocs(matchesQuery);
            const matches = matchesSnapshot.docs.map(doc => doc.data());


            // 4. Aggregate stats
            const playerStats: Record<string, Player> = {};
            teamPlayers.forEach(p => {
                playerStats[p.id] = {
                    name: p.name, number: p.number, teamName: teamsMap.get(p.teamId) || 'N/A', position: p.position,
                    pj: 0, goals: 0, assists: 0, ta: 0, tr: 0, faltas: 0, paradas: 0, gRec: 0, vs1: 0, minutosJugados: 0,
                    tirosPuerta: 0, tirosFuera: 0, recuperaciones: 0, perdidas: 0,
                };
            });

            matches.forEach(match => {
                const teamName = teamsMap.get(match.teamId);
                if (!teamName) return;

                const isLocal = match.localTeam === teamName;
                const matchPlayers = isLocal ? match.localPlayers : match.visitorPlayers;
                
                if (matchPlayers) {
                    matchPlayers.forEach((p: any) => {
                        if (playerStats[p.id]) {
                            playerStats[p.id].pj += 1;
                            playerStats[p.id].goals += p.goals || 0;
                            playerStats[p.id].assists += p.assists || 0;
                            playerStats[p.id].ta += p.amarillas || 0;
                            playerStats[p.id].tr += p.rojas || 0;
                            playerStats[p.id].faltas += p.faltas || 0;
                            playerStats[p.id].paradas += p.paradas || 0;
                            playerStats[p.id].gRec += p.gRec || 0;
                            playerStats[p.id].vs1 += p.vs1 || 0;
                            playerStats[p.id].minutosJugados += p.timeOnCourt || 0;
                            playerStats[p.id].tirosPuerta += p.tirosPuerta || 0;
                            playerStats[p.id].tirosFuera += p.tirosFuera || 0;
                            playerStats[p.id].recuperaciones += p.recuperaciones || 0;
                            playerStats[p.id].perdidas += p.perdidas || 0;
                        }
                    });
                }
            });

            setPlayers(Object.values(playerStats).sort((a, b) => a.number - b.number));
            setLoading(false);
        };

        fetchPlayersAndStats();
    }, [user, activeFilter]);

    const filteredPlayers = useMemo(() => {
        return players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [players, searchTerm]);

    const topScorer = useMemo(() => players.length > 0 ? players.reduce((max, p) => p.goals > max.goals ? p : max, players[0]) : null, [players]);
    const topAssistant = useMemo(() => players.length > 0 ? players.reduce((max, p) => p.assists > max.assists ? p : max, players[0]) : null, [players]);
    const mostFouls = useMemo(() => players.length > 0 ? players.reduce((max, p) => p.faltas > max.faltas ? p : max, players[0]) : null, [players]);
    const mostYellows = useMemo(() => players.length > 0 ? players.reduce((max, p) => p.ta > max.ta ? p : max, players[0]) : null, [players]);
    const mostReds = useMemo(() => players.length > 0 ? players.reduce((max, p) => p.tr > max.tr ? p : max, players[0]) : null, [players]);

    const goalkeepers = useMemo(() => players.filter(p => p.position === 'Portero'), [players]);
    const fieldPlayers = useMemo(() => players.filter(p => p.position !== 'Portero'), [players]);

    const topGoalkeeperSaves = useMemo(() => goalkeepers.length > 0 ? goalkeepers.reduce((max, p) => p.paradas > max.paradas ? p : max, goalkeepers[0]) : null, [goalkeepers]);
    const top1v1Saver = useMemo(() => goalkeepers.length > 0 ? goalkeepers.reduce((max, p) => p.vs1 > max.vs1 ? p : max, goalkeepers[0]) : null, [goalkeepers]);
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

    const mostMinutesPlayer = useMemo(() => {
        const playersWithMinutes = fieldPlayers.filter(p => (p.minutosJugados || 0) > 0);
        if (playersWithMinutes.length === 0) return null;
        return playersWithMinutes.reduce((max, p) => (p.minutosJugados || 0) > (max.minutosJugados || 0) ? p : max, playersWithMinutes[0]);
    }, [fieldPlayers]);
    const leastMinutesPlayer = useMemo(() => {
        const playersWithMinutes = fieldPlayers.filter(p => (p.minutosJugados || 0) > 0);
        if (playersWithMinutes.length === 0) return null;
        return playersWithMinutes.reduce((min, p) => (p.minutosJugados || 0) < (min.minutosJugados || 0) ? p : min, playersWithMinutes[0]);
    }, [fieldPlayers]);

    const mostMinutesGoalkeeper = useMemo(() => {
        const gksWithMinutes = goalkeepers.filter(p => (p.minutosJugados || 0) > 0);
        if (gksWithMinutes.length === 0) return null;
        return gksWithMinutes.reduce((max, p) => (p.minutosJugados || 0) > (max.minutosJugados || 0) ? p : max, gksWithMinutes[0]);
    }, [goalkeepers]);

    const leastMinutesGoalkeeper = useMemo(() => {
        const gksWithMinutes = goalkeepers.filter(p => (p.minutosJugados || 0) > 0);
        if (gksWithMinutes.length === 0) return null;
        return gksWithMinutes.reduce((min, p) => (p.minutosJugados || 0) < (min.minutosJugados || 0) ? p : min, gksWithMinutes[0]);
    }, [goalkeepers]);

    const topShotsOnTarget = useMemo(() => players.length > 0 ? players.reduce((max, p) => p.tirosPuerta > max.tirosPuerta ? p : max, players[0]) : null, [players]);
    const topShotsOffTarget = useMemo(() => players.length > 0 ? players.reduce((max, p) => p.tirosFuera > max.tirosFuera ? p : max, players[0]) : null, [players]);
    const topRecoveries = useMemo(() => players.length > 0 ? players.reduce((max, p) => p.recuperaciones > max.recuperaciones ? p : max, players[0]) : null, [players]);
    const topLosses = useMemo(() => players.length > 0 ? players.reduce((max, p) => p.perdidas > max.perdidas ? p : max, players[0]) : null, [players]);


    const formatTime = (totalSeconds: number) => {
        if (!totalSeconds || totalSeconds < 0) return '00:00';
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };


  return (
    <div className="container mx-auto max-w-7xl py-12 px-4 space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="text-left">
                <div className="flex items-center gap-4">
                    <Users className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
                        Estadísticas de Jugadores
                        </h1>
                        <p className="text-lg text-muted-foreground mt-1">
                        Rendimiento individual de todos los jugadores de tus equipos.
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
        
        {players.length > 0 && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {topScorer && topScorer.goals > 0 && <StatCard title="Máximo Goleador" icon={Goal} playerName={topScorer.name} value={topScorer.goals} />}
                {topAssistant && topAssistant.assists > 0 && <StatCard title="Máximo Asistente" icon={Hand} playerName={topAssistant.name} value={topAssistant.assists} />}
                {topShotsOnTarget && topShotsOnTarget.tirosPuerta > 0 && <StatCard title="Más Tiros a Puerta" icon={Crosshair} playerName={topShotsOnTarget.name} value={topShotsOnTarget.tirosPuerta} />}
                {topShotsOffTarget && topShotsOffTarget.tirosFuera > 0 && <StatCard title="Más Tiros Fuera" icon={ShieldOff} playerName={topShotsOffTarget.name} value={topShotsOffTarget.tirosFuera} />}
                {topRecoveries && topRecoveries.recuperaciones > 0 && <StatCard title="Más Recuperaciones" icon={Shuffle} playerName={topRecoveries.name} value={topRecoveries.recuperaciones} />}
                {topLosses && topLosses.perdidas > 0 && <StatCard title="Más Pérdidas" icon={RotateCcw} playerName={topLosses.name} value={topLosses.perdidas} />}
                {mostFouls && mostFouls.faltas > 0 && <StatCard title="Más Faltas" icon={AlertTriangle} playerName={mostFouls.name} value={mostFouls.faltas} />}
                {mostYellows && mostYellows.ta > 0 && <StatCard title="Más T. Amarillas" icon={YellowCardIcon} playerName={mostYellows.name} value={mostYellows.ta} />}
                {mostReds && mostReds.tr > 0 && <StatCard title="Más T. Rojas" icon={RedCardIcon} playerName={mostReds.name} value={mostReds.tr} />}
                {topGoalkeeperSaves && topGoalkeeperSaves.paradas > 0 && <StatCard title="Portero con más Paradas" icon={Shield} playerName={topGoalkeeperSaves.name} value={topGoalkeeperSaves.paradas} />}
                {top1v1Saver && top1v1Saver.vs1 > 0 && <StatCard title="Portero mejor en 1vs1" icon={Crosshair} playerName={top1v1Saver.name} value={top1v1Saver.vs1} />}
                {topGoalkeeperCleanest && <StatCard title="Portero Menos Goleado" icon={ShieldCheck} playerName={topGoalkeeperCleanest.name} value={topGoalkeeperCleanest.gRec} />}
                {topGoalkeeperMostGoals && topGoalkeeperMostGoals.gRec > 0 && <StatCard title="Portero Más Goleado" icon={ShieldAlert} playerName={topGoalkeeperMostGoals.name} value={topGoalkeeperMostGoals.gRec} />}
                {mostMinutesGoalkeeper && <StatCard title="Portero con más minutos" icon={Hourglass} playerName={mostMinutesGoalkeeper.name} value={formatTime(mostMinutesGoalkeeper.minutosJugados || 0)} />}
                {leastMinutesGoalkeeper && <StatCard title="Portero con menos minutos" icon={Timer} playerName={leastMinutesGoalkeeper.name} value={formatTime(leastMinutesGoalkeeper.minutosJugados || 0)} />}
                {mostMinutesPlayer && <StatCard title="Jugador con más minutos" icon={Hourglass} playerName={mostMinutesPlayer.name} value={formatTime(mostMinutesPlayer.minutosJugados || 0)} />}
                {leastMinutesPlayer && <StatCard title="Jugador con menos minutos" icon={Timer} playerName={leastMinutesPlayer.name} value={formatTime(leastMinutesPlayer.minutosJugados || 0)} />}
            </div>
        )}

        <Card>
            <CardHeader>
                <CardTitle>Tabla de Jugadores</CardTitle>
                <CardDescription>Busca un jugador por su nombre o filtra por competición para ver sus estadísticas.</CardDescription>
                <div className="pt-4 flex flex-col md:flex-row gap-4">
                    <Input 
                        placeholder="Buscar jugador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
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
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-96 w-full" />
                ) : players.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">No se encontraron datos de jugadores.</p>
                        <p className="text-sm text-muted-foreground mt-2">Añade jugadores a tus equipos y registra partidos para ver sus estadísticas aquí.</p>
                    </div>
                ) : (
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Equipo</TableHead>
                                <TableHead className="text-center">PJ</TableHead>
                                <TableHead className="text-center">Min.</TableHead>
                                <TableHead className="text-center">Goles</TableHead>
                                <TableHead className="text-center">Asist.</TableHead>
                                <TableHead className="text-center">TA</TableHead>
                                <TableHead className="text-center">TR</TableHead>
                                <TableHead className="text-center">Faltas</TableHead>
                                <TableHead className="text-center">TP</TableHead>
                                <TableHead className="text-center">TF</TableHead>
                                <TableHead className="text-center">R</TableHead>
                                <TableHead className="text-center">P</TableHead>
                                <TableHead className="text-center">Paradas</TableHead>
                                <TableHead className="text-center">G. Rec.</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPlayers.map((player, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{player.name}</TableCell>
                                    <TableCell>{player.teamName}</TableCell>
                                    <TableCell className="text-center">{player.pj || 0}</TableCell>
                                    <TableCell className="text-center">{formatTime(player.minutosJugados || 0)}</TableCell>
                                    <TableCell className="text-center">{player.goals || 0}</TableCell>
                                    <TableCell className="text-center">{player.assists || 0}</TableCell>
                                    <TableCell className="text-center">{player.ta || 0}</TableCell>
                                    <TableCell className="text-center">{player.tr || 0}</TableCell>
                                    <TableCell className="text-center">{player.faltas || 0}</TableCell>
                                    <TableCell className="text-center">{player.tirosPuerta || 0}</TableCell>
                                    <TableCell className="text-center">{player.tirosFuera || 0}</TableCell>
                                    <TableCell className="text-center">{player.recuperaciones || 0}</TableCell>
                                    <TableCell className="text-center">{player.perdidas || 0}</TableCell>
                                    <TableCell className="text-center">{player.paradas || 0}</TableCell>
                                    <TableCell className="text-center">{player.gRec || 0}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                )}
                 {!loading && filteredPlayers.length === 0 && players.length > 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        No se encontraron jugadores con ese nombre.
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
