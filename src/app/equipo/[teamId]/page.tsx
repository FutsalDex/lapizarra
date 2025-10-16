
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Users, ClipboardCheck, Trophy, Settings, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Team {
  name: string;
  club: string;
  ownerId: string;
}

const teamModules = [
  {
    title: 'Plantilla',
    description: 'Gestiona la plantilla de tu equipo, añade jugadores y consulta sus datos.',
    icon: Users,
    href: (teamId: string) => `/equipo/${teamId}/plantilla`,
  },
  {
    title: 'Control de Asistencia',
    description: 'Registra y consulta la asistencia de los jugadores a entrenamientos y partidos.',
    icon: ClipboardCheck,
    href: (teamId: string) => `/equipo/${teamId}/asistencia`,
  },
  {
    title: 'Partidos',
    description: 'Gestiona los partidos del equipo, resultados y accede al marcador en vivo.',
    icon: Trophy,
    href: (teamId: string) => `/equipo/${teamId}/partidos`,
  },
  {
    title: 'Estadísticas',
    description: 'Visualiza un resumen de los datos más relevantes de la temporada y el rendimiento del equipo.',
    icon: BarChart3,
    href: (teamId: string) => `/equipo/${teamId}/estadisticas`,
  }
];


export default function TeamDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user, db } = useAuth();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

   useEffect(() => {
    if (teamId === 'demo-team-guest') {
        setTeam({ name: 'Equipo Demo', club: 'Club de Demostración', ownerId: 'guest' });
        setIsAllowed(true);
        setLoading(false);
        return;
    }
    if (!teamId || !user || !db) return;

    const teamDocRef = doc(db, 'teams', teamId);
    
    const unsubscribeTeam = onSnapshot(teamDocRef, async (teamDoc) => {
      if (teamDoc.exists()) {
        const teamData = teamDoc.data() as Team;
        setTeam(teamData);

        // Check for permissions
        if (teamData.ownerId === user.uid) {
            setIsAllowed(true);
        } else {
            const membersQuery = query(collection(db, 'teamMembers'), where('teamId', '==', teamId), where('userId', '==', user.uid));
            const membersSnapshot = await getDocs(membersQuery);
            if (!membersSnapshot.empty) {
                setIsAllowed(true);
            } else {
                setIsAllowed(false);
                router.push('/gestion-equipos');
            }
        }
      } else {
        router.push('/gestion-equipos');
      }
      setLoading(false);
    });

    return () => unsubscribeTeam();
  }, [teamId, user, router, db]);


  if (loading) {
    return (
        <div className="container mx-auto max-w-4xl py-12 px-4 space-y-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-56 w-full" />
            </div>
        </div>
    )
  }

  if (!isAllowed || !team) {
      return null;
  }

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <div className="mb-8">
        <Button asChild variant="outline">
          <Link href="/gestion-equipos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Gestión de Equipos
          </Link>
        </Button>
      </div>

      <div className="text-left mb-12">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                  <Settings className="h-8 w-8 text-primary" />
              </div>
              <div>
                  <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
                    Panel del Equipo: {team.name}
                  </h1>
                  <p className="text-lg text-muted-foreground mt-1">
                      {team.club}
                  </p>
              </div>
          </div>
      </div>
      
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teamModules.map((item) => (
          <Card key={item.title} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader className="flex-row items-center gap-4 space-y-0">
                <div className="p-3 bg-primary/10 rounded-lg">
                     <item.icon className="h-6 w-6 text-primary" />
                </div>
              <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link href={item.href(teamId)}>
                  Ir a {item.title}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
