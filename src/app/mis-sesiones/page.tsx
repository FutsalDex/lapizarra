
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ClipboardList,
  Edit,
  Eye,
  Filter,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface Exercise {
  id: string;
  Ejercicio: string;
  'Duración (min)': string;
  [key: string]: any;
}

interface Session {
  id: string;
  date: { seconds: number; nanoseconds: number };
  sessionNumber: string;
  initialExercises: string[];
  mainExercises: string[];
  finalExercises: string[];
}

interface PopulatedSession extends Omit<Session, 'initialExercises' | 'mainExercises' | 'finalExercises'> {
    initialExercises: (Exercise | null)[];
    mainExercises: (Exercise | null)[];
    finalExercises: (Exercise | null)[];
    totalDuration: number;
    [key: string]: any;
}


export default function MisSesionesPage() {
  const { user, db } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<PopulatedSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'sessions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      async (sessionSnapshot) => {
        setLoading(true);
        const sessionsData = sessionSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Session)
        );

        if (sessionsData.length === 0) {
            setSessions([]);
            setLoading(false);
            return;
        }

        // Fetch all exercises at once for efficiency
        const exercisesSnapshot = await getDocs(collection(db, 'exercises'));
        const exercisesMap = new Map<string, Exercise>();
        exercisesSnapshot.forEach((doc) =>
          exercisesMap.set(doc.id, { 
            id: doc.id,
            ...doc.data()
        } as Exercise)
        );

        const populatedSessions = sessionsData.map((session) => {
            const initialExs = (session.initialExercises || []).map((id) => exercisesMap.get(id) || null);
            const mainExs = (session.mainExercises || []).map((id) => exercisesMap.get(id) || null);
            const finalExs = (session.finalExercises || []).map((id) => exercisesMap.get(id) || null);

            const totalDuration = [...initialExs, ...mainExs, ...finalExs].reduce((acc, ex) => acc + parseInt(ex?.['Duración (min)'] || '0', 10),0);

          return {
            ...(session as unknown as PopulatedSession),
            initialExercises: initialExs,
            mainExercises: mainExs,
            finalExercises: finalExs,
            totalDuration
          };
        });

        setSessions(populatedSessions.sort((a, b) => b.date.seconds - a.date.seconds));
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching sessions: ', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, db]);
  
  const handleDeleteSession = async (sessionId: string) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, "sessions", sessionId));
        toast({
            title: "Sesión Eliminada",
            description: "La sesión de entrenamiento ha sido eliminada."
        });
    } catch (error) {
        console.error("Error deleting session: ", error);
        toast({
            title: "Error",
            description: "No se pudo eliminar la sesión.",
            variant: "destructive"
        });
    }
  }

  const handleViewSheet = (session: PopulatedSession) => {
    const sessionData = {
      ...session,
      initialExercise: session.initialExercises[0], // Adjust for multi-exercise phases
      mainExercises: session.mainExercises.filter(ex => ex !== null),
      finalExercise: session.finalExercises[0],
      date: new Date(session.date.seconds * 1000).toISOString(),
    };
    localStorage.setItem('sessionSheetData', JSON.stringify(sessionData));
    window.open('/crear-sesion/ficha', '_blank');
  };

  return (
    <div className="container mx-auto max-w-7xl py-12 px-4">
      <div className="flex justify-between items-start mb-8">
        <div className="text-left">
          <div className="flex items-center gap-4">
            <ClipboardList className="h-10 w-10 text-primary hidden md:block" />
            <div>
                <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
                    Mis Sesiones
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                    Aquí encontrarás todas las sesiones de entrenamiento que has creado.
                </p>
            </div>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/mi-equipo">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Link>
        </Button>
      </div>

       <Card className="mb-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Filter className="h-5 w-5" />Filtrar Sesiones</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select defaultValue="2025">
                      <SelectTrigger>
                        <SelectValue placeholder="Año" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                      </SelectContent>
                    </Select>
                     <Select defaultValue="todos">
                      <SelectTrigger>
                        <SelectValue placeholder="Mes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los meses</SelectItem>
                        <SelectItem value="enero">Enero</SelectItem>
                        {/* ... more months ... */}
                      </SelectContent>
                    </Select>
                    <Button>Aplicar Filtro</Button>
                 </div>
            </CardContent>
        </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-96 rounded-lg" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg bg-card">
           <div className="flex justify-center mb-4">
            <ClipboardList className="h-16 w-16 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No has creado ninguna sesión</h3>
          <p className="text-muted-foreground mt-2 mb-4">Usa el creador de sesiones para planificar tu entrenamiento.</p>
           <Button asChild>
            <Link href="/crear-sesion">Crear una Sesión</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sessions.map(session => (
                <Card key={session.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-primary">{format(new Date(session.date.seconds * 1000), "d 'de' MMMM 'de' yyyy", { locale: es })}</CardTitle>
                        <CardDescription>
                            Número sesión: {session.sessionNumber} | Tiempo total: {session.totalDuration} min
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4 text-sm">
                        <div>
                            <h4 className="font-semibold text-foreground">Fase Inicial</h4>
                            <ul className="list-disc list-inside text-muted-foreground">
                                {session.initialExercises.map(ex => ex ? <li key={ex.id}>{ex.Ejercicio}</li> : <li key="empty">N/A</li>)}
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-semibold text-foreground">Fase Principal</h4>
                            <ul className="list-disc list-inside text-muted-foreground">
                                {session.mainExercises.map(ex => ex ? <li key={ex.id}>{ex.Ejercicio}</li> : <li key="empty">N/A</li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground">Fase Final</h4>
                            <ul className="list-disc list-inside text-muted-foreground">
                                {session.finalExercises.map(ex => ex ? <li key={ex.id}>{ex.Ejercicio}</li> : <li key="empty">N/A</li>)}
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch space-y-2">
                        <Button variant="outline" onClick={() => handleViewSheet(session)}><Eye className="mr-2 h-4 w-4" />Ver Ficha Detallada</Button>
                        <div className="grid grid-cols-2 gap-2">
                            <Button asChild variant="secondary">
                                <Link href={`/crear-sesion?sessionId=${session.id}`}>
                                    <Edit className="mr-2 h-4 w-4" />Editar
                                </Link>
                            </Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" />Borrar</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar sesión?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se borrará la sesión de entrenamiento permanentemente.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteSession(session.id)}>Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}
