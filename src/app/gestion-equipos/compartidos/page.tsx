
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface Team {
    id: string;
    name: string;
    club: string;
}

interface TeamMember {
    teamId: string;
}

export default function SharedTeamsPage() {
    const { user } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        
        // Find all team memberships for the current user
        const memberQuery = query(collection(db, "teamMembers"), where("userId", "==", user.uid));
        const unsubscribe = onSnapshot(memberQuery, async (snapshot) => {
            if (snapshot.empty) {
                setTeams([]);
                setLoading(false);
                return;
            }

            const teamIds = snapshot.docs.map(doc => (doc.data() as TeamMember).teamId);
            
            // Deduplicate team IDs
            const uniqueTeamIds = [...new Set(teamIds)];

            if (uniqueTeamIds.length === 0) {
                 setTeams([]);
                 setLoading(false);
                 return;
            }

            // Fetch details for each team
            const teamPromises = uniqueTeamIds.map(id => getDoc(doc(db, 'teams', id)));
            const teamDocs = await Promise.all(teamPromises);
            
            const teamsData: Team[] = [];
            teamDocs.forEach(teamDoc => {
                if (teamDoc.exists()) {
                    teamsData.push({ id: teamDoc.id, ...teamDoc.data() } as Team);
                }
            });

            setTeams(teamsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching shared teams: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
        <div className="flex justify-between items-center mb-12 flex-wrap gap-4">
            <div className="text-left flex-grow">
                <div className="flex items-center gap-4">
                    <UserCheck className="h-10 w-10 text-primary" />
                    <div>
                    <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
                        Equipos Compartidos
                    </h1>
                    <p className="text-lg text-muted-foreground mt-1">
                        Equipos a los que has sido invitado como miembro del cuerpo técnico.
                    </p>
                    </div>
                </div>
            </div>
             <Button asChild variant="outline">
              <Link href="/gestion-equipos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>
            </Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Mis Equipos Compartidos</CardTitle>
                <CardDescription>Lista de equipos en los que colaboras.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : teams.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>No eres miembro de ningún equipo compartido.</p>
                        <p className="text-sm">Cuando aceptes una invitación, el equipo aparecerá aquí.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {teams.map(team => (
                            <Card key={team.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                                <div className="flex-grow">
                                    <h3 className="font-bold text-lg">{team.name}</h3>
                                    <p className="text-sm text-muted-foreground">{team.club}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button asChild>
                                        <Link href={`/equipo/${team.id}`}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            Gestionar Equipo
                                        </Link>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
