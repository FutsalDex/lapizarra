
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
    ShieldCheck
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
    position?: string;
}

interface StatCardProps {
    title: string;
    icon: React.ElementType;
    playerName: string;
    value: number;
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

type FilterType = 'Todos' | 'Liga' | 'Copa' | 'Torneo' | 'Amistoso';
const filters: FilterType[] = ['Todos', 'Liga', 'Copa', 'Torneo', 'Amistoso'];

export default function TeamPlayerStatsPage() {
    const { user } = useAuth();
    const params = useParams();
    const teamId = params.teamId as string;
    const [players, setPlayers] = useState<Player[]>([]);
    const [teamName, setTeamName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');

     useEffect(() => {
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
                    pj: 0, goals: 0, assists: 0, ta: 0, tr: 0, faltas: 0, paradas: 0, gRec: 0,
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
                        }
                    });
                }
            });

            setPlayers(Object.values(playerStats).sort((a, b) => a.number - b.number));
            setLoading(false);
        };

        fetchPlayerStats();
    }, [user, teamId, activeFilter]);

    const filteredPlayers = useMemo(() => {
        return players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [players, searchTerm]);

    const topScorer = useMemo(() => players.reduce((max, p) => p.goals > max.goals ? p : max, players[0]), [players]);
    const topAssistant = useMemo(() => players.reduce((max, p) => p.assists > max.assists ? p : max, players[0]), [players]);
    const mostFouls = useMemo(() => players.reduce((max, p) => p.faltas > max.faltas ? p : max, players[0]), [players]);
    const goalkeepers = useMemo(() => players.filter(p => p.position === 'Portero' || p.paradas > 0), [players]);
    const topGoalkeeperSaves = useMemo(() => goalkeepers.reduce((max, p) => p.paradas > max.paradas ? p : max, goalkeepers[0]), [goalkeepers]);
    const topGoalkeeperCleanest = useMemo(() => {
        const gksWithGames = goalkeepers.filter(p => p.pj > 0);
        if (gksWithGames.length === 0) return null;
        return gksWithGames.reduce((min, p) => (p.gRec < min.gRec) ? p : min, gksWithGames[0]);
    }, [goalkeepers]);


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
        
        {players.length > 0 && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topScorer && topScorer.goals > 0 && <StatCard title="Máximo Goleador" icon={Goal} playerName={topScorer.name} value={topScorer.goals} />}
                {topAssistant && topAssistant.assists > 0 && <StatCard title="Máximo Asistente" icon={Hand} playerName={topAssistant.name} value={topAssistant.assists} />}
                {mostFouls && mostFouls.faltas > 0 && <StatCard title="Más Faltas" icon={AlertTriangle} playerName={mostFouls.name} value={mostFouls.faltas} />}
                {topGoalkeeperSaves && topGoalkeeperSaves.paradas > 0 && <StatCard title="Portero con más Paradas" icon={Shield} playerName={topGoalkeeperSaves.name} value={topGoalkeeperSaves.paradas} />}
                {topGoalkeeperCleanest && <StatCard title="Portero Menos Goleado" icon={ShieldCheck} playerName={topGoalkeeperCleanest.name} value={topGoalkeeperCleanest.gRec} />}
            </div>
        )}

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
                                <TableHead className="text-center">Goles</TableHead>
                                <TableHead className="text-center">Asist.</TableHead>
                                <TableHead className="text-center">TA</TableHead>
                                <TableHead className="text-center">TR</TableHead>
                                <TableHead className="text-center">Faltas</TableHead>
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
                                    <TableCell className="text-center">{player.goals || 0}</TableCell>
                                    <TableCell className="text-center">{player.assists || 0}</TableCell>
                                    <TableCell className="text-center">{player.ta || 0}</TableCell>
                                    <TableCell className="text-center">{player.tr || 0}</TableCell>
                                    <TableCell className="text-center">{player.faltas || 0}</TableCell>
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

    

    

