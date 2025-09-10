
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, writeBatch, increment, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Pause, RefreshCw, Settings, Minus, Plus, ArrowLeft, BarChartHorizontal, CheckCircle, Loader2, PlusCircle, Save, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


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
    gRec: number;
    vs1: number;
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
    localTeam: string;
    visitorTeam: string;
    localScore: number;
    visitorScore: number;
    timeLeft: number;
    period: '1ª Parte' | '2ª Parte' | 'Descanso';
    isActive: boolean;
    isFinished: boolean; 
    localPlayers?: Player[];
    visitorPlayers?: Player[];
    events: GoalEvent[];
}

type PlayerStatKeys = keyof Omit<Player, 'id' | 'name' | 'number'>;


export default function MarcadorEnVivoPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const matchRef = useRef(match);
  
  // Keep ref in sync with state
  useEffect(() => {
    matchRef.current = match;
  }, [match]);

   // Fetch Match Data
  useEffect(() => {
    if (!id) return;
    const matchDocRef = doc(db, 'matches', id);

    const unsubscribe = onSnapshot(matchDocRef, async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as Omit<MatchDetails, 'id'>;

            let localPlayers = data.localPlayers;
            let visitorPlayers = data.visitorPlayers;
            
             // Only fetch roster if players are not already in the match document
            if (data.teamId && (!localPlayers || localPlayers.length === 0)) {
                const teamDoc = await getDoc(doc(db, 'teams', data.teamId));
                if (teamDoc.exists()) {
                    const teamName = teamDoc.data().name;
                     if (teamName === data.localTeam) {
                        const playerQuery = query(collection(db, 'teams', data.teamId, 'players'), where('active', '==', true));
                        const playersSnapshot = await getDocs(playerQuery);
                        localPlayers = playersSnapshot.docs.map(d => ({
                            id: d.id, 
                            name: d.data().name, 
                            number: d.data().number,
                            goals: 0, assists: 0, faltas: 0, amarillas: 0, rojas: 0, paradas: 0, gRec: 0, vs1: 0,
                        })).sort((a, b) => a.number - b.number);
                     }
                }
            }
            
            setMatch({
                id: docSnap.id,
                ...data,
                localPlayers: localPlayers || [],
                visitorPlayers: visitorPlayers || [],
                timeLeft: data.timeLeft ?? 25 * 60,
                period: data.period ?? '1ª Parte',
                isActive: data.isActive ?? false,
                isFinished: data.isFinished ?? false,
                events: data.events || []
            });
        } else {
            toast({ title: "Error", description: "Partido no encontrado.", variant: "destructive" });
        }
        setLoading(false);
    });

    return () => unsubscribe();
}, [id, toast]);

  // Autosave timer
  useEffect(() => {
    const saveInterval = setInterval(async () => {
        const currentMatch = matchRef.current;
        if (currentMatch && !currentMatch.isFinished && !isSaving) {
            try {
                const matchDocRef = doc(db, 'matches', currentMatch.id);
                // Destructure to avoid sending the whole object if not needed
                const { id: matchId, ...dataToSave } = currentMatch;
                await updateDoc(matchDocRef, dataToSave);
                setShowSavedIndicator(true);
                setTimeout(() => setShowSavedIndicator(false), 2000);
            } catch (error) {
                console.error("Autosave failed: ", error);
            }
        }
    }, 5000); // 5 seconds

    return () => clearInterval(saveInterval);
  }, [isSaving]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (match?.isActive && match.timeLeft > 0 && !match.isFinished) {
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
  }, [match?.isActive, match?.timeLeft, match?.isFinished]);

 const finalizeMatch = async () => {
    if (!match || match.isFinished) return;
    setIsSaving(true);
    
    const localScore = match.localPlayers?.reduce((acc, p) => acc + (p.goals || 0), 0) || 0;
    const visitorScore = match.visitorPlayers?.reduce((acc, p) => acc + (p.goals || 0), 0) || 0;
    
    const dataToUpdate = {
        ...match,
        localScore,
        visitorScore,
        isFinished: true,
        isActive: false
    };
    
    try {
        const matchDocRef = doc(db, 'matches', id);
        const batch = writeBatch(db);
        
        batch.update(matchDocRef, dataToUpdate);

        if (match.teamId) { 
            const teamDoc = await getDoc(doc(db, 'teams', match.teamId));
            if (teamDoc.exists()) {
                const teamName = teamDoc.data()?.name;
                const isLocalTeam = teamName === match.localTeam;
                const userPlayers = isLocalTeam ? match.localPlayers : match.visitorPlayers;
                
                if (userPlayers) {
                    userPlayers.forEach(player => {
                        if (player.id && !player.id.startsWith('visitor-') && !player.id.startsWith('local-')) {
                            const playerRef = doc(db, 'teams', match.teamId, 'players', player.id);
                            batch.update(playerRef, {
                                pj: increment(1),
                                goals: increment(player.goals || 0),
                                assists: increment(player.assists || 0),
                                faltas: increment(player.faltas || 0),
                                ta: increment(player.amarillas || 0),
                                tr: increment(player.rojas || 0),
                                paradas: increment(player.paradas || 0),
                                gRec: increment(player.gRec || 0)
                            });
                        }
                    });
                }
            }
        }
        
        await batch.commit();

        toast({ title: "¡Partido Finalizado!", description: "Las estadísticas han sido guardadas y añadidas a los totales de los jugadores." });
        
        setMatch(prev => prev ? {...prev, isFinished: true, isActive: false} : null);

    } catch (error) {
        console.error("Error finalizing match:", error);
        toast({ title: "Error", description: "No se pudieron guardar los datos.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
}


 const handleStatChange = (team: 'local' | 'visitor', playerIndex: number, stat: PlayerStatKeys, delta: 1 | -1) => {
    if (match?.isFinished) return;
    setMatch(prev => {
        if (!prev) return null;

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

        if (stat === 'goals') {
             if (delta === 1 && prev.period !== 'Descanso') {
                const totalTime = 25 * 60;
                const timeElapsedInPeriod = totalTime - prev.timeLeft;
                let minute = Math.floor(timeElapsedInPeriod / 60);
                if (prev.period === '2ª Parte') {
                    minute += 25;
                }
                
                const goalEvent: GoalEvent = {
                    id: `goal-${player.id}-${Date.now()}`, // Unique ID
                    type: 'goal',
                    playerId: player.id,
                    playerName: player.name,
                    team: team,
                    minute: minute,
                    period: prev.period,
                    teamId: prev.teamId
                };
                newEvents.push(goalEvent);
            } else if (delta === -1) {
                // Find the last goal event for this player and remove it
                const lastGoalIndex = newEvents.findLastIndex(
                    (event) => event.type === 'goal' && event.playerId === player.id
                );
                if (lastGoalIndex > -1) {
                    newEvents.splice(lastGoalIndex, 1);
                }
            }
        }

        return { ...prev, [teamKey]: players, events: newEvents };
    });
}

  
   const handlePlayerInfoChange = (team: 'local' | 'visitor', playerIndex: number, field: 'name' | 'number', value: string | number) => {
        if (match?.isFinished) return;
        setMatch(prev => {
            if (!prev) return null;
            const teamKey = team === 'local' ? 'localPlayers' : 'visitorPlayers';
            if (!prev[teamKey]) return prev;
            
            const updatedPlayers = [...prev[teamKey]!];
            updatedPlayers[playerIndex] = { ...updatedPlayers[playerIndex], [field]: value };
            return { ...prev, [teamKey]: updatedPlayers };
        });
    };

    const addPlayer = (team: 'local' | 'visitor') => {
        if (match?.isFinished) return;
        setMatch(prev => {
            if (!prev) return prev;
            const newPlayer: Player = {
                id: `${team}-${Date.now()}`,
                name: 'Nuevo Jugador',
                number: 0,
                goals: 0, assists: 0, faltas: 0, amarillas: 0, rojas: 0, paradas: 0, gRec: 0, vs1: 0
            };
            const teamKey = team === 'local' ? 'localPlayers' : 'visitorPlayers';
            const players = [...(prev[teamKey] || []), newPlayer];
            return { ...prev, [teamKey]: players };
        });
    };

  const StatButtonCell = ({ team, playerIndex, stat }: { team: 'local' | 'visitor', playerIndex: number, stat: PlayerStatKeys }) => {
    const player = match?.[team === 'local' ? 'localPlayers' : 'visitorPlayers']?.[playerIndex];
    const value = player?.[stat] ?? 0;

    return (
        <TableCell className="text-center px-1">
            <div className="flex items-center justify-center gap-1">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatChange(team, playerIndex, stat, -1)} disabled={match?.isFinished}><Minus className="h-4 w-4"/></Button>
                <span className="w-4 text-center">{value}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatChange(team, playerIndex, stat, 1)} disabled={match?.isFinished}><Plus className="h-4 w-4"/></Button>
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
      if (match?.isFinished) return;
      setMatch(prev => prev ? {...prev, isActive: !prev.isActive } : null)
  }

  const handlePeriodChange = (period: '1ª Parte' | '2ª Parte') => {
      if (match?.isFinished) return;
      setMatch(prev => {
        if (!prev || prev.period === period) return prev;

        const resetStats = (players: Player[] | undefined) => {
            return players?.map(p => ({
                ...p,
                faltas: 0,
            }));
        }
        
        if (period === '2ª Parte' && prev.period === '1ª Parte') {
            return {
                ...prev,
                period,
                timeLeft: 25 * 60,
                isActive: false,
                localPlayers: resetStats(prev.localPlayers),
                visitorPlayers: resetStats(prev.visitorPlayers),
            };
        }
        
        return {...prev, period, timeLeft: 25 * 60, isActive: false };
      });
  }
  
  const resetTimer = () => {
    if (match?.isFinished) return;
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

  const renderTeamTable = (team: 'local' | 'visitor') => {
    const teamKey = team === 'local' ? 'localPlayers' : 'visitorPlayers';
    const players = match[teamKey] || [];

    return (
        <div className="mt-0">
            <div className={cn("p-2", team === 'local' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                <h3 className="font-bold text-center">JUGADORES - {team === 'local' ? match.localTeam : match.visitorTeam}</h3>
            </div>
            <div className="rounded-b-md border border-t-0 overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="px-2">Dorsal</TableHead>
                            <TableHead className="px-2 min-w-[150px]">Nombre</TableHead>
                            <TableHead className="text-center px-1">Goles</TableHead>
                            <TableHead className="text-center px-1">As</TableHead>
                            <TableHead className="text-center px-1">
                                <div className="inline-block w-4 h-5 bg-yellow-400 border border-black mx-auto"></div>
                            </TableHead>
                            <TableHead className="text-center px-1">
                                <div className="inline-block w-4 h-5 bg-red-600 border border-black mx-auto"></div>
                            </TableHead>
                            <TableHead className="text-center px-1">Faltas</TableHead>
                            <TableHead className="text-center px-1">Paradas</TableHead>
                            <TableHead className="text-center px-1">GC</TableHead>
                            <TableHead className="text-center px-1">1vs1</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {players.map((player, index) => (
                            <TableRow key={player.id}>
                                <TableCell className="px-2">
                                    <Input 
                                        className="h-8 w-14 text-center" 
                                        value={player.number} 
                                        onChange={(e) => handlePlayerInfoChange(team, index, 'number', parseInt(e.target.value) || 0)} 
                                        readOnly={match.isFinished || (!player.id.startsWith('visitor-') && !player.id.startsWith('local-'))} 
                                    />
                                </TableCell>
                                <TableCell className="px-2">
                                    <Input 
                                        className="h-8" 
                                        value={player.name} 
                                        onChange={(e) => handlePlayerInfoChange(team, index, 'name', e.target.value)} 
                                        readOnly={match.isFinished || (!player.id.startsWith('visitor-') && !player.id.startsWith('local-'))}
                                    />
                                </TableCell>
                                <StatButtonCell team={team} playerIndex={index} stat="goals" />
                                <StatButtonCell team={team} playerIndex={index} stat="assists" />
                                <StatButtonCell team={team} playerIndex={index} stat="amarillas" />
                                <StatButtonCell team={team} playerIndex={index} stat="rojas" />
                                <StatButtonCell team={team} playerIndex={index} stat="faltas" />
                                <StatButtonCell team={team} playerIndex={index} stat="paradas" />
                                <StatButtonCell team={team} playerIndex={index} stat="gRec" />
                                <StatButtonCell team={team} playerIndex={index} stat="vs1" />
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                
                {!match.isFinished && (
                    <div className="p-2 text-right">
                        <Button variant="outline" size="sm" onClick={() => addPlayer(team)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Jugador
                        </Button>
                    </div>
                )}
                
            </div>
        </div>
    );
};


  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BarChartHorizontal className="text-primary"/>
                    Marcador y Estadísticas en Vivo
                </h1>
                <p className="text-muted-foreground">Gestiona el partido en tiempo real. Los cambios se guardan automáticamente.</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                 {showSavedIndicator && (
                    <div className="flex items-center gap-2 text-sm text-green-600 transition-opacity duration-300">
                        <CheckCircle className="h-4 w-4" />
                        <span>Guardado</span>
                    </div>
                 )}
                 <Button asChild variant="outline">
                    <Link href={`/equipo/${match.teamId}/partidos`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Volver</span>
                    </Link>
                </Button>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive" disabled={isSaving || match.isFinished}>
                            {match.isFinished ? <Lock className="mr-2 h-4 w-4"/> : (isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> :<CheckCircle className="mr-2 h-4 w-4"/>)}
                            {match.isFinished ? 'Finalizado' : 'Finalizar'}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Finalizar y guardar estadísticas?</AlertDialogTitle>
                            <AlertDialogDescription>
                               Esta acción consolidará permanentemente las estadísticas del partido en los totales de tus jugadores. Una vez finalizado, el partido no se podrá volver a editar.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={finalizeMatch} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Sí, finalizar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>

        <Card>
            <CardContent className="p-4 md:p-6">
                 <div className="flex flex-col md:flex-row justify-around items-center w-full max-w-4xl mx-auto mb-6 text-center gap-4">
                    <h2 className="text-2xl font-bold w-full md:w-1/3">{match.localTeam}</h2>
                    <div className="text-5xl font-bold text-primary tabular-nums">
                        {localScore} - {visitorScore}
                    </div>
                    <h2 className="text-2xl font-bold w-full md:w-1/3">{match.visitorTeam}</h2>
                </div>
                 <div className="text-6xl font-mono font-bold my-4 text-center tabular-nums bg-gray-900 dark:bg-gray-800 text-white py-2 px-4 rounded-lg w-fit mx-auto">
                    {formatTime(match.timeLeft)}
                </div>
                <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                    <Button onClick={handleTimerToggle} disabled={match.timeLeft === 0 || match.isFinished}>
                        {match.isActive ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                        {match.isActive ? 'Pausar' : 'Iniciar'}
                    </Button>
                     <Button onClick={resetTimer} variant="outline" disabled={match.isFinished}>
                        <RefreshCw className="mr-2"/>
                        Reiniciar
                    </Button>
                    <div className="flex items-center rounded-md border p-1">
                        <Button onClick={() => handlePeriodChange('1ª Parte')} variant={match.period === '1ª Parte' ? 'secondary': 'ghost'} size="sm" disabled={match.isFinished}>1ª Parte</Button>
                        <Button onClick={() => handlePeriodChange('2ª Parte')} variant={match.period === '2ª Parte' ? 'secondary': 'ghost'} size="sm" disabled={match.isFinished}>2ª Parte</Button>
                    </div>
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
                {renderTeamTable('local')}
            </TabsContent>
            <TabsContent value="visitor" className="m-0">
                {renderTeamTable('visitor')}
            </TabsContent>
           </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
