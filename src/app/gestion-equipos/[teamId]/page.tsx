
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, UserPlus, Mail, Shield, Trash2, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface Team {
  name: string;
  club: string;
  ownerId: string;
}

interface Member {
    id: string;
    email: string;
    role: string;
}

export default function TeamMembersPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');

  useEffect(() => {
    if (!teamId) return;

    const teamDocRef = doc(db, 'teams', teamId);
    const getTeamData = async () => {
      const teamDoc = await getDoc(teamDocRef);
      if (teamDoc.exists()) {
        const teamData = teamDoc.data() as Team;
        // Basic authorization: only owner can view for now
        if (user && teamData.ownerId === user.uid) {
            setTeam(teamData);
        } else {
             // Redirect if not authorized
            router.push('/gestion-equipos');
        }
      } else {
        router.push('/gestion-equipos');
      }
      setLoading(false);
    };

    getTeamData();
    
    // Listener for members
    const membersQuery = query(collection(db, 'teamMembers'), where('teamId', '==', teamId));
    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
        const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
        setMembers(membersData);
    });

    return () => unsubscribe();

  }, [teamId, user, router]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteRole) {
        toast({ title: "Campos requeridos", description: "Por favor, introduce un email y selecciona un rol.", variant: 'destructive' });
        return;
    }
    setInviting(true);
    try {
        await addDoc(collection(db, 'invitations'), {
            teamId,
            teamName: team?.name,
            invitedByUser: user?.uid,
            invitedUserEmail: inviteEmail,
            role: inviteRole,
            status: 'pending',
            createdAt: serverTimestamp(),
        });
        toast({ title: "¡Invitación Enviada!", description: `Se ha enviado una invitación a ${inviteEmail}.` });
        setInviteEmail('');
        setInviteRole('');
    } catch (error) {
        console.error("Error sending invitation: ", error);
        toast({ title: "Error", description: "Hubo un problema al enviar la invitación.", variant: "destructive" });
    } finally {
        setInviting(false);
    }
  }
  

  if (loading) {
    return <div className="container mx-auto max-w-4xl py-12 px-4"><Skeleton className="h-96 w-full" /></div>;
  }
  
  if (!team) {
      return null; // or a not found component
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 space-y-8">
      <div>
        <Button asChild variant="outline" className="mb-4">
          <Link href="/gestion-equipos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Mis Equipos
          </Link>
        </Button>
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">{team.name}</h1>
        <p className="text-lg text-muted-foreground">{team.club}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserPlus />Invitar Nuevo Miembro</CardTitle>
          <CardDescription>Invita a otros entrenadores o miembros del cuerpo técnico a colaborar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email del invitado</label>
                <div className="relative">
                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input id="email" type="email" placeholder="email@ejemplo.com" className="pl-10" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                </div>
            </div>
            <div className="space-y-2">
                 <label htmlFor="role" className="text-sm font-medium">Rol</label>
                 <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger id="role">
                       <div className="flex items-center gap-2">
                         <Shield className="h-4 w-4 text-muted-foreground" />
                         <SelectValue placeholder="Selecciona un rol" />
                       </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Entrenador">Entrenador</SelectItem>
                        <SelectItem value="2º Entrenador">2º Entrenador</SelectItem>
                        <SelectItem value="Delegado">Delegado</SelectItem>
                        <SelectItem value="Preparador Físico">Preparador Físico</SelectItem>
                        <SelectItem value="Analista Táctico/Scouting">Analista Táctico/Scouting</SelectItem>
                        <SelectItem value="Fisioterapeuta">Fisioterapeuta</SelectItem>
                        <SelectItem value="Médico">Médico</SelectItem>
                        <SelectItem value="Psicólogo">Psicólogo</SelectItem>
                        <SelectItem value="Nutricionista">Nutricionista</SelectItem>
                    </SelectContent>
                 </Select>
            </div>
            <Button type="submit" disabled={inviting}>
                {inviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Enviar Invitación
            </Button>
          </form>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>Miembros del Equipo</CardTitle>
          <CardDescription>Lista de usuarios con acceso a este equipo.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Owner */}
                        <TableRow>
                            <TableCell className="font-medium">{user?.email}</TableCell>
                            <TableCell>Propietario</TableCell>
                            <TableCell className="text-right"></TableCell>
                        </TableRow>
                        {members.map(member => (
                             <TableRow key={member.id}>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>{member.role}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             {members.length === 0 && (
                <p className="text-sm text-muted-foreground text-center mt-4">Aún no has añadido a nadie al equipo.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
