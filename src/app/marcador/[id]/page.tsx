
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, writeBatch, increment, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Play, Pause, RefreshCw, Unlock, Minus, Plus, ArrowLeft, BarChartHorizontal, CheckCircle, Loader2, PlusCircle, Save, Lock, AlertOctagon, Crosshair, Clock } from 'lucide-react';
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
    amarillas: number;
    rojas: number;
    faltas: number;
    paradas: number;
    gRec: number;
    vs1: number;
    isPlaying: boolean; // New: To track if player is on court
    timeOnCourt: number;  // New: Total seconds played
    lastEntryTime: number; // New: Timestamp of last entry
    minutosJugados: number;
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

interface TeamMatchStats {
  shotsOnTarget: number;
  shotsOffTarget: number;
  shotsBlocked: number;
  timeouts: number;
  turnovers: number;
  recoveries: number;
}

interface OpponentTeamStats {
  goals: number;
  fouls: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  shotsBlocked: number;
  timeouts: number;
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
    userTeam: 'local' | 'visitor';
    localPlayers?: Player[];
    visitorPlayers?: Player[];
    events: GoalEvent[];
    teamStats1: TeamMatchStats; // 1st half for user's team
    teamStats2: TeamMatchStats; // 2nd half for user's team
    opponentStats1: OpponentTeamStats; // 1st half for opponent
    opponentStats2: OpponentTeamStats; // 2nd half for opponent
    localFouls: number;
    visitorFouls: number;
}

type PlayerStatKeys = keyof Omit<Player, 'id' | 'name' | 'number' | 'isPlaying' | 'timeOnCourt' | 'lastEntryTime'>;
type TeamStatKeys = keyof TeamMatchStats;
type OpponentStatKeys = keyof OpponentTeamStats;


export default function MarcadorEnVivoPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const matchRef = useRef(match);
  
  const isAdmin = user?.email === 'futsaldex@gmail.com';

  // Keep ref in sync with state
  useEffect(() => {
    matchRef.current = match;
  }, [match]);

   // Fetch Match Data
  useEffect(() => {
    if (!id) return;
    const matchDocRef = doc(db, 'matches', id);
    
    const defaultTeamStats: TeamMatchStats = {
      shotsOnTarget: 0, shotsOffTarget: 0, shotsBlocked: 0, timeouts: 0, turnovers: 0, recoveries: 0,
    };
    const defaultOpponentStats: OpponentTeamStats = {
      goals: 0, fouls: 0, shotsOnTarget: 0, shotsOffTarget: 0, shotsBlocked: 0, timeouts: 0,
    };

    const unsubscribe = onSnapshot(matchDocRef, async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as Omit<MatchDetails, 'id'>;

            let userTeam: 'local' | 'visitor' = 'local'; // default
            let teamPlayers: Player[] | undefined = data.localPlayers;

            if (data.teamId) {
                const teamDoc = await getDoc(doc(db, 'teams', data.teamId));
                if(teamDoc.exists()) {
                    const teamName = teamDoc.data().name;
                    if(teamName === data.visitorTeam) {
                        userTeam = 'visitor';
                        teamPlayers = data.visitorPlayers;
                    }
                    if (teamName === data.localTeam) {
                        userTeam = 'local';
                        teamPlayers = data.localPlayers;
                    }

                    if (!teamPlayers || teamPlayers.length === 0) {
                        const playerQuery = query(collection(db, 'teams', data.teamId, 'players'), where('active', '==', true));
                        const playersSnapshot = await getDocs(playerQuery);
                        teamPlayers = playersSnapshot.docs.map(d => ({
                            id: d.id, 
                            name: d.data().name, 
                            number: d.data().number,
                            goals: 0, assists: 0, faltas: 0, amarillas: 0, rojas: 0, paradas: 0, gRec: 0, vs1: 0,
                            isPlaying: false, timeOnCourt: 0, lastEntryTime: 0, minutosJugados: 0,
                        })).sort((a, b) => a.number - b.number);
                    } else {
                        // Ensure new fields exist
                        teamPlayers = teamPlayers.map(p => ({
                            ...p,
                            isPlaying: p.isPlaying || false,
                            timeOnCourt: p.timeOnCourt || 0,
                            lastEntryTime: p.lastEntryTime || 0,
                            minutosJugados: p.minutosJugados || 0,
                        }))
                    }
                }
            }

            const updatedMatch: MatchDetails = {
                id: docSnap.id,
                ...data,
                timeLeft: data.timeLeft ?? 25 * 60,
                period: data.period ?? '1ª Parte',
                isActive: data.isActive ?? false,
                isFinished: data.isFinished ?? false,
                events: data.events || [],
                teamStats1: { ...defaultTeamStats, ...data.teamStats1 },
                teamStats2: { ...defaultTeamStats, ...data.teamStats2 },
                opponentStats1: { ...defaultOpponentStats, ...data.opponentStats1 },
                opponentStats2: { ...defaultOpponentStats, ...data.opponentStats2 },
                localFouls: data.localFouls || 0,
                visitorFouls: data.visitorFouls || 0,
                userTeam: userTeam,
                localPlayers: userTeam === 'local' ? teamPlayers : [],
                visitorPlayers: userTeam === 'visitor' ? teamPlayers : [],
            }
            
            setMatch(updatedMatch);
        } else {
            toast({ title: "Error", description: "Partido no encontrado.", variant: "destructive" });
        }
        setLoading(false);
    });

    return () => unsubscribe();
}, [id, toast]);

    const updatePlayingTime = (matchState: MatchDetails): MatchDetails => {
        const playersKey = matchState.userTeam === 'local' ? 'localPlayers' : 'visitorPlayers';
        const players = matchState[playersKey];
        if (!players) return matchState;

        const updatedPlayers = players.map(p => {
            if (p.isPlaying && p.lastEntryTime > 0) {
                const timePlayed = p.lastEntryTime - matchState.timeLeft;
                return {
                    ...p,
                    timeOnCourt: p.timeOnCourt + timePlayed,
                    lastEntryTime: matchState.timeLeft, // Reset entry time to current time
                };
            }
            return p;
        });

        return { ...matchState, [playersKey]: updatedPlayers };
    };

  // Autosave timer
  useEffect(() => {
    const saveInterval = setInterval(async () => {
        let currentMatch = matchRef.current;
        if (currentMatch && !currentMatch.isFinished && !isSaving) {
            try {
                if (currentMatch.isActive) {
                    currentMatch = updatePlayingTime(currentMatch);
                }
                const matchDocRef = doc(db, 'matches', currentMatch.id);
                const { id: matchId, ...dataToSave } = currentMatch;
                await updateDoc(matchDocRef, dataToSave);
                setShowSavedIndicator(true);
                setTimeout(() => setShowSavedIndicator(false), 2000);
            } catch (error) {
                console.error("Autosave failed: ", error);
            }
        }
    }, 5000);

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
    if (!match || (match.isFinished && !isAdmin)) return;
    setIsSaving(true);
    
    let finalMatchState = updatePlayingTime(match);
    
    const userPlayers = finalMatchState.userTeam === 'local' ? finalMatchState.localPlayers : finalMatchState.visitorPlayers;
    const userTeamScore = userPlayers?.reduce((acc, p) => acc + (p.goals || 0), 0) || 0;
    
    if (finalMatchState.userTeam === 'local') {
      finalMatchState.localScore = userTeamScore;
    } else {
      finalMatchState.visitorScore = userTeamScore;
    }
    
    const dataToUpdate = {
        ...finalMatchState,
        isActive: false,
        isFinished: true,
    };
    
    try {
        const matchDocRef = doc(db, 'matches', id);
        const batch = writeBatch(db);
        
        batch.update(matchDocRef, dataToUpdate);

        if (finalMatchState.teamId && userPlayers) { 
             userPlayers.forEach(player => {
                if (player.id && !player.id.startsWith('local-') && !player.id.startsWith('visitor-')) {
                    const playerRef = doc(db, 'teams', finalMatchState.teamId, 'players', player.id);
                    batch.update(playerRef, {
                        pj: increment(1),
                        goals: increment(player.goals || 0),
                        assists: increment(player.assists || 0),
                        faltas: increment(player.faltas || 0),
                        ta: increment(player.amarillas || 0),
                        tr: increment(player.rojas || 0),
                        paradas: increment(player.paradas || 0),
                        gRec: increment(player.gRec || 0),
                        minutosJugados: increment(player.timeOnCourt || 0)
                    });
                }
            });
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

const reopenMatch = async () => {
    if (!match || !isAdmin) return;
    setIsSaving(true);
    try {
        const matchDocRef = doc(db, 'matches', id);
        const batch = writeBatch(db);

        // Revert player stats
        const userPlayers = match.userTeam === 'local' ? match.localPlayers : match.visitorPlayers;
        if (match.teamId && userPlayers) { 
            userPlayers.forEach(player => {
               if (player.id && !player.id.startsWith('local-') && !player.id.startsWith('visitor-')) {
                   const playerRef = doc(db, 'teams', match.teamId, 'players', player.id);
                   batch.update(playerRef, {
                       pj: increment(-1),
                       goals: increment(-(player.goals || 0)),
                       assists: increment(-(player.assists || 0)),
                       faltas: increment(-(player.faltas || 0)),
                       ta: increment(-(player.amarillas || 0)),
                       tr: increment(-(player.rojas || 0)),
                       paradas: increment(-(player.paradas || 0)),
                       gRec: increment(-(player.gRec || 0)),
                       minutosJugados: increment(-(player.timeOnCourt || 0))
                   });
               }
           });
       }
        
        batch.update(matchDocRef, { isFinished: false });
        await batch.commit();

        toast({ title: "Partido Reabierto", description: "Ahora puedes volver a editar el partido. Las estadísticas han sido revertidas." });
        setMatch(prev => prev ? {...prev, isFinished: false} : null);
    } catch (error) {
        console.error("Error reopening match:", error);
        toast({ title: "Error", description: "No se pudo reabrir el partido.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
};


 const handleStatChange = (playerIndex: number, stat: PlayerStatKeys, delta: 1 | -1) => {
    if (match?.isFinished && !isAdmin) return;
    setMatch(prev => {
        if (!prev) return null;

        const playersKey = prev.userTeam === 'local' ? 'localPlayers' : 'visitorPlayers';
        const players = prev[playersKey] ? [...prev[playersKey]!] : [];
        const player = players[playerIndex];

        if (!player) return prev;
        
        const currentStatValue = player[stat];
        if (typeof currentStatValue !== 'number') return prev;
        
        const newValue = currentStatValue + delta;
        if (newValue < 0) return prev;

        players[playerIndex] = { ...player, [stat]: newValue };
        
        let newEvents = prev.events ? [...prev.events] : [];
        
        const foulsKey = prev.userTeam === 'local' ? 'localFouls' : 'visitorFouls';
        let newFoulsCount = prev[foulsKey];

        if (stat === 'goals') {
             if (delta === 1 && prev.period !== 'Descanso') {
                const totalTime = 25 * 60;
                const timeElapsedInPeriod = totalTime - prev.timeLeft;
                let minute = Math.floor(timeElapsedInPeriod / 60);
                if (prev.period === '2ª Parte') {
                    minute += 25;
                }
                
                const goalEvent: GoalEvent = {
                    id: `goal-${player.id}-${Date.now()}`,
                    type: 'goal',
                    playerId: player.id,
                    playerName: player.name,
                    team: prev.userTeam,
                    minute: minute,
                    period: prev.period,
                    teamId: prev.teamId
                };
                newEvents.push(goalEvent);
            } else if (delta === -1) {
                const lastGoalIndex = newEvents.findLastIndex(
                    (event) => event.type === 'goal' && event.playerId === player.id
                );
                if (lastGoalIndex > -1) {
                    newEvents.splice(lastGoalIndex, 1);
                }
            }
        }
        
        if (stat === 'faltas') {
             newFoulsCount = Math.max(0, newFoulsCount + delta);
        }

        return { ...prev, [playersKey]: players, events: newEvents, [foulsKey]: newFoulsCount };
    });
}

  const handleTeamStatChange = (period: 'teamStats1' | 'teamStats2', stat: TeamStatKeys, delta: 1 | -1) => {
    if (match?.isFinished && !isAdmin) return;
    setMatch(prev => {
        if (!prev) return null;
        const currentStatValue = prev[period][stat];
        let newValue = currentStatValue + delta;

        if (stat === 'timeouts') {
            if (newValue > 1) newValue = 1;
            if (newValue < 0) newValue = 0;
        } else {
            if (newValue < 0) return prev;
        }

        return { ...prev, [period]: { ...prev[period], [stat]: newValue } };
    });
  };

  const handleOpponentStatChange = (period: 'opponentStats1' | 'opponentStats2', stat: OpponentStatKeys, delta: 1 | -1) => {
    if (match?.isFinished && !isAdmin) return;
    setMatch(prev => {
        if (!prev) return null;

        const currentStatValue = prev[period][stat] || 0;
        let newValue = currentStatValue + delta;
        
        if (stat === 'timeouts') {
            if (newValue > 1) newValue = 1;
            if (newValue < 0) newValue = 0;
        } else {
            if (newValue < 0) return prev;
        }
        
        const opponentTeam = prev.userTeam === 'local' ? 'visitor' : 'local';
        const foulsKey = opponentTeam === 'local' ? 'localFouls' : 'visitorFouls';
        let newFoulsCount = prev[foulsKey];

        if (stat === 'fouls') {
            newFoulsCount = Math.max(0, newFoulsCount + delta);
        }
        
        const scoreKey = opponentTeam === 'local' ? 'localScore' : 'visitorScore';
        let newScore = prev[scoreKey];
        let newEvents = prev.events ? [...prev.events] : [];
        if (stat === 'goals') {
            newScore = Math.max(0, newScore + delta);
             if (delta === 1 && prev.period !== 'Descanso') {
                const totalTime = 25 * 60;
                const timeElapsedInPeriod = totalTime - prev.timeLeft;
                let minute = Math.floor(timeElapsedInPeriod / 60);
                if (prev.period === '2ª Parte') minute += 25;
                
                const goalEvent: GoalEvent = {
                    id: `goal-opponent-${Date.now()}`,
                    type: 'goal',
                    playerId: 'opponent',
                    playerName: 'Rival',
                    team: opponentTeam,
                    minute: minute,
                    period: prev.period,
                    teamId: prev.teamId,
                };
                newEvents.push(goalEvent);
            } else if (delta === -1) {
                const lastOpponentGoalIndex = newEvents.findLastIndex(
                    (event) => event.type === 'goal' && event.team === opponentTeam
                );
                if (lastOpponentGoalIndex > -1) {
                    newEvents.splice(lastOpponentGoalIndex, 1);
                }
            }
        }

        return {
            ...prev,
            [period]: { ...prev[period], [stat]: newValue },
            [foulsKey]: newFoulsCount,
            [scoreKey]: newScore,
            events: newEvents,
        };
    });
  };

   const handlePlayerInfoChange = (playerIndex: number, field: 'name' | 'number', value: string | number) => {
        if (match?.isFinished && !isAdmin) return;
        setMatch(prev => {
            if (!prev) return null;
            const playersKey = prev.userTeam === 'local' ? 'localPlayers' : 'visitorPlayers';
            if (!prev[playersKey]) return prev;
            
            const updatedPlayers = [...prev[playersKey]!];
            updatedPlayers[playerIndex] = { ...updatedPlayers[playerIndex], [field]: value };
            return { ...prev, [playersKey]: updatedPlayers };
        });
    };

    const addPlayer = () => {
        if (match?.isFinished && !isAdmin) return;
        setMatch(prev => {
            if (!prev) return prev;
            const playersKey = prev.userTeam === 'local' ? 'localPlayers' : 'visitorPlayers';
            const newPlayer: Player = {
                id: `${prev.userTeam}-${Date.now()}`,
                name: 'Nuevo Jugador',
                number: 0,
                goals: 0, assists: 0, faltas: 0, amarillas: 0, rojas: 0, paradas: 0, gRec: 0, vs1: 0,
                isPlaying: false, timeOnCourt: 0, lastEntryTime: 0, minutosJugados: 0,
            };
            const players = [...(prev[playersKey] || []), newPlayer];
            return { ...prev, [playersKey]: players };
        });
    };

    const handleTogglePlay = (playerIndex: number) => {
        if (match?.isFinished && !isAdmin) return;
        setMatch(prev => {
            if (!prev) return null;
            const playersKey = prev.userTeam === 'local' ? 'localPlayers' : 'visitorPlayers';
            const players = prev[playersKey] ? [...prev[playersKey]!] : [];
            const player = { ...players[playerIndex] };

            if (player.isPlaying) {
                // Player is stopping
                const timePlayed = Math.max(0, player.lastEntryTime - prev.timeLeft);
                player.timeOnCourt += timePlayed;
                player.isPlaying = false;
                player.lastEntryTime = 0;
            } else {
                // Player is starting
                player.isPlaying = true;
                player.lastEntryTime = prev.timeLeft;
            }
            players[playerIndex] = player;
            return { ...prev, [playersKey]: players };
        });
    };

  const StatButtonCell = ({ playerIndex, stat }: { playerIndex: number, stat: PlayerStatKeys }) => {
    const players = match?.userTeam === 'local' ? match.localPlayers : match.visitorPlayers;
    const player = players?.[playerIndex];
    const value = player?.[stat] ?? 0;

    return (
        <TableCell className="text-center px-1">
            <div className="flex items-center justify-center gap-0 sm:gap-1">
                <Button size="icon" variant="ghost" className="h-6 w-6 sm:h-6 sm:w-6" onClick={() => handleStatChange(playerIndex, stat, -1)} disabled={match?.isFinished && !isAdmin}><Minus className="h-4 w-4"/></Button>
                <span className="w-4 text-center text-sm sm:text-base">{value}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 sm:h-6 sm:w-6" onClick={() => handleStatChange(playerIndex, stat, 1)} disabled={match?.isFinished && !isAdmin}><Plus className="h-4 w-4"/></Button>
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
    if (match?.isFinished && !isAdmin) return;
    setMatch(prev => {
        if (!prev) return null;

        let newState = {...prev};

        // When pausing, update time for all playing players
        if (newState.isActive) {
            newState = updatePlayingTime(newState);
            newState.isActive = false;
        } else {
             // When starting, set entry time for all playing players
            const playersKey = newState.userTeam === 'local' ? 'localPlayers' : 'visitorPlayers';
            const players = newState[playersKey];
            if (players) {
                const updatedPlayers = players.map(p => p.isPlaying ? { ...p, lastEntryTime: newState.timeLeft } : p);
                newState = { ...newState, [playersKey]: updatedPlayers };
            }
            newState.isActive = true;
        }

        return newState;
    });
  }

  const handlePeriodChange = (newPeriod: '1ª Parte' | '2ª Parte') => {
      if (match?.isFinished && !isAdmin) return;
      setMatch(prev => {
        if (!prev || prev.period === newPeriod) return prev;
        
        const updatedState = updatePlayingTime(prev);

        return {
            ...updatedState,
            period: newPeriod,
            timeLeft: 25 * 60,
            isActive: false,
            localFouls: 0,
            visitorFouls: 0,
            teamStats1: { ...updatedState.teamStats1, timeouts: 0},
            teamStats2: { ...updatedState.teamStats2, timeouts: 0},
            opponentStats1: { ...updatedState.opponentStats1, timeouts: 0},
            opponentStats2: { ...updatedState.opponentStats2, timeouts: 0},
        };
      });
  }
  
  const resetTimer = () => {
    if (match?.isFinished && !isAdmin) return;
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
  
  const userPlayers = match.userTeam === 'local' ? match.localPlayers : match.visitorPlayers;
  const userTeamScore = userPlayers?.reduce((acc, p) => acc + (p.goals || 0), 0) || 0;
  const opponentTeam = match.userTeam === 'local' ? 'visitor' : 'local';
  const opponentScore = match[opponentTeam === 'local' ? 'localScore' : 'visitorScore'];
  
  const localScore = match.userTeam === 'local' ? userTeamScore : opponentScore;
  const visitorScore = match.userTeam === 'visitor' ? userTeamScore : opponentScore;

  const opponentPeriodKey = match.period === '1ª Parte' ? 'opponentStats1' : 'opponentStats2';

  const StatColumnHeader = ({ full, abbr, isIcon=false, iconContent }: { full: string, abbr: string, isIcon?: boolean, iconContent?: React.ReactNode }) => (
    <TableHead className="text-center px-1">
        {isIcon ? (
            <div className="inline-block w-4 h-5 border border-black mx-auto" style={{backgroundColor: full}}>{iconContent}</div>
        ) : (
            <>
                <span className="hidden sm:inline">{full}</span>
                <span className="sm:hidden">{abbr}</span>
            </>
        )}
    </TableHead>
  );

  const tableHeaders = (
    <TableRow>
        <TableHead className="sticky left-0 bg-background/95 z-20 px-2 min-w-[70px]">Dorsal</TableHead>
        <TableHead className="sticky left-[70px] bg-background/95 z-20 px-2 min-w-[200px]">Nombre</TableHead>
        <StatColumnHeader full="Goles" abbr="G" />
        <StatColumnHeader full="Asist." abbr="As" />
        <StatColumnHeader full="yellow" abbr="" isIcon />
        <StatColumnHeader full="red" abbr="" isIcon />
        <StatColumnHeader full="Faltas" abbr="F" />
        <StatColumnHeader full="Paradas" abbr="P" />
        <StatColumnHeader full="GC" abbr="GC" />
        <StatColumnHeader full="1vs1" abbr="1vs1" />
    </TableRow>
  )
  
  const renderTeamTable = (isUserTeam: boolean) => {
    if (!isUserTeam) {
        return renderOpponentStats();
    }

    const players = userPlayers || [];

    return (
        <div className="space-y-6">
            <div className="mt-0">
                <div className="p-2 bg-primary text-primary-foreground">
                    <h3 className="font-bold text-center">JUGADORES - {match.userTeam === 'local' ? match.localTeam : match.visitorTeam}</h3>
                </div>
                <div className="rounded-b-md border border-t-0 overflow-x-auto">
                    <Table>
                        <TableHeader className="[&_tr]:border-b-0">
                            {tableHeaders}
                        </TableHeader>
                        <TableBody>
                            {players.map((player, index) => (
                                <TableRow key={player.id}>
                                    <TableCell className="sticky left-0 bg-background/95 z-10 px-2">
                                        <Input 
                                            className="h-8 w-14 text-center" 
                                            value={player.number} 
                                            onChange={(e) => handlePlayerInfoChange(index, 'number', parseInt(e.target.value) || 0)} 
                                            readOnly={(match.isFinished && !isAdmin) || (!player.id.startsWith('local-') && !player.id.startsWith('visitor-'))} 
                                        />
                                    </TableCell>
                                    <TableCell className="sticky left-[70px] bg-background/95 z-10 px-2 flex items-center gap-2">
                                        <Input 
                                            className={cn("h-8 flex-grow", player.isPlaying && "bg-green-100 dark:bg-green-900/30")} 
                                            value={player.name} 
                                            onClick={() => handleTogglePlay(index)}
                                            readOnly
                                        />
                                        <div className="flex items-center gap-1 text-xs p-1 rounded-md bg-muted text-muted-foreground w-20 justify-center">
                                            <Clock className="h-3 w-3" />
                                            <span>{formatTime(player.timeOnCourt)}</span>
                                        </div>
                                    </TableCell>
                                    <StatButtonCell playerIndex={index} stat="goals" />
                                    <StatButtonCell playerIndex={index} stat="assists" />
                                    <StatButtonCell playerIndex={index} stat="amarillas" />
                                    <StatButtonCell playerIndex={index} stat="rojas" />
                                    <StatButtonCell playerIndex={index} stat="faltas" />
                                    <StatButtonCell playerIndex={index} stat="paradas" />
                                    <StatButtonCell playerIndex={index} stat="gRec" />
                                    <StatButtonCell playerIndex={index} stat="vs1" />
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter className="bg-secondary/50">
                            {tableHeaders}
                        </TableFooter>
                    </Table>
                    
                    {(!match.isFinished || isAdmin) && (
                        <div className="p-2 text-right">
                            <Button variant="outline" size="sm" onClick={addPlayer}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Añadir Jugador
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            {renderTeamStats()}
        </div>
    );
};

const renderOpponentStats = () => {
    const opponentStatsConfig: { key: OpponentStatKeys, label: string }[] = [
        { key: 'goals', label: 'Goles' },
        { key: 'fouls', label: 'Faltas' },
        { key: 'shotsOnTarget', label: 'Tiros a Puerta' },
        { key: 'shotsOffTarget', label: 'Tiros Fuera' },
        { key: 'shotsBlocked', label: 'Tiros Bloqueados' },
        { key: 'timeouts', label: 'Tiempos Muertos' },
    ];
    
    return (
        <Card>
            <CardHeader className="bg-muted p-3">
                <CardTitle className="text-base text-center">ESTADÍSTICAS DEL RIVAL - {opponentTeam === 'local' ? match.localTeam : match.visitorTeam}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableBody>
                         {opponentStatsConfig.map((config) => (
                            <TableRow key={config.key}>
                                <TableCell className="font-medium">{config.label}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleOpponentStatChange(opponentPeriodKey, config.key, -1)} disabled={match?.isFinished && !isAdmin}><Minus className="h-4 w-4"/></Button>
                                        <span className="w-4 text-center">{match[opponentPeriodKey][config.key] ?? 0}</span>
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleOpponentStatChange(opponentPeriodKey, config.key, 1)} disabled={match?.isFinished && !isAdmin}><Plus className="h-4 w-4"/></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

const renderTeamStats = () => {
    const teamStatsConfig: { key: TeamStatKeys, label: string }[] = [
        { key: 'shotsOnTarget', label: 'Portería' },
        { key: 'shotsOffTarget', label: 'Fuera' },
        { key: 'shotsBlocked', label: 'Bloqueados' },
    ];
     const eventsConfig: { key: TeamStatKeys, label: string }[] = [
        { key: 'timeouts', label: 'Tiempos Muertos' },
        { key: 'turnovers', label: 'Pérdidas' },
        { key: 'recoveries', label: 'Robos' },
    ];

    const StatRow = ({ statKey, label, periodKey }: { statKey: TeamStatKeys, label: string, periodKey: 'teamStats1' | 'teamStats2' }) => (
        <TableRow>
            <TableCell className="font-medium">{label}</TableCell>
            <TableCell>
                <div className="flex items-center justify-center gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleTeamStatChange(periodKey, statKey, -1)} disabled={match?.isFinished && !isAdmin}><Minus className="h-4 w-4"/></Button>
                    <span className="w-4 text-center">{match[periodKey][statKey]}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleTeamStatChange(periodKey, statKey, 1)} disabled={match?.isFinished && !isAdmin}><Plus className="h-4 w-4"/></Button>
                </div>
            </TableCell>
        </TableRow>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
                <CardHeader className="bg-primary text-primary-foreground p-3">
                    <CardTitle className="text-base text-center">TIROS A PUERTA - {match.userTeam === 'local' ? match.localTeam : match.visitorTeam}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">Tipo</TableHead>
                                <TableHead className="text-center">{match.period}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamStatsConfig.map((config) => <StatRow key={config.key} statKey={config.key} label={config.label} periodKey={match.period === '1ª Parte' ? 'teamStats1' : 'teamStats2'} />)}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="bg-primary text-primary-foreground p-3">
                    <CardTitle className="text-base text-center">EVENTOS DEL PARTIDO - {match.userTeam === 'local' ? match.localTeam : match.visitorTeam}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">Tipo</TableHead>
                                <TableHead className="text-center">{match.period}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {eventsConfig.map((config) => <StatRow key={config.key} statKey={config.key} label={config.label} periodKey={match.period === '1ª Parte' ? 'teamStats1' : 'teamStats2'} />)}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

 const FoulsIndicator = ({ count }: { count: number }) => (
    <div className="flex items-center justify-center gap-1.5 mt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-3 w-3 rounded-full border-2 border-red-500',
            i < count ? 'bg-red-500' : 'bg-transparent'
          )}
        />
      ))}
    </div>
  );

  const TimeoutIndicator = ({ used }: { used: boolean }) => (
      <div className={cn(
          "flex items-center justify-center w-10 h-10 border-2 border-primary rounded-md",
          used ? "bg-primary text-primary-foreground" : "bg-transparent text-primary"
      )}>
          <span className="font-bold text-sm">TM</span>
      </div>
  );

  const currentPeriodKey = match.period === '1ª Parte' ? '1' : '2';
  const localTimeoutUsed = (match.userTeam === 'local' && match[`teamStats${currentPeriodKey}` as 'teamStats1' | 'teamStats2'].timeouts > 0) || (match.userTeam === 'visitor' && match[`opponentStats${currentPeriodKey}` as 'opponentStats1' | 'opponentStats2'].timeouts > 0);
  const visitorTimeoutUsed = (match.userTeam === 'visitor' && match[`teamStats${currentPeriodKey}` as 'teamStats1' | 'teamStats2'].timeouts > 0) || (match.userTeam === 'local' && match[`opponentStats${currentPeriodKey}` as 'opponentStats1' | 'opponentStats2'].timeouts > 0);


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
                {isAdmin && match.isFinished ? (
                    <Button variant="secondary" onClick={reopenMatch} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> :<Unlock className="mr-2 h-4 w-4"/>}
                        Reabrir Partido
                    </Button>
                 ) : (
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
                 )}
            </div>
        </div>

        <Card>
             <CardContent className="p-4 md:p-6 text-center space-y-4">
                 <div className="grid grid-cols-3 items-center w-full max-w-4xl mx-auto">
                    <div className="flex flex-col items-center">
                        <h2 className="text-lg md:text-2xl font-bold w-full truncate text-center">{match.localTeam}</h2>
                        <FoulsIndicator count={match.localFouls} />
                    </div>
                    <div className="text-3xl md:text-5xl font-bold text-primary tabular-nums text-center">
                        {localScore} - {visitorScore}
                    </div>
                    <div className="flex flex-col items-center">
                        <h2 className="text-lg md:text-2xl font-bold w-full truncate text-center">{match.visitorTeam}</h2>
                        <FoulsIndicator count={match.visitorFouls} />
                    </div>
                </div>

                <div className="flex items-center justify-center">
                    <TimeoutIndicator used={localTimeoutUsed} />
                    <div className="text-5xl md:text-6xl font-mono font-bold text-center tabular-nums bg-gray-900 dark:bg-gray-800 text-white py-2 px-4 rounded-lg mx-4">
                        {formatTime(match.timeLeft)}
                    </div>
                    <TimeoutIndicator used={visitorTimeoutUsed} />
                </div>


                <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                    <Button onClick={handleTimerToggle} disabled={match.timeLeft === 0 || (match.isFinished && !isAdmin)}>
                        {match.isActive ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                        {match.isActive ? 'Pausar' : 'Iniciar'}
                    </Button>
                     <Button onClick={resetTimer} variant="outline" disabled={match.isFinished && !isAdmin}>
                        <RefreshCw className="mr-2"/>
                        Reiniciar
                    </Button>
                    <div className="flex items-center rounded-md border p-1">
                        <Button onClick={() => handlePeriodChange('1ª Parte')} variant={match.period === '1ª Parte' ? 'secondary': 'ghost'} size="sm" disabled={match.isFinished && !isAdmin}>1ª Parte</Button>
                        <Button onClick={() => handlePeriodChange('2ª Parte')} variant={match.period === '2ª Parte' ? 'secondary': 'ghost'} size="sm" disabled={match.isFinished && !isAdmin}>2ª Parte</Button>
                    </div>
                </div>
                
            </CardContent>
        </Card>

      <Card>
        <CardContent className="p-0">
           <Tabs defaultValue={match.userTeam}>
            <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none">
                <TabsTrigger value="local">{match.localTeam}</TabsTrigger>
                <TabsTrigger value="visitor">{match.visitorTeam}</TabsTrigger>
            </TabsList>
            <TabsContent value="local" className="m-0 p-4">
                {renderTeamTable(match.userTeam === 'local')}
            </TabsContent>
            <TabsContent value="visitor" className="p-4 m-0">
                {renderTeamTable(match.userTeam === 'visitor')}
            </TabsContent>
           </Tabs>
        </CardContent>
      </Card>
      
    </div>
  );
}
