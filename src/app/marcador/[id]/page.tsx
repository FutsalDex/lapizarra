
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Pause, RefreshCw, Settings, BarChartHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MatchDetails {
    localTeam: string;
    visitorTeam: string;
    localScore: number;
    visitorScore: number;
    // Add other fields as needed
}

export default function MarcadorEnVivoPage() {
  const params = useParams();
  const id = params.id as string;
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!id) return;
    const matchDocRef = doc(db, 'matches', id);
    const unsubscribe = onSnapshot(matchDocRef, (doc) => {
      if (doc.exists()) {
        setMatch(doc.data() as MatchDetails);
      } else {
        console.error("No such document!");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (!isActive && timeLeft !== 0) {
      if(interval) clearInterval(interval);
    }
    return () => {
        if(interval) clearInterval(interval)
    };
  }, [isActive, timeLeft]);


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
        <div className="container mx-auto max-w-7xl py-8 px-4">
            <Skeleton className="h-10 w-1/2 mx-auto mb-8" />
            <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-80 w-full mt-6" />
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!match) {
    return <div className="container mx-auto py-8 text-center">Partido no encontrado.</div>;
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
       <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">
                Marcador y Estadísticas en Vivo
            </h1>
            <p className="text-lg text-muted-foreground mt-1">
                Gestiona el partido en tiempo real.
            </p>
      </div>

      <Card>
        <CardContent className="p-6">
            {/* Scoreboard */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center justify-center">
                <div className="flex justify-between items-center w-full max-w-md">
                    <h2 className="text-2xl font-bold">{match.localTeam}</h2>
                    <div className="text-5xl font-bold text-primary tabular-nums">
                        {match.localScore} - {match.visitorScore}
                    </div>
                    <h2 className="text-2xl font-bold">{match.visitorTeam}</h2>
                </div>
                <div className="text-7xl font-mono font-bold my-4 text-center tabular-nums bg-gray-900 text-white py-4 px-6 rounded-lg">
                    {formatTime(timeLeft)}
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={() => setIsActive(!isActive)} size="lg">
                        {isActive ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                        {isActive ? 'Pausar' : 'Iniciar'}
                    </Button>
                     <Button onClick={() => { setIsActive(false); setTimeLeft(25*60) }} variant="outline" size="lg">
                        <RefreshCw className="mr-2"/>
                        Reiniciar
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Settings />
                    </Button>
                </div>
            </div>

            {/* Stats Table */}
            <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Estadísticas de Jugadores</h3>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Jugador</TableHead>
                                <TableHead className="text-center">Goles</TableHead>
                                <TableHead className="text-center">Asist.</TableHead>
                                <TableHead className="text-center">Faltas</TableHead>
                                <TableHead className="text-center">T. Amarilla</TableHead>
                                <TableHead className="text-center">T. Roja</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Placeholder Rows */}
                             {Array.from({length: 5}).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell>Jugador {index + 1}</TableCell>
                                    <TableCell className="text-center">0</TableCell>
                                    <TableCell className="text-center">0</TableCell>
                                    <TableCell className="text-center">0</TableCell>
                                    <TableCell className="text-center">0</TableCell>
                                    <TableCell className="text-center">0</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
