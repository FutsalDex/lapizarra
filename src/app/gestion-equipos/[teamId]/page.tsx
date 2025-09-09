
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, UserPlus, Mail, Shield, Trash2, Loader2, Send, Clipboard, ClipboardCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Team {
  name: string;
  club: string;
  ownerId: string;
  ownerRole: string;
}

interface Member {
    id: string;
    email: string;
    role: string;
    name: string;
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
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');

  const [showInviteLinkDialog, setShowInviteLinkDialog] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  useEffect(() => {
    if (!teamId || !user) return;

    const teamDocRef = doc(db, 'teams', teamId);
    
    const unsubscribeTeam = onSnapshot(teamDocRef, (teamDoc) => {
      if (teamDoc.exists()) {
        const teamData = teamDoc.data() as Team;
        if (teamData.ownerId === user.uid) {
            setTeam({ ownerRole: 'Propietario', ...teamData});
        } else {
            router.push('/gestion-equipos');
        }
      } else {
        router.push('/gestion-equipos');
      }
      setLoading(false);
    });
    
    // Listener for members
    const membersQuery = query(collection(db, 'teamMembers'), where('teamId', '==', teamId));
    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
        const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
        setMembers(membersData);
    });

    return () => {
        unsubscribeTeam();
        unsubscribeMembers();
    };

  }, [teamId, user, router]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteRole) {
        toast({ title: "Campos requeridos", description: "Por favor, introduce un email y selecciona un rol.", variant: 'destructive' });
        return;
    }
    setInviting(true);
    try {
        const invitationDoc = await addDoc(collection(db, 'invitations'), {
            teamId,
            teamName: team?.name,
            invitedByUser: user?.uid,
            invitedUserEmail: inviteEmail,
            role: inviteRole,
            status: 'pending',
            createdAt: serverTimestamp(),
        });

        const generatedLink = `${window.location.origin}/invitacion/${invitationDoc.id}`;
        setInviteLink(generatedLink);
        setShowInviteLinkDialog(true);

        toast({ title: "¡Invitación Creada!", description: `Comparte el enlace con ${inviteEmail}.` });
        setInviteEmail('');
        setInviteRole('');
    } catch (error) {
        console.error("Error creating invitation: ", error);
        toast({ title: "Error", description: "Hubo un problema al crear la invitación.", variant: "destructive" });
    } finally {
        setInviting(false);
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000); // Reset after 2 seconds
  };
  

  if (loading) {
    return <div className="container mx-auto max-w-4xl py-12 px-4"><Skeleton className="h-96 w-full" /></div>;
  }
  
  if (!team) {
      return null; // or a not found component
  }

  return (
    <>
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
          <CardDescription>Crea un enlace de invitación para que otros entrenadores o miembros del cuerpo técnico se unan.</CardDescription>
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
                        {roles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
            </div>
            <Button type="submit" disabled={inviting}>
                {inviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Crear Invitación
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

    <AlertDialog open={showInviteLinkDialog} onOpenChange={setShowInviteLinkDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Enlace de Invitación Creado</AlertDialogTitle>
            <AlertDialogDescription>
                Copia este enlace y compártelo con el nuevo miembro. El enlace le permitirá unirse a tu equipo.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="relative rounded-md bg-muted px-4 py-2 font-mono text-sm break-all">
                {inviteLink}
            </div>
            <AlertDialogFooter>
                <Button variant="outline" onClick={copyToClipboard}>
                    {isLinkCopied ? <ClipboardCheck className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}
                    {isLinkCopied ? '¡Copiado!' : 'Copiar Enlace'}
                </Button>
                <AlertDialogAction onClick={() => setShowInviteLinkDialog(false)}>Cerrar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
