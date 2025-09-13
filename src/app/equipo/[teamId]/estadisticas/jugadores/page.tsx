
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
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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
}

export default function TeamPlayerStatsPage() {
    const { user } = useAuth();
    const params = useParams();
    const teamId = params.teamId as string;
    const [players, setPlayers] = useState<Player[]>([]);
    const [teamName, setTeamName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

     useEffect(() => {
        if (!user || !teamId) {
            setLoading(false);
            return;
        }

        const fetchPlayers = async () => {
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
            
            const teamPlayers = playersSnapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return {
                        ...data,
                        teamName: currentTeamName,
                    } as Player;
                });

            setPlayers(teamPlayers.sort((a, b) => b.goals - a.goals));
            setLoading(false);
        };

        fetchPlayers();
    }, [user, teamId]);

    const filteredPlayers = useMemo(() => {
        return players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [players, searchTerm]);


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
                <CardTitle>Tabla de Jugadores</CardTitle>
                <CardDescription>Busca un jugador por su nombre para ver sus estadísticas.</CardDescription>
                <div className="pt-4">
                    <Input 
                        placeholder="Buscar jugador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-96 w-full" />
                ) : players.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">No se encontraron jugadores.</p>
                        <p className="text-sm text-muted-foreground mt-2">Añade jugadores a tu equipo para ver sus estadísticas aquí.</p>
                    </div>
                ) : (
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
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
