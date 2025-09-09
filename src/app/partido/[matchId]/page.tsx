
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
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Edit, History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

// Dummy interfaces, replace with your actual data structure from Firebase
interface PlayerStats {
  id: string;
  dorsal: number;
  nombre: string;
  goles: number;
  amarillas: number;
  rojas: number;
  faltas: number;
  paradas: number;
  golesContra: number;
  vs1: number;
}

interface GoalEvent {
  goleador: string;
  minuto: string;
}

interface MatchDetails {
  id: string;
  date: string;
  matchType: string;
  competition: string;
  localTeam: string;
  visitorTeam: string;
  localScore: number;
  visitorScore: number;
  localGoals: GoalEvent[];
  visitorGoals: GoalEvent[];
  localStats: PlayerStats[];
  visitorStats: PlayerStats[];
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
        // This is where you would map your firestore data to the MatchDetails interface
        // For now, using dummy data structure.
        setMatch({
            id: docSnap.id,
            date: new Date(data.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            matchType: data.matchType,
            competition: data.competition || 'TERCERA DIVISION JUVENIL - GRUPO 5',
            localTeam: data.localTeam,
            visitorTeam: data.visitorTeam,
            localScore: data.localScore,
            visitorScore: data.visitorScore,
            // Dummy data for now
            localGoals: [
                { goleador: 'Iker Rando', minuto: "00'00\"" },
                { goleador: 'Marc Muñoz', minuto: "01'18\"" },
                { goleador: 'Salva', minuto: "02'12\"" },
                { goleador: 'Iker Rando', minuto: "25'05\"" },
            ],
            visitorGoals: [
                 { goleador: 'Dorsal 9', minuto: "01'54\"" }
            ],
            localStats: data.localPlayers?.map((p: any) => ({
                id: p.id,
                dorsal: p.number,
                nombre: p.name,
                goles: p.goals,
                amarillas: 0,
                rojas: 0,
                faltas: p.faltas,
                paradas: 0,
                golesContra: 0,
                vs1: 0
            })) || [],
             visitorStats: [
                {id: 'v1', dorsal: 9, nombre: 'Jugador Visitante', goles: 1, amarillas: 0, rojas: 0, faltas: 0, paradas: 0, golesContra: 0, vs1: 0}
             ],
        });
      } else {
        // Handle case where match is not found
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
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Historial
          </Button>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Editar Partido
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
                               {match.localGoals.map((goal, i) => (
                                <TableRow key={`local-goal-${i}`}>
                                    <TableCell>{goal.goleador}</TableCell>
                                    <TableCell className="text-right font-mono">{goal.minuto}</TableCell>
                                </TableRow>
                               ))}
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
                                    <TableHead>Dorsal</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Goles</TableHead>
                                    <TableHead>TA</TableHead>
                                    <TableHead>TR</TableHead>
                                    <TableHead>Faltas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {match.localStats.map(player => (
                                <TableRow key={player.id}>
                                    <TableCell>{player.dorsal}</TableCell>
                                    <TableCell>{player.nombre}</TableCell>
                                    <TableCell>{player.goles}</TableCell>
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
                                 {match.visitorGoals.map((goal, i) => (
                                <TableRow key={`visitor-goal-${i}`}>
                                    <TableCell>{goal.goleador}</TableCell>
                                    <TableCell className="text-right font-mono">{goal.minuto}</TableCell>
                                </TableRow>
                               ))}
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
                                    <TableHead>Dorsal</TableHead>
                                    <TableHead>Goles</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {match.visitorStats.map(player => (
                                <TableRow key={player.id}>
                                    <TableCell>{player.dorsal}</TableCell>
                                    <TableCell>{player.goles}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Tiros a Puerta</CardTitle></CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>1ªT</TableHead>
                                    <TableHead>2ªT</TableHead>
                                    <TableHead>Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               <TableRow>
                                    <TableCell>Portería</TableCell>
                                    <TableCell>0</TableCell>
                                    <TableCell>0</TableCell>
                                    <TableCell>0</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
            </div>
        </div>
    </div>
  );
}
