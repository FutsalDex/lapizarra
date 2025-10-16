
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trophy, PlusCircle, Eye, BarChartHorizontal, Trash2 } from 'lucide-react';
import AddMatchDialog from './_components/AddMatchDialog';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
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
} from "@/components/ui/alert-dialog"

interface Match {
  id: string;
  localTeam: string;
  visitorTeam: string;
  localScore: number;
  visitorScore: number;
  date: string;
}

export default function MisPartidosPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'matches'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      setMatches(matchesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching matches: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <div className="flex justify-between items-center mb-12">
        <div className="text-left">
          <div className="flex items-center gap-4">
            <Trophy className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
                Mis Partidos
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
          <p className="text-muted-foreground">Aún no has añadido ningún partido.</p>
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
                  <Link href={`/marcador/${match.id}`}><BarChartHorizontal className="mr-2 h-4 w-4" />Estadísticas</Link>
                </Button>
                 <AddMatchDialog>
                     <Button variant="ghost" size="icon">
                        <Eye className="h-5 w-5" />
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
                        <AlertDialogAction>Eliminar</AlertDialogAction>
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
