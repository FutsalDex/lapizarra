
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, writeBatch, increment, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Play, Pause, RefreshCw, Unlock, Minus, Plus, ArrowLeft, BarChartHorizontal, CheckCircle, Loader2, PlusCircle, Save, Lock, AlertOctagon, Crosshair, Clock, Goal as GoalIcon, Shield as ShieldIcon, Shuffle, RotateCcw, Hand, ShieldOff } from 'lucide-react';
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
  // shotsBlocked is removed as per user request
  timeouts: number;
  turnovers: number;
  recoveries: number;
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
    localPlayers: Player[];
    visitorPlayers: Player[];
    events: GoalEvent[];
    teamStats1: TeamMatchStats; // 1st half for user's team
    teamStats2: TeamMatchStats; // 2nd half for user's team
    opponentStats1: OpponentTeamStats; // 1st half for opponent
    opponentStats2: OpponentTeamStats; // 2nd half for opponent
    localFouls: number;
    visitorFouls: number;
    endTime?: number | null; // Timestamp for when the timer should end
}

type PlayerStatKeys = keyof Omit<Player, 'id' | 'name' | 'number' | 'isPlaying' | 'timeOnCourt' | 'lastEntryTime'>;
type OpponentStatKeys = keyof Omit<OpponentTeamStats, 'goals'>;


export default function MarcadorEnVivoPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, db } = useAuth();
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
    if (!id || !db) return;
    const matchDocRef = doc(db, 'matches', id);
    
    const defaultTeamStats: TeamMatchStats = {
      shotsOnTarget: 0, shotsOffTarget: 0, shotsBlocked: 0, timeouts: 0, turnovers: 0, recoveries: 0,
    };
    const defaultOpponentStats: OpponentTeamStats = {
      goals: 0, fouls: 0, shotsOnTarget: 0, shotsOffTarget: 0, timeouts: 0, turnovers: 0, recoveries: 0
    };

    const unsubscribe = onSnapshot(matchDocRef, async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as Omit<MatchDetails, 'id'>;

            let userTeam: 'local' | 'visitor' = 'local'; // default
            
            if (data.teamId) {
                const teamDoc = await getDoc(doc(db, 'teams', data.teamId));
                if(teamDoc.exists()) {
                    const teamName = teamDoc.data().name;
                    if(teamName === data.visitorTeam) {
                        userTeam = 'visitor';
                    }
                    if (teamName === data.localTeam) {
                        userTeam = 'local';
                    }
                }
            }

            const ensurePlayersArray = (players: Player[] | undefined): Player[] => {
                if (!players) return [];
                const defaultPlayerStats = {
                    goals: 0, assists: 0, faltas: 0, amarillas: 0, rojas: 0, paradas: 0, gRec: 0, vs1: 0,
                    isPlaying: false, timeOnCourt: 0, lastEntryTime: 0, minutosJugados: 0,
                    tirosPuerta: 0, tirosFuera: 0, recuperaciones: 0, perdidas: 0,
                };
                return players.map(p => ({ ...defaultPlayerStats, ...p }));
            }

            const updatedMatch: MatchDetails = {
                id: docSnap.id,
                ...data,
                timeLeft: data.timeLeft ?? 25 * 60,
                period: data.period ?? '1ª Parte',
                isActive: data.isActive ?? false,
                isFinished: data.isFinished ?? false,
                events: data.events || [],
                teamStats1: { ...defaultTeamStats, ...(data.teamStats1 || {}) },
                teamStats2: { ...defaultTeamStats, ...(data.teamStats2 || {}) },
                opponentStats1: { ...defaultOpponentStats, ...(data.opponentStats1 || {}) },
                opponentStats2: { ...defaultOpponentStats, ...(data.opponentStats2 || {}) },
                localFouls: data.localFouls || 0,
                visitorFouls: data.visitorFouls || 0,
                userTeam: userTeam,
                localPlayers: ensurePlayersArray(data.localPlayers),
                visitorPlayers: ensurePlayersArray(data.visitorPlayers),
            }
            
            setMatch(updatedMatch);
        } else {
            toast({ title: "Error", description: "Partido no encontrado.", variant: "destructive" });
        }
        setLoading(false);
    });

    return () => unsubscribe();
}, [id, toast, db]);


  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (match?.isActive && !match.isFinished) {
      interval = setInterval(() => {
        setMatch(prevMatch => {
          if (!prevMatch || !prevMatch.isActive || !prevMatch.endTime) {
            return prevMatch;
          }
          const newTimeLeft = Math.round((prevMatch.endTime - Date.now()) / 1000);
          if (newTimeLeft <= 0) {
            return { ...prevMatch, timeLeft: 0, isActive: false, endTime: null };
          }
          return { ...prevMatch, timeLeft: newTimeLeft };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [match?.isActive, match?.isFinished]);

   // Handle visibility change to correct timer drift
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && matchRef.current?.isActive) {
                setMatch(prevMatch => {
                    if (!prevMatch || !prevMatch.isActive || !prevMatch.endTime) {
                       return prevMatch;
                    }
                    const newTimeLeft = Math.round((prevMatch.endTime - Date.now()) / 1000);
                    if (newTimeLeft <= 0) {
                        return { ...prevMatch, timeLeft: 0, isActive: false, endTime: null };
                    }
                    return { ...prevMatch, timeLeft: newTimeLeft };
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const updateAllPlayingTimes = (currentMatch: MatchDetails): MatchDetails => {
        const now = Date.now();
        const newTimeLeft = currentMatch.endTime ? Math.max(0, Math.round((currentMatch.endTime - now) / 1000)) : currentMatch.timeLeft;

        const playersKey = currentMatch.userTeam === 'local' ? 'localPlayers' : 'visitorPlayers';
        const players = currentMatch[playersKey] ? [...currentMatch[playersKey]!] : [];

        const updatedPlayers = players.map(player => {
            if (player.isPlaying && player.lastEntryTime) {
                const timePlayedInStint = Math.max(0, player.lastEntryTime - newTimeLeft);
                return {
                    ...player,
                    timeOnCourt: (player.timeOnCourt || 0) + timePlayedInStint,
                    lastEntryTime: newTimeLeft, // Reset for the next calculation
                };
            }
            return player;
        });

        return { ...currentMatch, [playersKey]: updatedPlayers };
    };


    const handleSaveMatchData = useCallback(async () => {
        let currentMatch = matchRef.current;
        if (currentMatch && !currentMatch.isFinished && !isSaving) {
            try {
                // Update times before saving
                if (currentMatch.isActive) {
                    currentMatch = updateAllPlayingTimes(currentMatch);
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
    }, [isSaving, db]);

    // Autosave timer
    useEffect(() => {
        const saveInterval = setInterval(handleSaveMatchData, 5000);
        return () => clearInterval(saveInterval);
    }, [handleSaveMatchData]);


 const finalizeMatch = async () => {
    if (!match || (match.isFinished && !isAdmin)) return;
    setIsSaving(true);
    
    let finalMatchState = updateAllPlayingTimes(match);
    
    const userPlayers = finalMatchState.userTeam === 'local' ? finalMatchState.localPlayers : finalMatchState.visitorPlayers;
    const userTeamScore = userPlayers?.reduce((acc, p) => acc + (p.goals || 0), 0) || 0;
    
    if (finalMatchState.userTeam === 'local') {
      finalMatchState.localScore = userTeamScore;
      finalMatchState.visitorScore = finalMatchState.opponentStats1.goals + finalMatchState.opponentStats2.goals;
    } else {
      finalMatchState.visitorScore = userTeamScore;
      finalMatchState.localScore = finalMatchState.opponentStats1.goals + finalMatchState.opponentStats2.goals;
    }
    
    const dataToUpdate: Partial<MatchDetails> = {
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
                        minutosJugados: increment(player.timeOnCourt || 0),
                        tirosPuerta: increment(player.tirosPuerta || 0),
                        tirosFuera: increment(player.tirosFuera || 0),
                        recuperaciones: increment(player.recuperaciones || 0),
                        perdidas: increment(player.perdidas || 0)
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
                       minutosJugados: increment(-(player.timeOnCourt || 0)),
                       tirosPuerta: increment(-(player.tirosPuerta || 0)),
                       tirosFuera: increment(-(player.tirosFuera || 0)),
                       recuperaciones: increment(-(player.recuperaciones || 0)),
                       perdidas: increment(-(player.perdidas || 0))
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

   const handlePlayerInfoChange = (playerIndex: number, field: 'name' | 'number', value: string | number) => {
        if (match?.isFinished && !isAdmin) return;
        setMatch(prev => {
            if (!prev) return null;
            const playersKey = prev.userTeam === 'local' ? 'localPlayers' : 'visitorPlayers';
            if (!prev[playersKey] || prev[playersKey].length === 0) return prev;
            
            const updatedPlayers = [...prev[playersKey]!];
            updatedPlayers[playerIndex] = { ...updatedPlayers[playerIndex], [field]: value };
            return { ...prev, [playersKey]: updatedPlayers };
        });
    };

    const handleTogglePlay = (playerIndex: number) => {
        if (match?.isFinished && !isAdmin) return;
        
        const playersKey = match!.userTeam === 'local' ? 'localPlayers' : 'visitorPlayers';
        const playerIsPlaying = match![playersKey]?.[playerIndex]?.isPlaying;

        if (!playerIsPlaying) {
            const playingCount = match![playersKey]?.filter(p => p.isPlaying).length || 0;
            if (playingCount >= 5) {
                toast({
                    title: "Límite de jugadores",
                    description: "Ya hay 5 jugadores en pista.",
                    variant: "destructive"
                });
                return;
            }
        }
        
        setMatch(prev => {
            if (!prev) return null;
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

    const handleOpponentStatChange = (stat: OpponentStatKeys | 'goals', delta: 1 | -1) => {
        if (match?.isFinished && !isAdmin) return;
        setMatch(prev => {
            if (!prev) return null;

            const periodKey = prev.period === '1ª Parte' ? 'opponentStats1' : 'opponentStats2';
            const stats = { ...prev[periodKey] };
            const newValue = (stats[stat] || 0) + delta;

            if (newValue < 0) return prev;

            stats[stat] = newValue;
            
            const opponentTeamKey = prev.userTeam === 'local' ? 'visitor' : 'local';
            const scoreKey = `${opponentTeamKey}Score` as 'localScore' | 'visitorScore';
            const foulsKey = `${opponentTeamKey}Fouls` as 'localFouls' | 'visitorFouls';
            
            let updatedFields: Partial<MatchDetails> = { [periodKey]: stats };

            if (stat === 'goals') {
                const otherPeriodKey = prev.period === '1ª Parte' ? 'opponentStats2' : 'opponentStats1';
                updatedFields[scoreKey] = newValue + prev[otherPeriodKey].goals;
            }
            if (stat === 'fouls') {
                 updatedFields[foulsKey] = newValue;
            }
            
            return { ...prev, ...updatedFields };
        });
    };

  const StatButtonCell = ({ playerIndex, stat }: { playerIndex: number, stat: PlayerStatKeys }) => {
    const players = match?.userTeam === 'local' ? match.localPlayers : match.visitorPlayers;
    const player = players?.[playerIndex];
    const value = player?.[stat] ?? 0;

    return (
        <TableCell className="text-center p-0 md:px-1">
            <div className="flex items-center justify-center gap-0">
                <Button size="icon" variant="ghost" className="h-5 w-5 md:h-6 md:w-6" onClick={() => handleStatChange(playerIndex, stat, -1)} disabled={match?.isFinished && !isAdmin}><Minus className="h-3 w-3 md:h-4 md:w-4"/></Button>
                <span className="w-4 text-center text-sm">{value}</span>
                <Button size="icon" variant="ghost" className="h-5 w-5 md:h-6 md:w-6" onClick={() => handleStatChange(playerIndex, stat, 1)} disabled={match?.isFinished && !isAdmin}><Plus className="h-3 w-3 md:h-4 md:w-4"/></Button>
            </div>
        </TableCell>
    )
  }

   const formatTime = (seconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimerToggle = () => {
    if (match?.isFinished && !isAdmin) return;
    setMatch(prev => {
        if (!prev) return null;

        let newState: MatchDetails;

        if (prev.isActive) {
            // Pausing timer
            newState = updateAllPlayingTimes(prev);
            newState.isActive = false;
            newState.endTime = null;
        } else {
            // Starting timer
            const playersKey = prev.userTeam === 'local' ? 'localPlayers' : 'visitorPlayers';
            const players = prev[playersKey] ? [...prev[playersKey]!] : [];
            const updatedPlayers = players.map(p => 
                p.isPlaying ? { ...p, lastEntryTime: prev.timeLeft } : p
            );
            newState = { 
                ...prev, 
                isActive: true, 
                endTime: Date.now() + prev.timeLeft * 1000,
                [playersKey]: updatedPlayers 
            };
        }
        
        return newState;
    });
  }

  const handlePeriodChange = (newPeriod: '1ª Parte' | '2ª Parte') => {
      if (match?.isFinished && !isAdmin) return;
      setMatch(prev => {
        if (!prev || prev.period === newPeriod) return prev;
        
        const updatedState = updateAllPlayingTimes(prev);

        return {
            ...updatedState,
            period: newPeriod,
            timeLeft: 25 * 60,
            isActive: false,
            localFouls: 0,
            visitorFouls: 0,
            endTime: null,
        };
      });
  }
  
  const resetTimer = () => {
    if (match?.isFinished && !isAdmin) return;
    setMatch(prev => {
        if (!prev) return null;

        const newState: Partial<MatchDetails> = {
            isActive: false,
            timeLeft: 25*60,
            endTime: null,
        };

        if (prev.period === '1ª Parte') {
            newState.teamStats1 = { ...prev.teamStats1, timeouts: 0 };
            newState.opponentStats1 = { ...prev.opponentStats1, timeouts: 0 };
        } else if (prev.period === '2ª Parte') {
            newState.teamStats2 = { ...prev.teamStats2, timeouts: 0 };
            newState.opponentStats2 = { ...prev.opponentStats2, timeouts: 0 };
        }

        return {...prev, ...newState };
    });
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
  
  const localScore = match.userTeam === 'local' ? userTeamScore : (match.opponentStats1.goals + match.opponentStats2.goals);
  const visitorScore = match.userTeam === 'visitor' ? userTeamScore : (match.opponentStats1.goals + match.opponentStats2.goals);

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
        <TableHead className="sticky left-0 bg-background/95 z-20 px-1 md:px-2 min-w-[50px] md:min-w-[70px]">Dorsal</TableHead>
        <TableHead className="sticky left-[50px] md:left-[70px] bg-background/95 z-20 px-1 md:px-2 min-w-[150px] md:min-w-[200px]">Nombre</TableHead>
        <StatColumnHeader full="Goles" abbr="G" />
        <StatColumnHeader full="Asist." abbr="As" />
        <StatColumnHeader full="yellow" abbr="" isIcon />
        <StatColumnHeader full="red" abbr="" isIcon />
        <StatColumnHeader full="Faltas" abbr="F" />
        <StatColumnHeader full="TP" abbr="TP" />
        <StatColumnHeader full="TF" abbr="TF" />
        <StatColumnHeader full="R" abbr="R" />
        <StatColumnHeader full="P" abbr="P" />
        <StatColumnHeader full="Paradas" abbr="Par" />
        <StatColumnHeader full="GC" abbr="GC" />
        <StatColumnHeader full="1vs1" abbr="1vs1" />
    </TableRow>
  )
  
  const OpponentStatCounter = ({ stat, label, icon: Icon }: { stat: OpponentStatKeys | 'goals', label: string, icon: React.ElementType }) => {
    if (!match) return null;
    const periodKey = match.period === '1ª Parte' ? 'opponentStats1' : 'opponentStats2';
    const value = match[periodKey]?.[stat] || 0;

    return (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleOpponentStatChange(stat, -1)} disabled={match.isFinished && !isAdmin}><Minus className="h-4 w-4"/></Button>
                <span className="w-5 text-center text-lg font-bold">{value}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleOpponentStatChange(stat, 1)} disabled={match.isFinished && !isAdmin}><Plus className="h-4 w-4"/></Button>
            </div>
        </div>
    );
};

const StatsLegend = () => (
    <div className="p-4 mt-4 border-t text-xs text-muted-foreground">
        <h4 className="font-semibold text-sm mb-2 text-foreground">Leyenda de Estadísticas</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1">
            <p><span className="font-bold">G:</span> Goles</p>
            <p><span className="font-bold">Asist:</span> Asistencias</p>
            <p><span className="font-bold">F:</span> Faltas</p>
            <p><span className="font-bold">TP:</span> Tiros a Puerta</p>
            <p><span className="font-bold">TF:</span> Tiros Fuera</p>
            <p><span className="font-bold">R:</span> Recuperaciones</p>
            <p><span className="font-bold">P:</span> Pérdidas</p>
            <p><span className="font-bold">Par:</span> Paradas</p>
            <p><span className="font-bold">GC:</span> Goles en Contra</p>
            <p><span className="font-bold">1vs1:</span> Paradas 1vs1</p>
        </div>
    </div>
);


  const renderTeamTable = (isUserTeam: boolean) => {
    if (!isUserTeam) {
        return (
            <div className="space-y-4 p-4">
                 <h3 className="font-semibold text-lg text-center">Estadísticas del Rival</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    <OpponentStatCounter stat="goals" label="Goles" icon={GoalIcon} />
                    <OpponentStatCounter stat="shotsOnTarget" label="Tiros a Puerta" icon={Crosshair} />
                    <OpponentStatCounter stat="shotsOffTarget" label="Tiros Fuera" icon={ShieldOff} />
                    <OpponentStatCounter stat="fouls" label="Faltas" icon={AlertOctagon} />
                    <OpponentStatCounter stat="recoveries" label="Recuperaciones" icon={Shuffle} />
                    <OpponentStatCounter stat="turnovers" label="Pérdidas" icon={RotateCcw} />
                </div>
            </div>
        );
    }

    const players = userPlayers || [];
    
    const totals = players.reduce((acc, player) => {
        acc.goals += player.goals || 0;
        acc.assists += player.assists || 0;
        acc.amarillas += player.amarillas || 0;
        acc.rojas += player.rojas || 0;
        acc.faltas += player.faltas || 0;
        acc.tirosPuerta += player.tirosPuerta || 0;
        acc.tirosFuera += player.tirosFuera || 0;
        acc.recuperaciones += player.recuperaciones || 0;
        acc.perdidas += player.perdidas || 0;
        acc.paradas += player.paradas || 0;
        acc.gRec += player.gRec || 0;
        acc.vs1 += player.vs1 || 0;
        return acc;
    }, {
        goals: 0, assists: 0, amarillas: 0, rojas: 0, faltas: 0,
        tirosPuerta: 0, tirosFuera: 0, recuperaciones: 0, perdidas: 0,
        paradas: 0, gRec: 0, vs1: 0
    });

    return (
        <div className="space-y-6">
            <div className="mt-0">
                <div className="p-2 bg-primary text-primary-foreground">
                    <h3 className="font-bold text-center">JUGADORES - {match.userTeam === 'local' ? match.localTeam : match.visitorTeam}</h3>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="[&_tr]:border-b-0">
                            {tableHeaders}
                        </TableHeader>
                        <TableBody>
                            {players.map((player, index) => (
                                <TableRow key={player.id}>
                                    <TableCell className="sticky left-0 bg-background/95 z-10 px-1 md:px-2 py-0">
                                        <Input 
                                            className="h-8 w-12 text-center" 
                                            value={player.number} 
                                            onChange={(e) => handlePlayerInfoChange(index, 'number', parseInt(e.target.value) || 0)} 
                                            readOnly={(match.isFinished && !isAdmin) || (!player.id.startsWith('local-') && !player.id.startsWith('visitor-'))} 
                                        />
                                    </TableCell>
                                    <TableCell className="sticky left-[50px] md:left-[70px] bg-background/95 z-10 px-1 md:px-2 py-0 flex items-center">
                                        <Input 
                                            className={cn("h-8 flex-grow", player.isPlaying && "bg-green-100 dark:bg-green-900/30")} 
                                            value={player.name} 
                                            onClick={() => handleTogglePlay(index)}
                                            readOnly
                                        />
                                        <div className="flex items-center gap-1 text-xs p-1 rounded-md bg-muted text-muted-foreground w-16 justify-center">
                                            <Clock className="h-3 w-3" />
                                            <span>{formatTime(player.timeOnCourt)}</span>
                                        </div>
                                    </TableCell>
                                    <StatButtonCell playerIndex={index} stat="goals" />
                                    <StatButtonCell playerIndex={index} stat="assists" />
                                    <StatButtonCell playerIndex={index} stat="amarillas" />
                                    <StatButtonCell playerIndex={index} stat="rojas" />
                                    <StatButtonCell playerIndex={index} stat="faltas" />
                                    <StatButtonCell playerIndex={index} stat="tirosPuerta" />
                                    <StatButtonCell playerIndex={index} stat="tirosFuera" />
                                    <StatButtonCell playerIndex={index} stat="recuperaciones" />
                                    <StatButtonCell playerIndex={index} stat="perdidas" />
                                    <StatButtonCell playerIndex={index} stat="paradas" />
                                    <StatButtonCell playerIndex={index} stat="gRec" />
                                    <StatButtonCell playerIndex={index} stat="vs1" />
                                </TableRow>
                            ))}
                        </TableBody>
                         <TableFooter className="bg-secondary/80 sticky bottom-0">
                                {tableHeaders}
                                <TableRow>
                                <TableCell colSpan={2} className="font-bold text-right sticky left-0 bg-secondary/80 z-20">TOTAL</TableCell>
                                <TableCell className="text-center font-bold">{totals.goals}</TableCell>
                                <TableCell className="text-center font-bold">{totals.assists}</TableCell>
                                <TableCell className="text-center font-bold">{totals.amarillas}</TableCell>
                                <TableCell className="text-center font-bold">{totals.rojas}</TableCell>
                                <TableCell className="text-center font-bold">{totals.faltas}</TableCell>
                                <TableCell className="text-center font-bold">{totals.tirosPuerta}</TableCell>
                                <TableCell className="text-center font-bold">{totals.tirosFuera}</TableCell>
                                <TableCell className="text-center font-bold">{totals.recuperaciones}</TableCell>
                                <TableCell className="text-center font-bold">{totals.perdidas}</TableCell>
                                <TableCell className="text-center font-bold">{totals.paradas}</TableCell>
                                <TableCell className="text-center font-bold">{totals.gRec}</TableCell>
                                <TableCell className="text-center font-bold">{totals.vs1}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
                 <StatsLegend />
            </div>
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

  const handleTimeoutToggle = (team: 'local' | 'visitor') => {
      if (match?.isFinished && !isAdmin) return;

      setMatch(prev => {
          if (!prev) return null;

          const isUserTeam = (prev.userTeam === 'local' && team === 'local') || (prev.userTeam === 'visitor' && team === 'visitor');
          const periodKey = prev.period === '1ª Parte' ? (isUserTeam ? 'teamStats1' : 'opponentStats1') : (isUserTeam ? 'teamStats2' : 'opponentStats2');
          
          const stats = { ...prev[periodKey] };
          const currentTimeoutValue = stats.timeouts || 0;
          let delta: 1 | -1;

          if (currentTimeoutValue === 0) {
              delta = 1; // Use timeout
          } else {
              delta = -1; // Cancel timeout
          }
          
          const newTimeoutValue = currentTimeoutValue + delta;
          if (newTimeoutValue > 1 || newTimeoutValue < 0) return prev; // Should not happen with this logic

          stats.timeouts = newTimeoutValue;

          let newIsActive = prev.isActive;
          if (delta === 1 && newIsActive) {
            newIsActive = false; // Pause timer when timeout is called
          }

          const newTime = (prev.timeLeft || 0) + (delta * 60);
          const newEndTime = prev.endTime ? prev.endTime + (delta * 60 * 1000) : null;
          
          return {
              ...prev,
              [periodKey]: stats,
              timeLeft: newTime,
              endTime: newEndTime,
              isActive: newIsActive,
          };
      });
  };

  const TimeoutIndicator = ({ team, used }: { team: 'local' | 'visitor', used: boolean }) => (
      <Button 
        variant="outline"
        className={cn(
          "flex items-center justify-center w-10 h-10 border-2 border-primary rounded-md",
          used ? "bg-primary text-primary-foreground" : "bg-transparent text-primary"
        )}
        onClick={() => handleTimeoutToggle(team)}
        disabled={(match?.isFinished && !isAdmin)}
      >
          <span className="font-bold text-sm">TM</span>
      </Button>
  );

  const currentPeriodKeyUser = match.period === '1ª Parte' ? 'teamStats1' : 'teamStats2';
  const currentPeriodKeyOpponent = match.period === '1ª Parte' ? 'opponentStats1' : 'opponentStats2';
  
  const localTimeoutUsed = match.userTeam === 'local' 
    ? match[currentPeriodKeyUser].timeouts > 0
    : match[currentPeriodKeyOpponent].timeouts > 0;

  const visitorTimeoutUsed = match.userTeam === 'visitor' 
    ? match[currentPeriodKeyUser].timeouts > 0
    : match[currentPeriodKeyOpponent].timeouts > 0;

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BarChartHorizontal className="text-primary"/>
                    Marcador y Estadísticas en Vivo
                </h1>
                <p className="text-muted-foreground">Gestiona el partido en tiempo real. Los cambios se guardan automáticamente cada 5 segundos.</p>
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
                     <TimeoutIndicator 
                        team="local"
                        used={localTimeoutUsed}
                    />
                    <div className="text-5xl md:text-6xl font-mono font-bold text-center tabular-nums bg-gray-900 dark:bg-gray-800 text-white py-2 px-4 rounded-lg mx-4">
                        {formatTime(match.timeLeft)}
                    </div>
                     <TimeoutIndicator 
                        team="visitor"
                        used={visitorTimeoutUsed}
                    />
                </div>


                <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                    <Button onClick={handleTimerToggle} disabled={match.timeLeft === 0 || (match.isFinished && !isAdmin)}>
                        {match.isActive ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                        {match.isActive ? 'Pausa' : 'Iniciar'}
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
                <TabsContent value="local" className="m-0">
                    {renderTeamTable(match.userTeam === 'local')}
                </TabsContent>
                <TabsContent value="visitor" className="m-0">
                    {renderTeamTable(match.userTeam === 'visitor')}
                </TabsContent>
               </Tabs>
            </CardContent>
        </Card>
      
    </div>
  );
}
