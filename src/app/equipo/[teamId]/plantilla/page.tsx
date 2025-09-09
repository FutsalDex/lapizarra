
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, PlusCircle, Trash2, Save, ArrowLeft, Shield } from 'lucide-react';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';


const initialPlayers = [
    { id: '1', number: 1, name: 'Manel', position: 'Portero', active: true, pj: 5, goals: 0, ta: 0, tr: 0, faltas: 0, paradas: 8, gRec: 5, smvp: 4 },
    { id: '2', number: 2, name: 'Victor', position: 'Cierre', active: true, pj: 3, goals: 1, ta: 0, tr: 0, faltas: 1, paradas: 0, gRec: 0, smvp: 0 },
    { id: '3', number: 3, name: 'Marc Muñoz', position: 'Ala-Pívot', active: true, pj: 5, goals: 1, ta: 1, tr: 0, faltas: 0, paradas: 2, gRec: 0, smvp: 0 },
    { id: '4', number: 4, name: 'Marc Montoro', position: 'Cierre', active: true, pj: 3, goals: 1, ta: 0, tr: 0, faltas: 4, paradas: 0, gRec: 0, smvp: 0 },
    { id: '5', number: 5, name: 'Roger', position: 'Pívot', active: true, pj: 5, goals: 2, ta: 0, tr: 0, faltas: 2, paradas: 0, gRec: 0, smvp: 0 },
    { id: '6', number: 6, name: 'Marc Romeia', position: 'Ala', active: true, pj: 3, goals: 2, ta: 0, tr: 0, faltas: 0, paradas: 0, gRec: 0, smvp: 0 },
    { id: '7', number: 7, name: 'Hugo', position: 'Pívot', active: true, pj: 5, goals: 0, ta: 0, tr: 0, faltas: 1, paradas: 0, gRec: 0, smvp: 0 },
    { id: '8', number: 8, name: 'Dani', position: 'Ala', active: true, pj: 3, goals: 1, ta: 1, tr: 0, faltas: 3, paradas: 0, gRec: 0, smvp: 0 },
    { id: '9', number: 9, name: 'Iker Rando', position: 'Ala', active: true, pj: 5, goals: 4, ta: 1, tr: 0, faltas: 1, paradas: 0, gRec: 0, smvp: 0 },
    { id: '10', number: 10, name: 'Salva', position: 'Ala-Pívot', active: true, pj: 5, goals: 1, ta: 1, tr: 0, faltas: 0, paradas: 0, gRec: 0, smvp: 0 },
    { id: '11', number: 11, name: 'Lucen', position: 'Portero', active: true, pj: 5, goals: 0, ta: 0, tr: 0, faltas: 0, paradas: 7, gRec: 2, smvp: 4 },
];

interface Team {
  id: string;
  name: string;
  club: string;
  competition?: string;
  ownerId: string;
  ownerRole?: string;
}

interface Member {
    id: string;
    name: string;
    role: string;
}


export default function TeamRosterPage() {
    const params = useParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const teamId = params.teamId as string;
    const [players, setPlayers] = useState(initialPlayers);
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!teamId) return;

        const teamDocRef = doc(db, 'teams', teamId);
        const unsubscribeTeam = onSnapshot(teamDocRef, (doc) => {
            if (doc.exists()) {
                setTeam({ id: doc.id, ...doc.data() } as Team);
            }
            setLoading(false);
        });

        const membersQuery = query(collection(db, 'teamMembers'), where('teamId', '==', teamId));
        const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
            const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
            setMembers(membersData);
        });

        return () => {
            unsubscribeTeam();
            unsubscribeMembers();
        };
    }, [teamId]);

    const handleActiveChange = (playerId: string, checked: boolean) => {
        setPlayers(prevPlayers => prevPlayers.map(p => p.id === playerId ? {...p, active: checked} : p));
    }
    
    const handleSave = () => {
        // Here you would typically save the data to Firestore
        toast({
            title: "¡Plantilla Guardada!",
            description: "Los cambios en la plantilla han sido guardados con éxito.",
        });
    }

    if (loading) {
        return (
             <div className="container mx-auto max-w-7xl py-12 px-4 space-y-8">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-96 w-full mt-8" />
            </div>
        )
    }
    
    if (!team) {
        return <div>Equipo no encontrado.</div>
    }

  return (
    <div className="container mx-auto max-w-7xl py-12 px-4">
       <div className="flex justify-between items-center mb-8">
            <div className="text-left">
                <div className="flex items-center gap-4">
                    <Users className="h-10 w-10 text-primary" />
                    <div>
                    <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
                        Mi Plantilla
                    </h1>
                    <p className="text-lg text-muted-foreground mt-1">
                        Gestiona la plantilla de tu equipo y consulta sus estadísticas de la temporada.
                    </p>
                    </div>
                </div>
            </div>
             <Button asChild variant="outline">
                <Link href={`/equipo/${teamId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Panel
                </Link>
            </Button>
      </div>

        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Información del Equipo</CardTitle>
                <CardDescription>Datos generales del equipo y cuerpo técnico.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="club-name">Club</Label>
                        <Input id="club-name" value={team.club} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="team-name">Equipo</Label>
                        <Input id="team-name" value={team.name} disabled />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="main-championship">Competición</Label>
                        <Input id="main-championship" value={team.competition || 'No especificada'} disabled />
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Cuerpo Técnico</h4>
                    <div className="rounded-md border p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{user?.displayName || user?.email?.split('@')[0]}</p>
                                <p className="text-xs text-muted-foreground">{team.ownerRole || 'Propietario'}</p>
                            </div>
                        </div>
                        {members.map(member => (
                            <div key={member.id} className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{member.name}</p>
                                    <p className="text-xs text-muted-foreground">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>


      <Card>
        <CardHeader>
          <CardTitle>Plantilla del Equipo</CardTitle>
          <CardDescription>Introduce los datos de tus jugadores. Máximo 20. Solo los jugadores "Activos" aparecerán en el módulo de partidos.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[5%]">Dorsal</TableHead>
                        <TableHead className="w-[20%]">Nombre</TableHead>
                        <TableHead className="w-[15%]">Posición</TableHead>
                        <TableHead className="w-[5%]">Activo</TableHead>
                        <TableHead className="text-center">PJ</TableHead>
                        <TableHead className="text-center">Goles</TableHead>
                        <TableHead className="text-center">T.A.</TableHead>
                        <TableHead className="text-center">T.R.</TableHead>
                        <TableHead className="text-center">Faltas</TableHead>
                        <TableHead className="text-center">Paradas</TableHead>
                        <TableHead className="text-center">G. Rec.</TableHead>
                        <TableHead className="text-center">MVP</TableHead>
                        <TableHead className="text-right w-[10%]">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {players.map((player) => (
                        <TableRow key={player.id}>
                            <TableCell><Input defaultValue={player.number} className="h-8 w-14 text-center" /></TableCell>
                            <TableCell><Input defaultValue={player.name} className="h-8" /></TableCell>
                            <TableCell>
                                <Select defaultValue={player.position}>
                                    <SelectTrigger className="h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Portero">Portero</SelectItem>
                                        <SelectItem value="Cierre">Cierre</SelectItem>
                                        <SelectItem value="Ala">Ala</SelectItem>
                                        <SelectItem value="Pívot">Pívot</SelectItem>
                                        <SelectItem value="Ala-Pívot">Ala-Pívot</SelectItem>
                                        <SelectItem value="Universal">Universal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell className="text-center"><Switch checked={player.active} onCheckedChange={(checked) => handleActiveChange(player.id, checked)} /></TableCell>
                            <TableCell className="text-center">{player.pj}</TableCell>
                            <TableCell className="text-center">{player.goals}</TableCell>
                            <TableCell className="text-center">{player.ta}</TableCell>
                            <TableCell className="text-center">{player.tr}</TableCell>
                            <TableCell className="text-center">{player.faltas}</TableCell>
                            <TableCell className="text-center">{player.paradas}</TableCell>
                            <TableCell className="text-center">{player.gRec}</TableCell>
                            <TableCell className="text-center">{player.smvp}</TableCell>
                            <TableCell className="text-right">
                                 <Button variant="ghost" size="icon" className="hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>
            <div className="flex justify-between mt-4">
                 <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" />Añadir Jugador</Button>
                 <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" />Guardar Plantilla</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
