
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
import { ArrowLeft, Edit, History, BarChartHorizontal, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface PlayerStats {
  id: string;
  number: number;
  name: string;
  goals: number;
  assists: number;
  amarillas: number;
  rojas: number;
  faltas: number;
  paradas: number;
  gRec: number;
  vs1: number;
  timeOnCourt?: number;
  tirosPuerta: number;
  tirosFuera: number;
  recuperaciones: number;
  perdidas: number;
}

interface GoalEvent {
    id: string; // Unique ID for the event
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
        let processedData = {
            id: docSnap.id,
            ...data
        };
        
        const sortedEvents = (processedData.events || []).sort((a: GoalEvent, b: GoalEvent) => a.minute - b.minute);

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
            events: sortedEvents,
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
  
  const formatTime = (totalSeconds?: number) => {
    if (totalSeconds === undefined || totalSeconds < 0) return '00:00';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderTeamContent = (teamType: 'local' | 'visitor') => {
    const teamName = teamType === 'local' ? match.localTeam : match.visitorTeam;
    const goals = match.events.filter(e => e.type === 'goal' && e.team === teamType);
    const players = teamType === 'local' ? match.localPlayers : match.visitorPlayers;

    return (
      <div className="space-y-6 pt-4">
        <h3 className="text-2xl font-bold text-center">{teamName}</h3>
        <Card>
          <CardHeader><CardTitle>Cronología de Goles</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {goals.length > 0 ? goals.map((goal, i) => (
                  <TableRow key={`${teamType}-goal-${i}`}>
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
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Min.</TableHead>
                  <TableHead>G</TableHead>
                  <TableHead>As</TableHead>
                  <TableHead className="hidden sm:table-cell">TA</TableHead>
                  <TableHead className="hidden sm:table-cell">TR</TableHead>
                  <TableHead className="hidden sm:table-cell">F</TableHead>
                  <TableHead className="hidden lg:table-cell">TP</TableHead>
                  <TableHead className="hidden lg:table-cell">TF</TableHead>
                  <TableHead className="hidden lg:table-cell">R</TableHead>
                  <TableHead className="hidden lg:table-cell">P</TableHead>
                  <TableHead className="hidden lg:table-cell">Par.</TableHead>
                  <TableHead className="hidden lg:table-cell">GC</TableHead>
                  <TableHead className="hidden lg:table-cell">1vs1</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(players || []).map(player => (
                  <TableRow key={player.id}>
                    <TableCell>{player.number ?? 0}</TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell>{formatTime(player.timeOnCourt)}</TableCell>
                    <TableCell>{player.goals ?? 0}</TableCell>
                    <TableCell>{player.assists ?? 0}</TableCell>
                    <TableCell className="hidden sm:table-cell">{player.amarillas ?? 0}</TableCell>
                    <TableCell className="hidden sm:table-cell">{player.rojas ?? 0}</TableCell>
                    <TableCell className="hidden sm:table-cell">{player.faltas ?? 0}</TableCell>
                    <TableCell className="hidden lg:table-cell">{player.tirosPuerta ?? 0}</TableCell>
                    <TableCell className="hidden lg:table-cell">{player.tirosFuera ?? 0}</TableCell>
                    <TableCell className="hidden lg:table-cell">{player.recuperaciones ?? 0}</TableCell>
                    <TableCell className="hidden lg:table-cell">{player.perdidas ?? 0}</TableCell>
                    <TableCell className="hidden lg:table-cell">{player.paradas ?? 0}</TableCell>
                    <TableCell className="hidden lg:table-cell">{player.gRec ?? 0}</TableCell>
                    <TableCell className="hidden lg:table-cell">{player.vs1 ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
         <div>
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
                 <History className="h-5 w-5" />
                 <h2 className="text-xl font-semibold">Detalles del Partido</h2>
            </div>
            <p className="font-semibold text-lg">{match.date} &middot; {match.matchType} {match.matchType === 'Liga' ? `&middot; ${match.competition}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/equipo/${match.teamId}/partidos`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button asChild>
            <Link href={`/marcador/${matchId}`}>
                <BarChartHorizontal className="mr-2 h-4 w-4" />
                Gestionar
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
      
        <Card>
            <CardContent className="p-0">
                <Tabs defaultValue="local">
                    <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none">
                        <TabsTrigger value="local">{match.localTeam}</TabsTrigger>
                        <TabsTrigger value="visitor">{match.visitorTeam}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="local" className="p-4 md:p-6 m-0">
                        {renderTeamContent('local')}
                    </TabsContent>
                    <TabsContent value="visitor" className="p-4 md:p-6 m-0">
                        {renderTeamContent('visitor')}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    </div>
  );
}
