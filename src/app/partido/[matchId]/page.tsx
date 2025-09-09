'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Edit, History, BarChartHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface PlayerStats {
  id: string;
  number: number;
  name: string;
  goals: number;
  amarillas: number;
  rojas: number;
  faltas: number;
  paradas: number;
  golesContra: number;
  vs1: number;
}

interface GoalEvent {
    type: 'goal';
    playerId: string;
    playerName: string;
    team: 'local' | 'visitor';
    minute: number;
    period: '1ª Parte' | '2ª Parte';
    teamId: string;
}

interface MatchDetails {
  id: string;
  teamId: string;
  date: string;
  matchType: string;
  competition: string;
  localTeam: string;
  visitorTeam: string;
  localScore: number;
  visitorScore: number;
  events: GoalEvent[];
  localPlayers: PlayerStats[];
  visitorPlayers: PlayerStats[];
}


export default function MatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;

    const matchDocRef = doc(db, 'matches', matchId);

    const unsubscribe = onSnapshot(matchDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        setMatch({
            id: docSnap.id,
            teamId: data.teamId,
            date: new Date(data.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            matchType: data.matchType,
            competition: data.competition || 'N/A',
            localTeam: data.localTeam,
            visitorTeam: data.visitorTeam,
            localScore: data.localScore,
            visitorScore: data.visitorScore,
            events: (data.events || []).sort((a: GoalEvent, b: GoalEvent) => a.minute - b.minute),
            localPlayers: data.localPlayers || [],
            visitorPlayers: data.visitorPlayers || [],
        });
      } else {
        console.log("No such document!");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [matchId]);

   if (loading) {
    return (
      <div className="container mx-auto max-w-5xl py-12 px-4 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!match) {
    return <div>Partido no encontrado.</div>;
  }

  const allGoals = match.events.filter(e => e.type === 'goal');
  const localGoals = allGoals.filter(g => g.team === 'local');
  const visitorGoals = allGoals.filter(g => g.team === 'visitor');

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4">
      <div className="flex justify-between items-center mb-6">
         <div>
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
                 <History className="h-5 w-5" />
                 <h2 className="text-xl font-semibold">Detalles del Partido</h2>
            </div>
            <p className="font-semibold text-lg">{match.date} &middot; {match.matchType} &middot; {match.competition}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/equipo/${match.teamId}/partidos`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Historial
          </Button>
          <Button asChild>
            <Link href={`/marcador/${matchId}`}>
                <BarChartHorizontal className="mr-2 h-4 w-4" />
                Gestionar Marcador
            </Link>
          </Button>
        </div>
      </div>

        <Card className="text-center mb-8 shadow-lg">
            <CardContent className="p-8">
                <h3 className="text-3xl font-bold">{match.localTeam} vs {match.visitorTeam}</h3>
                <p className="text-7xl font-extrabold text-primary my-4">{match.localScore} - {match.visitorScore}</p>
            </CardContent>
        </Card>
      
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Local Team Column */}
            <div className="space-y-6">
                 <h3 className="text-2xl font-bold text-center">{match.localTeam}</h3>
                 <Card>
                    <CardHeader><CardTitle>Cronología de Goles</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                               {localGoals.length > 0 ? localGoals.map((goal, i) => (
                                <TableRow key={`local-goal-${i}`}>
                                    <TableCell>{goal.playerName}</TableCell>
                                    <TableCell className="text-right font-bold">{goal.minute}'</TableCell>
                                </TableRow>
                               )) : <TableRow><TableCell>Sin goles</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
                 <Card>
                    <CardHeader><CardTitle>Estadísticas de Jugadores</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>G</TableHead>
                                    <TableHead>TA</TableHead>
                                    <TableHead>TR</TableHead>
                                    <TableHead>F</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {match.localPlayers.map(player => (
                                <TableRow key={player.id}>
                                    <TableCell>{player.number}</TableCell>
                                    <TableCell>{player.name}</TableCell>
                                    <TableCell>{player.goals}</TableCell>
                                    <TableCell>{player.amarillas}</TableCell>
                                    <TableCell>{player.rojas}</TableCell>
                                    <TableCell>{player.faltas}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
            </div>
            {/* Visitor Team Column */}
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-center">{match.visitorTeam}</h3>
                <Card>
                    <CardHeader><CardTitle>Cronología de Goles</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                                 {visitorGoals.length > 0 ? visitorGoals.map((goal, i) => (
                                <TableRow key={`visitor-goal-${i}`}>
                                    <TableCell>{goal.playerName}</TableCell>
                                    <TableCell className="text-right font-bold">{goal.minute}'</TableCell>
                                </TableRow>
                               )) : <TableRow><TableCell>Sin goles</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Estadísticas de Jugadores</CardTitle></CardHeader>

                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>G</TableHead>
                                    <TableHead>TA</TableHead>
                                    <TableHead>TR</TableHead>
                                    <TableHead>F</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {match.visitorPlayers.map(player => (
                                <TableRow key={player.id}>
                                    <TableCell>{player.number}</TableCell>
                                    <TableCell>{player.name}</TableCell>
                                    <TableCell>{player.goals}</TableCell>
                                    <TableCell>{player.amarillas}</TableCell>
                                    <TableCell>{player.rojas}</TableCell>
                                    <TableCell>{player.faltas}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
