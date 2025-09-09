
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Pause, RefreshCw, Settings, Minus, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface Player {
    id: string;
    name: string;
    number: number;
    goals: number;
    assists: number;
    faltas: number;
}

interface MatchDetails {
    id: string;
    teamId: string;
    localTeam: string;
    visitorTeam: string;
    localScore: number;
    visitorScore: number;
    timeLeft: number;
    period: '1ª Parte' | '2ª Parte' | 'Descanso';
    isActive: boolean;
    localPlayers?: Player[];
    visitorPlayers?: Player[];
}


export default function MarcadorEnVivoPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-save logic
  const matchRef = useRef(match);
  useEffect(() => {
    matchRef.current = match;
  }, [match]);

  const saveMatchData = useCallback(async () => {
    if (matchRef.current) {
        const matchDocRef = doc(db, 'matches', id);
        // Avoid writing functions or very large objects if not needed
        const { id: matchId, ...dataToSave } = matchRef.current;
        await updateDoc(matchDocRef, dataToSave);
    }
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
        saveMatchData();
    }, 3000); // Autosave every 3 seconds

    return () => {
        clearInterval(interval);
        saveMatchData(); // Final save on component unmount
    }
  }, [saveMatchData]);


  // Match data and timer logic
  useEffect(() => {
    if (!id) return;
    const matchDocRef = doc(db, 'matches', id);

    const unsubscribe = onSnapshot(matchDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<MatchDetails, 'id'>;
        let localPlayers = data.localPlayers || [];
        
        // If local players are not stored in match, fetch them from team
        if (localPlayers.length === 0 && data.teamId) {
             const playersQuery = query(collection(db, 'teams', data.teamId, 'players'), where('active', '==', true));
             const playersSnapshot = await getDocs(playersQuery);
             localPlayers = playersSnapshot.docs.map(d => ({
                 id: d.id,
                 name: d.data().name,
                 number: d.data().number,
                 goals: 0,
                 assists: 0,
                 faltas: 0
             })).sort((a,b) => a.number - b.number);
        }

        setMatch({ 
            id: docSnap.id,
            ...data,
            timeLeft: data.timeLeft ?? 25 * 60,
            period: data.period ?? '1ª Parte',
            isActive: data.isActive ?? false,
            localPlayers,
            visitorPlayers: data.visitorPlayers || []
        });

      } else {
        toast({ title: "Error", description: "Partido no encontrado.", variant: "destructive"});
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id, toast]);
  

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (match?.isActive && match.timeLeft > 0) {
      interval = setInterval(() => {
        setMatch(prev => prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : null);
      }, 1000);
    }
    return () => {
        if(interval) clearInterval(interval)
    };
  }, [match?.isActive, match?.timeLeft]);

  const handleStatChange = (team: 'local' | 'visitor', playerIndex: number, stat: keyof Omit<Player, 'id' | 'name' | 'number'>, delta: 1 | -1) => {
      setMatch(prev => {
          if (!prev) return null;
          const teamKey = team === 'local' ? 'localPlayers' : 'visitorPlayers';
          const players = prev[teamKey] ? [...prev[teamKey]!] : [];
          if (!players[playerIndex]) return prev;

          const currentStatValue = players[playerIndex][stat];
          // Ensure stats don't go below 0
          if (delta === -1 && currentStatValue === 0) return prev;

          players[playerIndex] = { ...players[playerIndex], [stat]: currentStatValue + delta };

          // Also update total score if stat is 'goals'
          let newScore = prev[team === 'local' ? 'localScore' : 'visitorScore'];
          if (stat === 'goals') {
              newScore += delta;
          }

          return { 
              ...prev, 
              [teamKey]: players,
              [team === 'local' ? 'localScore' : 'visitorScore']: newScore
          };
      });
  }
  
  const toggleTimer = () => setMatch(prev => prev ? {...prev, isActive: !prev.isActive} : null);
  const resetTimer = () => setMatch(prev => prev ? {...prev, isActive: false, timeLeft: 25 * 60 } : null);
  const setPeriod = (period: MatchDetails['period']) => setMatch(prev => prev ? {...prev, period} : null);


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
                Gestiona el partido en tiempo real. Los cambios se guardan automáticamente.
            </p>
      </div>

      <Card>
        <CardContent className="p-6">
            {/* Scoreboard */}
            <div className="bg-card border rounded-lg p-6 flex flex-col items-center justify-center">
                <div className="flex justify-between items-center w-full max-w-2xl">
                    <h2 className="text-2xl font-bold text-center w-1/3">{match.localTeam}</h2>
                    <div className="text-5xl font-bold text-primary tabular-nums">
                        {match.localScore} - {match.visitorScore}
                    </div>
                    <h2 className="text-2xl font-bold text-center w-1/3">{match.visitorTeam}</h2>
                </div>
                 <div className="flex gap-2 my-4">
                    <Button onClick={() => setPeriod('1ª Parte')} variant={match.period === '1ª Parte' ? 'default' : 'outline'}>1ª Parte</Button>
                    <Button onClick={() => setPeriod('Descanso')} variant={match.period === 'Descanso' ? 'default' : 'outline'}>Descanso</Button>
                    <Button onClick={() => setPeriod('2ª Parte')} variant={match.period === '2ª Parte' ? 'default' : 'outline'}>2ª Parte</Button>
                </div>
                <div className="text-7xl font-mono font-bold my-4 text-center tabular-nums bg-gray-900 text-white py-4 px-6 rounded-lg">
                    {formatTime(match.timeLeft)}
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={toggleTimer} size="lg">
                        {match.isActive ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                        {match.isActive ? 'Pausar' : 'Iniciar'}
                    </Button>
                     <Button onClick={resetTimer} variant="outline" size="lg">
                        <RefreshCw className="mr-2"/>
                        Reiniciar
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Settings />
                    </Button>
                </div>
            </div>

            {/* Stats Table */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Local Team */}
                <div>
                    <h3 className="text-xl font-bold mb-4">{match.localTeam}</h3>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Jugador</TableHead>
                                    <TableHead className="text-center">Goles</TableHead>
                                    <TableHead className="text-center">Asist.</TableHead>
                                    <TableHead className="text-center">Faltas</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {match.localPlayers?.map((player, index) => (
                                    <TableRow key={player.id}>
                                        <TableCell>{player.number}</TableCell>
                                        <TableCell>{player.name}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatChange('local', index, 'goals', -1)}><Minus className="h-4 w-4"/></Button>
                                                {player.goals}
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatChange('local', index, 'goals', 1)}><Plus className="h-4 w-4"/></Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatChange('local', index, 'assists', -1)}><Minus className="h-4 w-4"/></Button>
                                                {player.assists}
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatChange('local', index, 'assists', 1)}><Plus className="h-4 w-4"/></Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatChange('local', index, 'faltas', -1)}><Minus className="h-4 w-4"/></Button>
                                                {player.faltas}
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatChange('local', index, 'faltas', 1)}><Plus className="h-4 w-4"/></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                 {/* Visitor Team */}
                 <div>
                    <h3 className="text-xl font-bold mb-4">{match.visitorTeam}</h3>
                    <div className="rounded-md border">
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Jugador</TableHead>
                                    <TableHead className="text-center">Goles</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                 {(match.visitorPlayers || []).map((player, index) => (
                                    <TableRow key={player.id || index}>
                                        <TableCell><Input className="h-8 w-14" value={player.number} /></TableCell>
                                        <TableCell><Input className="h-8" value={player.name} /></TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatChange('visitor', index, 'goals', -1)}><Minus className="h-4 w-4"/></Button>
                                                {player.goals}
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatChange('visitor', index, 'goals', 1)}><Plus className="h-4 w-4"/></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">
                                        <Button variant="outline" size="sm">Añadir jugador visitante</Button>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
