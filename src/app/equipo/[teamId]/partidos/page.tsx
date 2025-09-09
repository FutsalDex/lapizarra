
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trophy, PlusCircle, Eye, BarChart2, Trash2, ArrowLeft } from 'lucide-react';
import AddMatchDialog from '@/app/mis-partidos/_components/AddMatchDialog';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface Match {
  id: string;
  localTeam: string;
  visitorTeam: string;
  localScore: number;
  visitorScore: number;
  date: string;
}

interface Team {
  name: string;
}

export default function TeamMatchesPage() {
  const { user } = useAuth();
  const params = useParams();
  const teamId = params.teamId as string;
  const [matches, setMatches] = useState<Match[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !teamId) {
      setLoading(false);
      return;
    }
    // Query for matches related to the team. 
    // This is a placeholder. A real implementation might need a 'teamId' field in the match document.
    const q = query(collection(db, 'matches'), where('userId', '==', user.uid));
    const unsubscribeMatches = onSnapshot(q, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      setMatches(matchesData);
      if(!team) setLoading(true); else setLoading(false);
    }, (error) => {
      console.error("Error fetching matches: ", error);
      setLoading(false);
    });

    const teamDocRef = doc(db, 'teams', teamId);
    const unsubscribeTeam = onSnapshot(teamDocRef, (doc) => {
        if (doc.exists()) {
            setTeam(doc.data() as Team);
        }
        setLoading(false);
    });

    return () => {
        unsubscribeMatches();
        unsubscribeTeam();
    }
  }, [user, teamId, team]);

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
        <AddMatchDialog>
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
            <Card key={match.id} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardDescription>{new Date(match.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                <CardTitle className="text-2xl font-bold flex justify-center items-center gap-4">
                  <span>{match.localTeam}</span>
                  <span className="text-3xl">{match.localScore ?? 0} - {match.visitorScore ?? 0}</span>
                  <span>{match.visitorTeam}</span>
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex justify-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/marcador/${match.id}`}><BarChart2 className="mr-2 h-4 w-4" />Estadísticas</Link>
                </Button>
                <Button variant="ghost" size="icon" disabled>
                    <Eye className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" disabled>
                    <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
