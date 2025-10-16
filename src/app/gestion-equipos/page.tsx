
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldPlus, Users, Edit, Trash2, Settings, UserCheck, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, doc, deleteDoc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { useToast } from '@/hooks/use-toast';
import TeamForm from './_components/TeamForm';

interface Team {
    id: string;
    name: string;
    club: string;
    competition?: string;
    ownerId: string;
}

interface UserProfile {
    role: 'Registered' | 'Subscribed' | 'Admin';
    subscription: 'Trial' | 'Básico' | 'Pro';
}

const demoTeam = {
  id: 'demo-team-guest',
  name: 'Equipo Demo (Invitado)',
  club: 'Club de Demostración',
  competition: 'Liga Demo',
  ownerId: 'guest-user',
};


export default function GestionEquiposPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [myTeams, setMyTeams] = useState<Team[]>([]);
    const [sharedTeams, setSharedTeams] = useState<Team[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Fetch user profile to get role
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeUserProfile = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                setUserProfile(doc.data() as UserProfile);
            }
        });

        // Fetch user's own teams
        const myTeamsQuery = query(collection(db, "teams"), where("ownerId", "==", user.uid));
        const unsubscribeMyTeams = onSnapshot(myTeamsQuery, (snapshot) => {
            const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
            setMyTeams(teamsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching teams: ", error);
            setLoading(false);
        });

        // Fetch shared teams
        const memberQuery = query(collection(db, "teamMembers"), where("userId", "==", user.uid));
        const unsubscribeSharedTeams = onSnapshot(memberQuery, async (snapshot) => {
            const teamIds = snapshot.docs.map(doc => doc.data().teamId);
            
            if (teamIds.length === 0) {
                 setSharedTeams([]);
                 return;
            }

            const uniqueTeamIds = [...new Set(teamIds)];
            
            // Firestore 'in' query has a limit of 30 elements.
            // We need to chunk the array if it's larger.
            const chunks: string[][] = [];
            for (let i = 0; i < uniqueTeamIds.length; i += 30) {
                chunks.push(uniqueTeamIds.slice(i, i + 30));
            }

            const teamsData: Team[] = [];

            for (const chunk of chunks) {
                 if (chunk.length > 0) {
                    const teamsQuery = query(collection(db, 'teams'), where('__name__', 'in', chunk));
                    const teamsSnapshot = await getDocs(teamsQuery);
                    teamsSnapshot.forEach(teamDoc => {
                        if (teamDoc.exists()) {
                            teamsData.push({ id: teamDoc.id, ...teamDoc.data() } as Team);
                        }
                    });
                }
            }
            
            setSharedTeams(teamsData);

        }, (error) => {
             console.error("Error fetching shared teams: ", error);
        });


        return () => {
            unsubscribeMyTeams();
            unsubscribeSharedTeams();
            unsubscribeUserProfile();
        };
    }, [user]);

    const handleDeleteTeam = async (teamId: string) => {
        try {
            await deleteDoc(doc(db, "teams", teamId));
            toast({
                title: "Equipo Eliminado",
                description: "El equipo y sus datos asociados han sido eliminados."
            });
        } catch (error) {
            console.error("Error deleting team: ", error);
            toast({
                title: "Error",
                description: "No se pudo eliminar el equipo.",
                variant: "destructive"
            });
        }
    }

    const canCreateTeam = () => {
        if (!user || !userProfile) return false;
        if (userProfile.subscription === 'Pro') return true;
        if ((userProfile.subscription === 'Básico' || userProfile.subscription === 'Trial') && myTeams.length < 1) return true;
        return false;
    }
    
    const getLimitMessage = () => {
        if (!userProfile) return '';
        if (userProfile.subscription === 'Básico' || userProfile.subscription === 'Trial') {
            return 'Has alcanzado el límite de 1 equipo para tu plan. Suscríbete a Pro para crear equipos ilimitados.';
        }
        return '';
    }

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
        <div className="flex justify-between items-center mb-12 flex-wrap gap-4">
            <div className="text-left flex-grow">
                <div className="flex items-center gap-4">
                    <ShieldPlus className="h-10 w-10 text-primary" />
                    <div>
                    <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
                        Gestión de Equipos
                    </h1>
                    <p className="text-lg text-muted-foreground mt-1">
                        Crea y administra tus equipos. Invita a tu cuerpo técnico para colaborar.
                    </p>
                    </div>
                </div>
            </div>
        </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-8">
            {user && canCreateTeam() ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Crear Nuevo Equipo</CardTitle>
                        <CardDescription>Añade un nuevo equipo para empezar a gestionarlo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TeamForm />
                    </CardContent>
                </Card>
            ) : !authLoading && user && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Límite de Equipos Alcanzado</CardTitle>
                        <CardDescription>{getLimitMessage()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Puedes gestionar tus equipos existentes o eliminar alguno para crear uno nuevo.
                        </p>
                    </CardContent>
                     {userProfile?.subscription !== 'Pro' && (
                        <CardFooter>
                           <Button className="w-full" asChild>
                              <Link href="/suscripcion">Ver Planes</Link>
                           </Button>
                        </CardFooter>
                    )}
                </Card>
            )}
            {!user && !authLoading && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Regístrate para crear equipos</CardTitle>
                        <CardDescription>Como invitado, puedes explorar un equipo de demostración.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/register">Crear una cuenta</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
        <div className="lg:col-span-2 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>Mis Equipos</CardTitle>
                    <CardDescription>Lista de equipos que administras como propietario.</CardDescription>
                </CardHeader>
                <CardContent>
                    {(loading || authLoading) ? (
                         <div className="space-y-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ) : (user && myTeams.length === 0 && !canCreateTeam()) ? (
                        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                           <p>No has creado ningún equipo todavía.</p>
                           <p className="text-sm">Usa el formulario para añadir tu primer equipo.</p>
                        </div>
                    ) : (!user) ? (
                         <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 bg-muted/50 border-dashed">
                            <div className="flex-grow">
                                <h3 className="font-bold text-lg">{demoTeam.name}</h3>
                                <p className="text-sm text-muted-foreground">{demoTeam.club}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                <Button asChild>
                                    <Link href={`/equipo/${demoTeam.id}`}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Ver Demo
                                    </Link>
                                </Button>
                                <Button variant="outline" size="sm" disabled><Users className="mr-2 h-4 w-4" />Miembros</Button>
                                <Button variant="ghost" size="icon" disabled><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-destructive" disabled><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {myTeams.map(team => (
                                <Card key={team.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-lg">{team.name}</h3>
                                        <p className="text-sm text-muted-foreground">{team.club}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                        <Button asChild>
                                            <Link href={`/equipo/${team.id}`}>
                                                <Settings className="mr-2 h-4 w-4" />
                                                Gestionar
                                            </Link>
                                        </Button>
                                         <Button asChild variant="outline" size="sm" disabled={userProfile?.subscription === 'Trial'}>
                                            <Link href={`/gestion-equipos/${team.id}`}>
                                                <Users className="mr-2 h-4 w-4" />
                                                Miembros
                                            </Link>
                                        </Button>
                                        <TeamForm teamData={team}>
                                           <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </TeamForm>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro de que quieres eliminar este equipo?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Se borrarán todos los datos asociados al equipo, incluyendo plantillas, partidos y estadísticas.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteTeam(team.id)}>Eliminar Equipo</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
             </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5"/>
                        Equipos Compartidos
                    </CardTitle>
                    <CardDescription>Equipos a los que has sido invitado como miembro del cuerpo técnico.</CardDescription>
                </CardHeader>
                <CardContent>
                    {(loading || authLoading) ? (
                         <div className="space-y-4">
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ) : sharedTeams.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                           <p>No eres miembro de ningún equipo compartido.</p>
                           <p className="text-sm">Cuando aceptes una invitación, el equipo aparecerá aquí.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sharedTeams.map(team => (
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
      </div>
    </div>
  );
}
