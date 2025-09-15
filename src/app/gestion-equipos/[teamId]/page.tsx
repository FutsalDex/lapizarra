
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: '' });
  const [processingMember, setProcessingMember] = useState<string | null>(null);


  useEffect(() => {
    if (!teamId || !user) return;

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

    return () => {
        unsubscribeTeam();
        unsubscribeMembers();
    };

  }, [teamId, user, router]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.email || !newMember.role || !newMember.name) {
        toast({ title: "Campos requeridos", description: "Por favor, completa todos los campos.", variant: 'destructive' });
        return;
    }
    setProcessingMember('new');
    try {
        await addDoc(collection(db, 'teamMembers'), {
            teamId,
            name: newMember.name,
            email: newMember.email,
            role: newMember.role,
            joinedAt: new Date(),
        });
        toast({ title: "¡Miembro añadido!", description: `${newMember.name} ha sido añadido al equipo.` });
        setNewMember({ name: '', email: '', role: '' });
        setIsDialogOpen(false);
    } catch (error) {
        console.error("Error adding member: ", error);
        toast({ title: "Error", description: "Hubo un problema al añadir al miembro.", variant: "destructive" });
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
                 <Button><UserPlus className="mr-2 h-4 w-4" />Alta de nuevo miembro</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Añadir nuevo miembro al cuerpo técnico</DialogTitle>
                    <DialogDescription>Introduce los datos del nuevo miembro. Se le dará acceso al panel de este equipo si su email coincide con una cuenta registrada.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddMember} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-member-name">Nombre</Label>
                        <Input id="new-member-name" value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} placeholder="Nombre y Apellidos" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="new-member-email">Email</Label>
                        <Input id="new-member-email" type="email" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} placeholder="email@ejemplo.com" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="new-member-role">Rol</Label>
                         <Select value={newMember.role} onValueChange={(value) => setNewMember({...newMember, role: value})}>
                            <SelectTrigger id="new-member-role">
                               <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map(role => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                ))}
                            </SelectContent>
                         </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={!!processingMember}>
                            {processingMember === 'new' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Añadir Miembro
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>
      
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
                                    <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDeleteMember(member.id)} disabled={!!processingMember}>
                                        {processingMember === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             {members.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground text-center mt-4">Aún no has añadido a nadie al equipo.</p>
            )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
