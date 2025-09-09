
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldPlus, Users, Edit, Trash2 } from 'lucide-react';
import CreateTeamForm from './_components/CreateTeamForm';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface Team {
    id: string;
    name: string;
    club: string;
    ownerId: string;
}

export default function GestionEquiposPage() {
    const { user } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        const q = query(collection(db, "teams"), where("ownerId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
            setTeams(teamsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching teams: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
       <div className="text-left mb-12">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Crear Nuevo Equipo</CardTitle>
                    <CardDescription>Añade un nuevo equipo para empezar a gestionarlo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CreateTeamForm />
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
             <Card>
                <CardHeader>
                    <CardTitle>Mis Equipos</CardTitle>
                    <CardDescription>Lista de equipos que administras.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="space-y-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ) : teams.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                           <p>No has creado ningún equipo todavía.</p>
                           <p className="text-sm">Usa el formulario para añadir tu primer equipo.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {teams.map(team => (
                                <Card key={team.id} className="flex items-center justify-between p-4">
                                    <div>
                                        <h3 className="font-bold">{team.name}</h3>
                                        <p className="text-sm text-muted-foreground">{team.club}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm">
                                            <Users className="mr-2 h-4 w-4" />
                                            Gestionar Miembros
                                        </Button>
                                         <Button variant="ghost" size="icon">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                         <Button variant="ghost" size="icon" className="text-destructive">
                                            <Trash2 className="h-4 w-4" />
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
