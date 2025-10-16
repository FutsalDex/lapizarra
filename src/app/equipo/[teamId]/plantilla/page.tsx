
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
import { Users, PlusCircle, Trash2, Save, ArrowLeft, Shield, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { doc, onSnapshot, query, collection, where, writeBatch, addDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const demoPlayers = [
    { id: 'demo1', number: 1, name: 'Portero Demo', position: 'Portero', active: true },
    { id: 'demo2', number: 5, name: 'Cierre Demo', position: 'Cierre', active: true },
    { id: 'demo3', number: 7, name: 'Ala Izquierdo', position: 'Ala', active: true },
    { id: 'demo4', number: 10, name: 'Ala Derecho', position: 'Ala', active: true },
    { id: 'demo5', number: 9, name: 'Pívot Demo', position: 'Pívot', active: true },
];

const demoTeamData = {
    id: 'demo-team-guest',
    name: 'Equipo Demo',
    club: 'Club de Demostración',
    competition: 'Liga Demo',
    ownerId: 'guest',
    ownerRole: 'Propietario (Demo)'
}

const demoMembers = [
    { id: 'demomember1', name: '2º Entrenador (Demo)', role: '2º Entrenador' }
]


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

interface Player {
    id: string;
    number: number;
    name: string;
    position: string;
    active: boolean;
}


export default function TeamRosterPage() {
    const params = useParams();
    const { user, db } = useAuth();
    const { toast } = useToast();
    const teamId = params.teamId as string;
    const isDemoMode = teamId === 'demo-team-guest';

    const [players, setPlayers] = useState<Player[]>([]);
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isDemoMode) {
            setTeam(demoTeamData);
            setPlayers(demoPlayers);
            setMembers(demoMembers);
            setLoading(false);
            return;
        }

        if (!teamId || !db) return;

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
        
        const playersQuery = query(collection(db, 'teams', teamId, 'players'));
        const unsubscribePlayers = onSnapshot(playersQuery, (snapshot) => {
            const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
            setPlayers(playersData.sort((a,b) => a.number - b.number));
        })

        return () => {
            unsubscribeTeam();
            unsubscribeMembers();
            unsubscribePlayers();
        };
    }, [teamId, isDemoMode, db]);

    const handlePlayerChange = (playerId: string, field: keyof Omit<Player, 'id' | 'active'>, value: any) => {
        setPlayers(prevPlayers => prevPlayers.map(p => p.id === playerId ? {...p, [field]: value} : p));
    }
    
    const handleSave = async () => {
        if (isDemoMode) {
            toast({ title: "Modo Demostración", description: "No se pueden guardar cambios en el modo de demostración." });
            return;
        }
        if (!db) return;
        setIsSaving(true);
        const batch = writeBatch(db);
        
        players.forEach(player => {
            const playerRef = doc(db, 'teams', teamId, 'players', player.id);
            batch.update(playerRef, { 
                name: player.name,
                number: player.number,
                position: player.position,
            });
        });
        
        try {
            await batch.commit();
            toast({
                title: "¡Plantilla Guardada!",
                description: "Los cambios en la plantilla han sido guardados con éxito.",
            });
        } catch (error) {
             console.error("Error saving roster: ", error);
             toast({ title: "Error", description: "No se pudo guardar la plantilla.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }
    
    const handleAddPlayer = async () => {
        if (isDemoMode) {
            toast({ title: "Modo Demostración", description: "No se pueden añadir jugadores en el modo de demostración." });
            return;
        }
        if (!db) return;
        setIsSaving(true);
        try {
            await addDoc(collection(db, 'teams', teamId, 'players'), {
                name: 'Nuevo Jugador',
                number: 99,
                position: 'Ala',
                active: true,
                pj: 0,
                goals: 0,
                assists: 0,
                ta: 0,
                tr: 0,
                faltas: 0,
                paradas: 0,
                gRec: 0,
                minutosJugados: 0
            });
             toast({ title: "Jugador Añadido", description: "Se ha añadido un nuevo jugador a la plantilla." });
        } catch (error) {
             console.error("Error adding player: ", error);
             toast({ title: "Error", description: "No se pudo añadir el jugador.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }

    const handleDeletePlayer = async (playerId: string) => {
        if (isDemoMode) {
            toast({ title: "Modo Demostración", description: "No se pueden eliminar jugadores en el modo de demostración." });
            return;
        }
        if (!db) return;
         setIsSaving(true);
         try {
             await deleteDoc(doc(db, 'teams', teamId, 'players', playerId));
             toast({ title: "Jugador Eliminado", description: "El jugador ha sido eliminado de la plantilla." });
         } catch (error) {
              console.error("Error deleting player: ", error);
              toast({ title: "Error", description: "No se pudo eliminar al jugador.", variant: "destructive" });
         } finally {
             setIsSaving(false);
         }
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
    <div className="container mx-auto max-w-7xl py-12 px-4 space-y-8">
       <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
            <div className="text-left">
                <div className="flex items-center gap-4">
                    <Users className="h-10 w-10 text-primary" />
                    <div>
                    <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
                        Mi Plantilla
                    </h1>
                    <p className="text-lg text-muted-foreground mt-1">
                        Gestiona la plantilla de tu equipo y sus datos principales.
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

        <Card>
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
                                <p className="font-medium">{ isDemoMode ? 'Propietario (Demo)' : (user?.displayName || user?.email?.split('@')[0])}</p>
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
          <CardDescription>Introduce los datos de tus jugadores. Máximo 20. Todos los jugadores estarán disponibles para la convocatoria.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border overflow-x-auto">
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[8%]">Dorsal</TableHead>
                        <TableHead className="w-[25%] min-w-[150px]">Nombre</TableHead>
                        <TableHead className="w-[20%] min-w-[150px]">Posición</TableHead>
                        <TableHead className="text-right w-[10%]">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {players.map((player) => (
                        <TableRow key={player.id}>
                            <TableCell className="py-0"><Input value={player.number} onChange={(e) => handlePlayerChange(player.id, 'number', parseInt(e.target.value) || 0)} className="h-8 w-14 text-center" disabled={isDemoMode} /></TableCell>
                            <TableCell className="py-0"><Input value={player.name} onChange={(e) => handlePlayerChange(player.id, 'name', e.target.value)} className="h-8" disabled={isDemoMode} /></TableCell>
                            <TableCell className="py-0">
                                <Select value={player.position} onValueChange={(value) => handlePlayerChange(player.id, 'position', value)} disabled={isDemoMode}>
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
                            <TableCell className="text-right py-0">
                                 <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDeletePlayer(player.id)} disabled={isSaving || isDemoMode}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                 <Button variant="outline" onClick={handleAddPlayer} disabled={isSaving || players.length >= 20 || isDemoMode}><PlusCircle className="mr-2 h-4 w-4" />Añadir Jugador</Button>
                 <Button onClick={handleSave} disabled={isSaving || isDemoMode}>
                     {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                     Guardar Plantilla
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
