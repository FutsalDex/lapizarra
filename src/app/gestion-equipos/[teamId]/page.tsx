
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, deleteDoc, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, UserPlus, Mail, Shield, Trash2, Loader2, Send, Clipboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
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
import { Label } from '@/components/ui/label';

interface Team {
  name: string;
  club: string;
  ownerId: string;
  ownerRole: string;
}

interface UserProfile {
    role: 'Registered' | 'Subscribed' | 'Admin';
    subscription: 'Trial' | 'Básico' | 'Pro';
}

interface Member {
    id: string;
    email: string;
    role: string;
    name: string;
}

interface Invitation {
    id: string;
    name: string;
    invitedUserEmail: string;
    role: string;
    status: 'pending' | 'accepted' | 'declined';
}

const roles = [
    'Entrenador',
    '2º Entrenador',
    'Delegado',
    'Preparador Físico',
    'Analista Táctico/Scouting',
    'Fisioterapeuta',
    'Médico',
    'Psicólogo',
    'Nutricionista'
];

export default function TeamMembersPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: '' });
  const [processingMember, setProcessingMember] = useState<string | null>(null);
  const [invitationLink, setInvitationLink] = useState('');
  const [isInviteLinkDialogOpen, setIsInviteLinkDialogOpen] = useState(false);


  useEffect(() => {
    if (!teamId || !user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
        if(doc.exists()) {
            setUserProfile(doc.data() as UserProfile);
        }
    })

    const teamDocRef = doc(db, 'teams', teamId);
    
    const unsubscribeTeam = onSnapshot(teamDocRef, (teamDoc) => {
      if (teamDoc.exists()) {
        const teamData = teamDoc.data() as Team;
        if (teamData.ownerId === user.uid) {
            setTeam({ ownerRole: teamData.ownerRole || 'Propietario', ...teamData});
        } else {
            router.push('/gestion-equipos');
        }
      } else {
        router.push('/gestion-equipos');
      }
      setLoading(false);
    });
    
    const membersQuery = query(collection(db, 'teamMembers'), where('teamId', '==', teamId));
    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
        const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
        setMembers(membersData);
    });
    
    const invitesQuery = query(collection(db, 'invitations'), where('teamId', '==', teamId));
    const unsubscribeInvites = onSnapshot(invitesQuery, (snapshot) => {
        const invitesData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data() } as Invitation));
        setInvitations(invitesData);
    })

    return () => {
        unsubscribeTeam();
        unsubscribeMembers();
        unsubscribeInvites();
        unsubscribeUser();
    };

  }, [teamId, user, router]);
  

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.email || !newMember.role || !newMember.name || !team) {
        toast({ title: "Campos requeridos", description: "Por favor, completa todos los campos.", variant: 'destructive' });
        return;
    }

    if(userProfile?.subscription === 'Trial') {
         toast({ title: "Función no disponible", description: "Mejora tu plan para invitar miembros al cuerpo técnico.", variant: 'destructive' });
         return;
    }

    setProcessingMember('new');
    try {
        const newInvitationRef = doc(collection(db, 'invitations'));
        
        await setDoc(newInvitationRef, {
            teamId,
            teamName: team.name,
            name: newMember.name,
            role: newMember.role,
            invitedUserEmail: newMember.email,
            status: 'pending',
            createdAt: new Date(),
        });

        const link = `${window.location.origin}/invitacion/${newInvitationRef.id}`;
        setInvitationLink(link);

        toast({ title: "¡Invitación Creada!", description: `Comparte el enlace con ${newMember.name}.` });
        setNewMember({ name: '', email: '', role: '' });
        setIsDialogOpen(false);
        setIsInviteLinkDialogOpen(true);

    } catch (error) {
        console.error("Error creating invitation: ", error);
        toast({ title: "Error", description: "Hubo un problema al crear la invitación.", variant: "destructive" });
    } finally {
        setProcessingMember(null);
    }
  }


  const handleOwnerRoleChange = async (newRole: string) => {
      if (!teamId) return;
      const teamDocRef = doc(db, 'teams', teamId);
      try {
          await updateDoc(teamDocRef, { ownerRole: newRole });
          setTeam(prev => prev ? { ...prev, ownerRole: newRole } : null);
          toast({ title: 'Rol actualizado', description: `Tu nuevo rol en el equipo es ${newRole}.`});
      } catch (error) {
          console.error("Error updating owner role:", error);
          toast({ title: 'Error', description: 'No se pudo actualizar tu rol.', variant: 'destructive'});
      }
  }

  const handleDeleteMember = async (memberId: string) => {
    setProcessingMember(memberId);
    try {
        await deleteDoc(doc(db, 'teamMembers', memberId));
        toast({ title: "Miembro eliminado", description: "El usuario ha sido eliminado del equipo." });
    } catch (error) {
        console.error("Error deleting member:", error);
        toast({ title: "Error", description: "No se pudo eliminar al miembro.", variant: "destructive" });
    } finally {
        setProcessingMember(null);
    }
  }
  
  if (loading) {
    return <div className="container mx-auto max-w-4xl py-12 px-4"><Skeleton className="h-96 w-full" /></div>;
  }
  
  if (!team) {
      return null; // or a not found component
  }

  return (
    <>
    <div className="container mx-auto max-w-4xl py-12 px-4 space-y-8">
      <div className="flex justify-between items-start">
        <div>
            <Button asChild variant="outline" className="mb-4">
            <Link href="/gestion-equipos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Gestión de Equipos
            </Link>
            </Button>
            <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">{team.name}</h1>
            <p className="text-lg text-muted-foreground">{team.club}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                 <Button disabled={userProfile?.subscription === 'Trial'}><UserPlus className="mr-2 h-4 w-4" />Añadir nuevo miembro</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invitar nuevo miembro al cuerpo técnico</DialogTitle>
                    <DialogDescription>Introduce los datos del nuevo miembro. Se generará un enlace de invitación para que se una.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateInvitation} className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-member-name">Nombre</Label>
                            <div className="relative">
                               <UserPlus className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                               <Input id="new-member-name" value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} placeholder="Nombre y Apellidos" className="pl-8" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-member-email">Email</Label>
                             <div className="relative">
                               <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                               <Input id="new-member-email" type="email" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} placeholder="email@ejemplo.com" className="pl-8" />
                            </div>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="new-member-role">Rol</Label>
                         <div className="relative">
                           <Shield className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                           <Select value={newMember.role} onValueChange={(value) => setNewMember({...newMember, role: value})}>
                                <SelectTrigger id="new-member-role" className="pl-8">
                                <SelectValue placeholder="Selecciona un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(role => (
                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={!!processingMember}>
                            {processingMember === 'new' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Crear Invitación
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>
      
       <Card>
        <CardHeader>
          <CardTitle>Miembros del Equipo</CardTitle>
          <CardDescription>Lista de usuarios con acceso a este equipo. Desde aquí puedes enviar invitaciones o eliminar miembros.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Owner */}
                        <TableRow>
                            <TableCell className="font-medium">{user?.displayName || user?.email?.split('@')[0]}</TableCell>
                            <TableCell>{user?.email}</TableCell>
                            <TableCell>
                                <Select value={team.ownerRole} onValueChange={handleOwnerRoleChange}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Selecciona un rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Propietario">Propietario</SelectItem>
                                        {roles.map(role => (
                                            <SelectItem key={role} value={role}>{role}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell className="text-right"></TableCell>
                        </TableRow>
                        {members.map(member => (
                             <TableRow key={member.id}>
                                <TableCell>{member.name || member.email?.split('@')[0]}</TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>{member.role}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="hover:text-destructive" disabled={!!processingMember}>
                                                 <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Eliminar a {member.name}?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. El usuario perderá el acceso a este equipo.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteMember(member.id)}>Eliminar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                        {invitations.filter(i => i.status === 'pending').map(invite => (
                             <TableRow key={invite.id} className="bg-muted/50">
                                <TableCell>{invite.name}</TableCell>
                                <TableCell>{invite.invitedUserEmail}</TableCell>
                                <TableCell>{invite.role} (Pendiente)</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        const link = `${window.location.origin}/invitacion/${invite.id}`;
                                        setInvitationLink(link);
                                        setIsInviteLinkDialogOpen(true);
                                    }}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             {members.length === 0 && invitations.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground text-center mt-4">Aún no has añadido a nadie al equipo.</p>
            )}
        </CardContent>
      </Card>
    </div>

     {/* Invite Link Dialog */}
    <Dialog open={isInviteLinkDialogOpen} onOpenChange={setIsInviteLinkDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Enlace de Invitación Creado</DialogTitle>
                <DialogDescription>
                    Comparte este enlace con el miembro de tu equipo para que pueda unirse. El enlace es de un solo uso.
                </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 pt-4">
                <Input value={invitationLink} readOnly />
                <Button onClick={() => {
                    navigator.clipboard.writeText(invitationLink);
                    toast({ title: '¡Copiado!', description: 'El enlace de invitación se ha copiado al portapapeles.' });
                }} size="icon">
                    <Clipboard className="h-4 w-4" />
                </Button>
            </div>
             <DialogFooter>
                <DialogClose asChild>
                    <Button>Cerrar</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
