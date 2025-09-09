
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, writeBatch, increment, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Pause, RefreshCw, Settings, Minus, Plus, ArrowLeft, BarChartHorizontal, CheckCircle, Save, Loader2, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface Player {
    id: string;
    name: string;
    number: number;
    goals: number;
    assists: number;
    faltas: number;
    amarillas: number;
    rojas: number;
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
    localTeam: string;
    visitorTeam: string;
    localScore: number;
    visitorScore: number;
    timeLeft: number;
    period: '1ª Parte' | '2ª Parte' | 'Descanso';
    isActive: boolean;
    localPlayers?: Player[];
    visitorPlayers?: Player[];
    events: GoalEvent[];
}


export default function MarcadorEnVivoPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Auto-save logic
  const matchRef = useRef(match);
  useEffect(() => {
    matchRef.current = match;
    if (saveStatus !== 'saving') {
        setSaveStatus('unsaved');
    }
  }, [match, saveStatus]);

  const saveMatchData = useCallback(async (showToast = false, shouldExit = false) => {
    if (matchRef.current) {
        setSaveStatus('saving');
        const matchDocRef = doc(db, 'matches', id);
        
        const { id: matchId, ...matchData } = matchRef.current;

        const localScore = matchData.localPlayers?.reduce((acc, p) => acc + (p.goals || 0), 0) || 0;
        const visitorScore = matchData.visitorPlayers?.reduce((acc, p) => acc + (p.goals || 0), 0) || 0;
        
        await updateDoc(matchDocRef, {
            ...matchData,
            localScore,
            visitorScore,
        });
        
        if(matchData.localPlayers && showToast) { // Only update lifetime stats on explicit save
            const batch = writeBatch(db);
            matchData.localPlayers.forEach(player => {
                const playerRef = doc(db, 'teams', matchData.teamId, 'players', player.id);
                 batch.update(playerRef, {
                    pj: increment(1),
                    goals: increment(player.goals),
                    faltas: increment(player.faltas),
                    ta: increment(player.amarillas),
                    tr: increment(player.rojas),
                    paradas: increment(player.paradas),
                    gRec: increment(player.golesContra),
                    vs1: increment(player.vs1),
                 });
            });
            await batch.commit();
        }

        setSaveStatus('saved');
        if (showToast) {
            toast({ title: "Guardado", description: "Todos los cambios han sido guardados." });
        }
        if (shouldExit) {
            router.push(`/equipo/${matchRef.current.teamId}/partidos`);
        }
    }
  }, [id, toast, router]);

  useEffect(() => {
    const interval = setInterval(() => {
        if(saveStatus === 'unsaved') {
            saveMatchData();
        }
    }, 5000); // Autosave every 5 seconds

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (saveStatus === 'unsaved') {
            e.preventDefault();
            e.returnValue = ''; // For older browsers
            saveMatchData();
        }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        clearInterval(interval);
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [saveMatchData, saveStatus]);


  // Match data and timer logic
  useEffect(() => {
    if (!id) return;
    const matchDocRef = doc(db, 'matches', id);

    const unsubscribe = onSnapshot(matchDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<MatchDetails, 'id'>;
        let localPlayers = data.localPlayers || [];
        
        if (localPlayers.length === 0 && data.teamId) {
             const playersQuery = query(collection(db, 'teams', data.teamId, 'players'), where('active', '==', true));
             const playersSnapshot = await getDocs(playersQuery);
             localPlayers = playersSnapshot.docs.map(d => ({
                 id: d.id,
                 name: d.data().name,
                 number: d.data().number,
                 goals: 0,
                 assists: 0,
                 faltas: 0,
                 amarillas: 0,
                 rojas: 0,
                 paradas: 0,
                 golesContra: 0,
                 vs1: 0,
             })).sort((a,b) => a.number - b.number);
        }

        setMatch(prevMatch => ({ 
            ...(prevMatch || {}),
            id: docSnap.id,
            ...data,
            timeLeft: data.timeLeft ?? 25 * 60,
            period: data.period ?? '1ª Parte',
            isActive: data.isActive ?? false,
            localPlayers,
            visitorPlayers: data.visitorPlayers || [],
            events: data.events || []
        }));

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
        setMatch(prevMatch => {
          if (prevMatch && prevMatch.timeLeft > 0 && prevMatch.isActive) {
            return { ...prevMatch, timeLeft: prevMatch.timeLeft - 1 };
          }
          return prevMatch;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [match?.isActive, match?.timeLeft]);


 const handleStatChange = (team: 'local' | 'visitor', playerIndex: number, stat: keyof Omit<Player, 'id' | 'name' | 'assists' | 'number'>, delta: 1 | -1) => {
    setMatch(prev => {
        if (!prev || prev.period === 'Descanso') return prev;

        const teamKey = team === 'local' ? 'localPlayers' : 'visitorPlayers';
        const players = prev[teamKey] ? [...prev[teamKey]!] : [];
        const player = players[playerIndex];

        if (!player) return prev;

        const currentStatValue = player[stat];
        if (typeof currentStatValue !== 'number') return prev;
        
        const newValue = currentStatValue + delta;
        if (newValue < 0) return prev;

        players[playerIndex] = { ...player, [stat]: newValue };
        
        let newEvents = prev.events ? [...prev.events] : [];

        if (stat === 'goals' && delta === 1) {
            const totalTime = 25 * 60;
            const timeElapsedInPeriod = totalTime - prev.timeLeft;
            let minute = Math.floor(timeElapsedInPeriod / 60);
            if (prev.period === '2ª Parte') {
                minute += 25;
            }
            
            const goalEvent: GoalEvent = {
                type: 'goal',
                playerId: player.id,
                playerName: player.name,
                team: team,
                minute: minute,
                period: prev.period,
                teamId: team === 'local' ? prev.teamId : `visitor-${prev.id}`
            };
            newEvents.push(goalEvent);
        }

        return { ...prev, [teamKey]: players, events: newEvents };
    });
}

  
   const handleVisitorPlayerInfoChange = (playerIndex: number, field: 'name' | 'number', value: string | number) => {
        setMatch(prev => {
            if (!prev || !prev.visitorPlayers) return prev;
            const updatedPlayers = [...prev.visitorPlayers];
            updatedPlayers[playerIndex] = { ...updatedPlayers[playerIndex], [field]: value };
            return { ...prev, visitorPlayers: updatedPlayers };
        });
    };

    const addVisitorPlayer = () => {
        setMatch(prev => {
            if (!prev) return prev;
            const newPlayer: Player = {
                id: `visitor-${Date.now()}`,
                name: 'Nuevo Jugador',
                number: 0,
                goals: 0, assists: 0, faltas: 0, amarillas: 0, rojas: 0, paradas: 0, golesContra: 0, vs1: 0
            };
            const visitorPlayers = [...(prev.visitorPlayers || []), newPlayer];
            return { ...prev, visitorPlayers };
        });
    };

  const StatButtonCell = ({ team, playerIndex, stat }: { team: 'local' | 'visitor', playerIndex: number, stat: keyof Omit<Player, 'id' | 'name' | 'assists' | 'number' > }) => {
    const player = match?.[team === 'local' ? 'localPlayers' : 'visitorPlayers']?.[playerIndex];
    const value = player?.[stat] ?? 0;

    return (
        <TableCell className="text-center">
            <div className="flex items-center justify-center gap-1">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatChange(team, playerIndex, stat, -1)}><Minus className="h-4 w-4"/></Button>
                <span>{value}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatChange(team, playerIndex, stat, 1)}><Plus className="h-4 w-4"/></Button>
            </div>
        </TableCell>
    )
  }

   const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimerToggle = () => {
      setMatch(prev => prev ? {...prev, isActive: !prev.isActive } : null)
  }

  const handlePeriodChange = (period: '1ª Parte' | '2ª Parte') => {
      setMatch(prev => prev ? {...prev, period } : null);
  }
  
  const resetTimer = () => {
    setMatch(prev => prev ? {...prev, isActive: false, timeLeft: 25*60 } : null);
  }

  if (loading) {
    return (
        <div className="container mx-auto max-w-7xl py-8 px-4">
            <Skeleton className="h-10 w-1/2 mb-8" />
            <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-96 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!match) {
    return <div className="container mx-auto py-8 text-center">Partido no encontrado.</div>;
  }

  const localScore = match.localPlayers?.reduce((acc, p) => acc + p.goals, 0) || 0;
  const visitorScore = match.visitorPlayers?.reduce((acc, p) => acc + p.goals, 0) || 0;

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BarChartHorizontal className="text-primary"/>
                    Marcador y Estadísticas en Vivo
                </h1>
                <p className="text-muted-foreground">Gestiona el partido en tiempo real.</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {saveStatus === 'saving' && <><Loader2 className="h-4 w-4 animate-spin"/> Guardando...</>}
                    {saveStatus === 'saved' && <><CheckCircle className="h-4 w-4 text-green-500"/> Guardado</>}
                    {saveStatus === 'unsaved' && <><div className="h-3 w-3 rounded-full bg-yellow-500"/> Cambios sin guardar</>}
                </div>
                 <Button variant="outline" asChild>
                    <Link href={`/equipo/${match.teamId}/partidos`}>Cancelar</Link>
                </Button>
                <Button onClick={() => saveMatchData(true, true)}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar y Salir
                </Button>
            </div>
        </div>

        <Card>
            <CardContent className="p-4 md:p-6">
                 <div className="flex justify-around items-center w-full max-w-4xl mx-auto mb-6">
                    <h2 className="text-2xl font-bold text-center w-1/3">{match.localTeam}</h2>
                    <div className="text-5xl font-bold text-primary tabular-nums">
                        {localScore} - {visitorScore}
                    </div>
                    <h2 className="text-2xl font-bold text-center w-1/3">{match.visitorTeam}</h2>
                </div>
                 <div className="text-6xl font-mono font-bold my-4 text-center tabular-nums bg-gray-900 dark:bg-gray-800 text-white py-2 px-4 rounded-lg w-fit mx-auto">
                    {formatTime(match.timeLeft)}
                </div>
                <div className="flex items-center justify-center gap-4">
                    <Button onClick={handleTimerToggle} disabled={match.timeLeft === 0}>
                        {match.isActive ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                        {match.isActive ? 'Pausar' : 'Iniciar'}
                    </Button>
                     <Button onClick={resetTimer} variant="outline">
                        <RefreshCw className="mr-2"/>
                        Reiniciar
                    </Button>
                    <div className="flex items-center rounded-md border p-1">
                        <Button onClick={() => handlePeriodChange('1ª Parte')} variant={match.period === '1ª Parte' ? 'secondary': 'ghost'} size="sm">1ª Parte</Button>
                        <Button onClick={() => handlePeriodChange('2ª Parte')} variant={match.period === '2ª Parte' ? 'secondary': 'ghost'} size="sm">2ª Parte</Button>
                    </div>
                    <Button variant="ghost" size="icon">
                        <Settings />
                    </Button>
                </div>
            </CardContent>
        </Card>

      <Card>
        <CardContent className="p-0">
           <Tabs defaultValue="local">
            <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none">
                <TabsTrigger value="local">{match.localTeam}</TabsTrigger>
                <TabsTrigger value="visitor">{match.visitorTeam}</TabsTrigger>
            </TabsList>
            <TabsContent value="local" className="m-0">
                 <div className="mt-0">
                    <div className="bg-primary text-primary-foreground p-2">
                        <h3 className="font-bold text-center">JUGADORES - {match.localTeam}</h3>
                    </div>
                    <div className="rounded-b-md border border-t-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dorsal</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead className="text-center">Goles</TableHead>
                                    <TableHead className="text-center">
                                        <div className="inline-block w-4 h-5 bg-yellow-400 border border-black"></div>
                                    </TableHead>
                                     <TableHead className="text-center">
                                        <div className="inline-block w-4 h-5 bg-red-600 border border-black"></div>
                                    </TableHead>
                                    <TableHead className="text-center">Faltas</TableHead>
                                    <TableHead className="text-center">Paradas</TableHead>
                                    <TableHead className="text-center">G.C.</TableHead>
                                    <TableHead className="text-center">1vs1</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {match.localPlayers?.map((player, index) => (
                                    <TableRow key={player.id}>
                                        <TableCell><Input className="h-8 w-14 text-center" value={player.number} readOnly/></TableCell>
                                        <TableCell><Input className="h-8" value={player.name} readOnly /></TableCell>
                                        <StatButtonCell team="local" playerIndex={index} stat="goals" />
                                        <StatButtonCell team="local" playerIndex={index} stat="amarillas" />
                                        <StatButtonCell team="local" playerIndex={index} stat="rojas" />
                                        <StatButtonCell team="local" playerIndex={index} stat="faltas" />
                                        <StatButtonCell team="local" playerIndex={index} stat="paradas" />
                                        <StatButtonCell team="local" playerIndex={index} stat="golesContra" />
                                        <StatButtonCell team="local" playerIndex={index} stat="vs1" />
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="visitor" className="m-0">
                <div className="mt-0">
                    <div className="bg-muted text-muted-foreground p-2">
                        <h3 className="font-bold text-center">JUGADORES - {match.visitorTeam}</h3>
                    </div>
                     <div className="rounded-b-md border border-t-0">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dorsal</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead className="text-center">Goles</TableHead>
                                    <TableHead className="text-center">
                                        <div className="inline-block w-4 h-5 bg-yellow-400 border border-black"></div>
                                    </TableHead>
                                     <TableHead className="text-center">
                                        <div className="inline-block w-4 h-5 bg-red-600 border border-black"></div>
                                    </TableHead>
                                    <TableHead className="text-center">Faltas</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {match.visitorPlayers?.map((player, index) => (
                                    <TableRow key={player.id}>
                                        <TableCell><Input className="h-8 w-14 text-center" value={player.number} onChange={(e) => handleVisitorPlayerInfoChange(index, 'number', parseInt(e.target.value) || 0)} /></TableCell>
                                        <TableCell><Input className="h-8" value={player.name} onChange={(e) => handleVisitorPlayerInfoChange(index, 'name', e.target.value)} /></TableCell>
                                        <StatButtonCell team="visitor" playerIndex={index} stat="goals" />
                                        <StatButtonCell team="visitor" playerIndex={index} stat="amarillas" />
                                        <StatButtonCell team="visitor" playerIndex={index} stat="rojas" />
                                        <StatButtonCell team="visitor" playerIndex={index} stat="faltas" />
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="p-2 text-right">
                             <Button variant="outline" size="sm" onClick={addVisitorPlayer}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Añadir Jugador Visitante
                            </Button>
                        </div>
                     </div>
                </div>
            </TabsContent>
           </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
