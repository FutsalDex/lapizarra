
'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trophy, PlusCircle, Eye, Clock, Trash2, ArrowLeft, Edit, ClipboardList } from 'lucide-react';
import AddMatchDialog from '@/app/mis-partidos/_components/AddMatchDialog';
import { collection, onSnapshot, query, where, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import ConvocatoriaDialog from './_components/ConvocatoriaDialog';

const demoMatches = [
    { id: 'demomatch1', localTeam: 'Equipo Demo', visitorTeam: 'Rival A', localScore: 3, visitorScore: 1, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), matchType: 'Liga', isFinished: true, localPlayers: [], visitorPlayers: [] },
    { id: 'demomatch2', localTeam: 'Rival B', visitorTeam: 'Equipo Demo', localScore: 2, visitorScore: 2, date: new Date().toISOString(), matchType: 'Amistoso', isFinished: false, localPlayers: [], visitorPlayers: [] },
];

const demoTeam = { name: 'Equipo Demo' };


interface Match {
  id: string;
  localTeam: string;
  visitorTeam: string;
  localScore: number;
  visitorScore: number;
  date: string;
  matchType: string;
  isFinished: boolean;
  localPlayers: any[];
  visitorPlayers: any[];
}

interface Team {
  name: string;
}

type FilterType = 'Todos' | 'Liga' | 'Copa' | 'Torneo' | 'Amistoso';
const filters: FilterType[] = ['Todos', 'Liga', 'Copa', 'Torneo', 'Amistoso'];

export default function TeamMatchesPage() {
  const { user } = useAuth();
  const params = useParams();
  const { toast } = useToast();
  const teamId = params.teamId as string;
  const isDemoMode = teamId === 'demo-team-guest';

  const [matches, setMatches] = useState<Match[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');

  useEffect(() => {
    if (isDemoMode) {
        setMatches(demoMatches);
        setTeam(demoTeam);
        setLoading(false);
        return;
    }

    if (!user || !teamId) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'matches'), where('teamId', '==', teamId), orderBy('date', 'asc'));
    const unsubscribeMatches = onSnapshot(q, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      setMatches(matchesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching matches: ", error);
      setLoading(false);
    });

    const teamDocRef = doc(db, 'teams', teamId);
    const unsubscribeTeam = onSnapshot(teamDocRef, (doc) => {
        if (doc.exists()) {
            setTeam(doc.data() as Team);
        }
    });

    return () => {
        unsubscribeMatches();
        unsubscribeTeam();
    }
  }, [user, teamId, isDemoMode]);
  
  const filteredMatches = useMemo(() => {
    if (activeFilter === 'Todos') {
      return matches;
    }
    return matches.filter(match => match.matchType === activeFilter);
  }, [matches, activeFilter]);
  
  const handleDeleteMatch = async (matchId: string) => {
    if (isDemoMode) {
        toast({ title: 'Modo Demostración', description: 'No se pueden eliminar partidos en el modo demostración.' });
        return;
    }
      try {
          await deleteDoc(doc(db, 'matches', matchId));
          toast({ title: "Partido Eliminado", description: "El partido ha sido eliminado con éxito." });
      } catch (error) {
          console.error("Error deleting match: ", error);
          toast({ title: "Error", description: "No se pudo eliminar el partido.", variant: "destructive" });
      }
  }

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div className="text-left">
           <div className="mb-4">
                <Button asChild variant="outline">
                <Link href={`/equipo/${teamId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Panel del Equipo
                </Link>
                </Button>
            </div>
          <div className="flex items-center gap-4">
            <Trophy className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
                Partidos de {team?.name || '...'}
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Gestiona los partidos, añade nuevos encuentros, edita los existentes o consulta sus estadísticas.
              </p>
            </div>
          </div>
        </div>
        <AddMatchDialog teamId={teamId}>
          <Button size="lg" className="shrink-0" disabled={isDemoMode}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Añadir Partido
          </Button>
        </AddMatchDialog>
      </div>
      
      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            {filters.map(filter => (
                <Button 
                    key={filter} 
                    variant={activeFilter === filter ? 'default' : 'outline'}
                    onClick={() => setActiveFilter(filter)}
                >
                    {filter}
                </Button>
            ))}
          </div>
        </CardContent>
      </Card>


      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">
            {activeFilter === 'Todos' 
                ? 'Aún no has añadido ningún partido para este equipo.'
                : `No se encontraron partidos de tipo "${activeFilter}".`
            }
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {activeFilter === 'Todos' && !isDemoMode ? 'Haz clic en "Añadir Partido" para empezar.' : 'Prueba a seleccionar otro filtro.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMatches.map(match => (
            <Card key={match.id} className="text-center hover:shadow-lg transition-shadow flex flex-col">
              <CardContent className="p-6 flex-grow flex flex-col justify-center items-center">
                  <h3 className="font-semibold">{match.localTeam} vs {match.visitorTeam}</h3>
                  <p className="text-sm text-muted-foreground">{new Date(match.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                  <p className="text-5xl font-bold text-primary my-4">{match.localScore ?? 0} - {match.visitorScore ?? 0}</p>
                  <Badge variant="secondary">{match.matchType}</Badge>
              </CardContent>
              <CardFooter className="flex justify-center gap-2 border-t pt-4">
                <ConvocatoriaDialog teamId={teamId} match={match}>
                  <Button variant="outline" size="sm" disabled={isDemoMode}>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Convocar
                  </Button>
                </ConvocatoriaDialog>
                 <Button asChild variant="ghost" size="icon">
                  <Link href={`/marcador/${match.id}`}><Clock className="h-5 w-5" /></Link>
                </Button>
                 <Button asChild variant="ghost" size="icon">
                  <Link href={`/partido/${match.id}`}><Eye className="h-5 w-5" /></Link>
                </Button>
                <AddMatchDialog matchData={match} teamId={teamId}>
                    <Button variant="ghost" size="icon" disabled={isDemoMode}>
                        <Edit className="h-5 w-5" />
                    </Button>
                </AddMatchDialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={isDemoMode}>
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar partido?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer y borrará permanentemente los datos de este partido.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteMatch(match.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
