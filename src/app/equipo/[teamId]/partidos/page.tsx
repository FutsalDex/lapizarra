
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trophy, PlusCircle, Eye, BarChart2, Trash2, ArrowLeft, Edit } from 'lucide-react';
import AddMatchDialog from '@/app/mis-partidos/_components/AddMatchDialog';
import { collection, onSnapshot, query, where, doc, deleteDoc } from 'firebase/firestore';
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

interface Match {
  id: string;
  localTeam: string;
  visitorTeam: string;
  localScore: number;
  visitorScore: number;
  date: string;
  matchType: string;
}

interface Team {
  name: string;
}

export default function TeamMatchesPage() {
  const { user } = useAuth();
  const params = useParams();
  const { toast } = useToast();
  const teamId = params.teamId as string;
  const [matches, setMatches] = useState<Match[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !teamId) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'matches'), where('teamId', '==', teamId));
    const unsubscribeMatches = onSnapshot(q, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      setMatches(matchesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
  }, [user, teamId]);
  
  const handleDeleteMatch = async (matchId: string) => {
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
      <div className="flex justify-between items-center mb-12">
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
          <Button size="lg">
            <PlusCircle className="mr-2 h-5 w-5" />
            Añadir Partido
          </Button>
        </AddMatchDialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Aún no has añadido ningún partido para este equipo.</p>
          <p className="text-sm text-muted-foreground mt-2">Haz clic en "Añadir Partido" para empezar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {matches.map(match => (
            <Card key={match.id} className="text-center hover:shadow-lg transition-shadow flex flex-col">
              <CardContent className="p-6 flex-grow flex flex-col justify-center items-center">
                  <h3 className="font-semibold">{match.localTeam} vs {match.visitorTeam}</h3>
                  <p className="text-sm text-muted-foreground">{new Date(match.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                  <p className="text-5xl font-bold text-primary my-4">{match.localScore ?? 0} - {match.visitorScore ?? 0}</p>
                  <Badge variant="secondary">{match.matchType}</Badge>
              </CardContent>
              <CardFooter className="flex justify-center gap-2 border-t pt-4">
                <Button asChild variant="ghost" size="icon">
                  <Link href={`/marcador/${match.id}`}><Eye className="h-5 w-5" /></Link>
                </Button>
                <AddMatchDialog matchData={match} teamId={teamId}>
                    <Button variant="ghost" size="icon">
                        <Edit className="h-5 w-5" />
                    </Button>
                </AddMatchDialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
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
