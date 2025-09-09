
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Users, ClipboardCheck, BarChartHorizontal, Settings } from 'lucide-react';
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
    description: 'Gestiona la plantilla de tu equipo, añade jugadores y consulta sus estadísticas de la temporada.',
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
    title: 'Partidos y Estadísticas',
    description: 'Gestiona el partido en tiempo real, estadísticas, goles y crono.',
    icon: BarChartHorizontal,
    href: (teamId: string) => `/equipo/${teamId}/partidos`,
  },
];


export default function TeamDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
    if (!teamId || !user) return;

    const teamDocRef = doc(db, 'teams', teamId);
    
    const unsubscribeTeam = onSnapshot(teamDocRef, (teamDoc) => {
      if (teamDoc.exists()) {
        const teamData = teamDoc.data() as Team;
        // Basic check to see if user is owner. A more robust check would involve checking teamMembers collection.
        if (teamData.ownerId === user.uid) {
            setTeam(teamData);
        } else {
            // For now, redirect if not owner. This can be expanded to allow team members.
            router.push('/gestion-equipos');
        }
      } else {
        router.push('/gestion-equipos');
      }
      setLoading(false);
    });

    return () => unsubscribeTeam();
  }, [teamId, user, router]);


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

  if (!team) {
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
      
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
