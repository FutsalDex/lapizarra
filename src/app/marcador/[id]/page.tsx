
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Pause, RefreshCw, Settings, Minus, Plus, ArrowLeft } from 'lucide-react';
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
                 goals: d.data().goals || 0,
                 assists: d.data().assists || 0,
                 faltas: d.data().faltas || 0,
                 amarillas: d.data().amarillas || 0,
                 rojas: d.data().rojas || 0,
                 paradas: d.data().paradas || 0,
                 golesContra: d.data().golesContra || 0,
                 vs1: d.data().vs1 || 0,
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
  
  const handleStatChange = (team: 'local' | 'visitor', playerIndex: number, stat: keyof Omit<Player, 'id' | 'name' | 'number'>, delta: 1 | -1) => {
      setMatch(prev => {
          if (!prev) return null;
          const teamKey = team === 'local' ? 'localPlayers' : 'visitorPlayers';
          const players = prev[teamKey] ? [...prev[teamKey]!] : [];
          if (!players[playerIndex]) return prev;

          const currentStatValue = players[playerIndex][stat];
          if (typeof currentStatValue !== 'number') return prev;
          
          // Ensure stats don't go below 0
          if (delta === -1 && currentStatValue === 0) return prev;

          players[playerIndex] = { ...players[playerIndex], [stat]: currentStatValue + delta };

          // Also update total score if stat is 'goals'
          let newLocalScore = prev.localScore;
          let newVisitorScore = prev.visitorScore;
          if (stat === 'goals') {
              if (team === 'local') {
                newLocalScore += delta;
              } else {
                newVisitorScore += delta;
              }
          }

          return { 
              ...prev, 
              [teamKey]: players,
              localScore: newLocalScore,
              visitorScore: newVisitorScore
          };
      });
  }

  const StatButtonCell = ({ team, playerIndex, stat }: { team: 'local' | 'visitor', playerIndex: number, stat: keyof Omit<Player, 'id' | 'name' | 'number'> }) => {
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

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
        <div className="mb-8">
            <Button asChild variant="outline">
                <Link href={`/equipo/${match.teamId}/partidos`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Partidos
                </Link>
            </Button>
        </div>

      <Card>
        <CardContent className="p-4 md:p-6">
           <Tabs defaultValue="local">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="local">{match.localTeam}</TabsTrigger>
                <TabsTrigger value="visitor">{match.visitorTeam}</TabsTrigger>
            </TabsList>
            <TabsContent value="local">
                 <div className="mt-4">
                    <div className="bg-primary text-primary-foreground p-2 rounded-t-lg">
                        <h3 className="font-bold text-center">JUGADORES - {match.localTeam}</h3>
                    </div>
                    <div className="rounded-md border border-t-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dorsal</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead className="text-center">Goles</TableHead>
                                    <TableHead className="text-center">TA</TableHead>
                                    <TableHead className="text-center">TR</TableHead>
                                    <TableHead className="text-center">Faltas</TableHead>
                                    <TableHead className="text-center">Paradas</TableHead>
                                    <TableHead className="text-center">G.C.</TableHead>
                                    <TableHead className="text-center">1vs1</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {match.localPlayers?.map((player, index) => (
                                    <TableRow key={player.id}>
                                        <TableCell>{player.number}</TableCell>
                                        <TableCell>{player.name}</TableCell>
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
            <TabsContent value="visitor">
                <div className="mt-4">
                    <div className="bg-muted text-muted-foreground p-2 rounded-t-lg">
                        <h3 className="font-bold text-center">JUGADORES - {match.visitorTeam}</h3>
                    </div>
                     <div className="rounded-md border border-t-0">
                        <p className="p-8 text-center text-muted-foreground">La gestión de estadísticas para el equipo visitante estará disponible próximamente.</p>
                     </div>
                </div>
            </TabsContent>
           </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

    

