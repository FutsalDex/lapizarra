
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
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
import { collection, query, where, getDocs, doc, getDoc, QueryConstraint } from 'firebase/firestore';
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

const demoTeamName = "Equipo Demo";

const demoPlayers: Player[] = [
    { name: 'Portero Demo', number: 1, teamName: demoTeamName, pj: 10, goals: 0, assists: 1, ta: 0, tr: 0, faltas: 2, paradas: 45, gRec: 15, vs1: 10, position: 'Portero', minutosJugados: 900*60, tirosPuerta: 0, tirosFuera: 0, recuperaciones: 5, perdidas: 3 },
    { name: 'Cierre Demo', number: 5, teamName: demoTeamName, pj: 10, goals: 5, assists: 3, ta: 2, tr: 0, faltas: 15, paradas: 0, gRec: 0, vs1: 0, position: 'Cierre', minutosJugados: 850*60, tirosPuerta: 10, tirosFuera: 5, recuperaciones: 40, perdidas: 20 },
    { name: 'Ala Izquierdo', number: 7, teamName: demoTeamName, pj: 10, goals: 12, assists: 8, ta: 1, tr: 0, faltas: 10, paradas: 0, gRec: 0, vs1: 0, position: 'Ala', minutosJugados: 800*60, tirosPuerta: 25, tirosFuera: 15, recuperaciones: 30, perdidas: 25 },
    { name: 'Ala Derecho', number: 10, teamName: demoTeamName, pj: 10, goals: 8, assists: 15, ta: 3, tr: 1, faltas: 12, paradas: 0, gRec: 0, vs1: 0, position: 'Ala', minutosJugados: 820*60, tirosPuerta: 20, tirosFuera: 10, recuperaciones: 35, perdidas: 22 },
    { name: 'Pívot Demo', number: 9, teamName: demoTeamName, pj: 10, goals: 15, assists: 5, ta: 4, tr: 0, faltas: 20, paradas: 0, gRec: 0, vs1: 0, position: 'Pívot', minutosJugados: 750*60, tirosPuerta: 30, tirosFuera: 20, recuperaciones: 15, perdidas: 30 },
];


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

export default function TeamPlayerStatsPage() {
    const { user } = useAuth();
    const params = useParams();
    const teamId = params.teamId as string;
    const isDemoMode = teamId === 'demo-team-guest';

    const [players, setPlayers] = useState<Player[]>([]);
    const [teamName, setTeamName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');

     useEffect(() => {
        if (isDemoMode) {
            setPlayers(demoPlayers);
            setTeamName(demoTeamName);
            setLoading(false);
            return;
        }

        if (!user || !teamId) {
            setLoading(false);
            return;
        }

        const fetchPlayerStats = async () => {
            setLoading(true);

            const teamDocRef = doc(db, 'teams', teamId);
            const teamDoc = await getDoc(teamDocRef);
            
            if (!teamDoc.exists()) {
                setLoading(false);
                return;
            }
            const currentTeamName = teamDoc.data().name;
            setTeamName(currentTeamName);

            // Get base player data
            const playersQuery = query(collection(db, 'teams', teamId, 'players'));
            const playersSnapshot = await getDocs(playersQuery);
            const teamPlayers = playersSnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                number: doc.data().number,
                position: doc.data().position
            }));

            // Get matches based on filter
            const queryConstraints: QueryConstraint[] = [where('teamId', '==', teamId), where('isFinished', '==', true)];
            if (activeFilter !== 'Todos') {
                queryConstraints.push(where('matchType', '==', activeFilter));
            }
            const matchesQuery = query(collection(db, 'matches'), ...queryConstraints);
            const matchesSnapshot = await getDocs(matchesQuery);
            const matches = matchesSnapshot.docs.map(doc => doc.data());


            // Aggregate stats
            const playerStats: Record<string, Player> = {};
            teamPlayers.forEach(p => {
                playerStats[p.id] = {
                    name: p.name, number: p.number, teamName: currentTeamName, position: p.position,
                    pj: 0, goals: 0, assists: 0, ta: 0, tr: 0, faltas: 0, paradas: 0, gRec: 0, vs1: 0, minutosJugados: 0,
                    tirosPuerta: 0, tirosFuera: 0, recuperaciones: 0, perdidas: 0,
                };
            });

            matches.forEach(match => {
                const isLocal = match.localTeam === currentTeamName;
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

        fetchPlayerStats();
    }, [user, teamId, activeFilter, isDemoMode]);

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
                        Rendimiento individual de los jugadores de {teamName}.
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
            <CardHeader>
                <CardTitle>Controles</CardTitle>
                <CardDescription>Filtra por competición y busca jugadores.</CardDescription>
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
        </Card>

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
                <CardTitle>Tabla General de Jugadores</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-96 w-full" />
                ) : players.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">No se encontraron datos para los filtros seleccionados.</p>
                        <p className="text-sm text-muted-foreground mt-2">Añade jugadores y partidos a tu equipo para ver sus estadísticas aquí.</p>
                    </div>
                ) : (
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">Dorsal</TableHead>
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
                                    <TableCell className="text-center font-medium">{player.number}</TableCell>
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
