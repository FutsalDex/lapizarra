
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Check, X, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Invitation {
  id: string;
  teamId: string;
  teamName: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined';
}

export default function MisInvitacionesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !user.email) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'invitations'),
      where('invitedUserEmail', '==', user.email),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation));
      setInvitations(invitesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching invitations: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleInvitation = async (invitation: Invitation, action: 'accept' | 'decline') => {
    if (!user) return;
    setProcessingId(invitation.id);

    const newStatus = action === 'accept' ? 'accepted' : 'declined';

    try {
        const batch = writeBatch(db);
        
        // Step 1: Update the invitation status
        const invDocRef = doc(db, 'invitations', invitation.id);
        batch.update(invDocRef, { status: newStatus });

        // Step 2: If accepted, add user to the teamMembers collection
        if (action === 'accept') {
            const memberDocRef = doc(collection(db, 'teamMembers')); // new doc with auto-ID
            batch.set(memberDocRef, {
                teamId: invitation.teamId,
                userId: user.uid,
                email: user.email,
                name: user.displayName || 'Sin Nombre',
                role: invitation.role,
                joinedAt: new Date(),
            });
        }
        
        // Commit the batch
        await batch.commit();

        toast({
            title: `Invitación ${newStatus === 'accepted' ? 'aceptada' : 'rechazada'}`,
            description: `Ahora ${newStatus === 'accepted' ? 'eres miembro' : 'no formarás parte'} de ${invitation.teamName}.`,
        });

    } catch (error) {
        console.error(`Error ${action}ing invitation: `, error);
        toast({ title: "Error", description: "Hubo un problema al procesar la invitación.", variant: "destructive" });
    } finally {
        setProcessingId(null);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Mail className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Mis Invitaciones
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Gestiona tus invitaciones pendientes para unirte a equipos.
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : invitations.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">No tienes invitaciones pendientes.</p>
            </CardContent>
          </Card>
        ) : (
          invitations.map(inv => (
            <Card key={inv.id}>
                <CardHeader>
                    <CardTitle>Invitación para unirte a: {inv.teamName}</CardTitle>
                    <CardDescription>Has sido invitado a unirte como <span className="font-semibold text-primary">{inv.role}</span>.</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-end gap-2">
                     <Button
                        variant="destructive"
                        onClick={() => handleInvitation(inv, 'decline')}
                        disabled={!!processingId}
                    >
                        {processingId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                        Rechazar
                    </Button>
                     <Button
                        variant="default"
                        onClick={() => handleInvitation(inv, 'accept')}
                        disabled={!!processingId}
                    >
                        {processingId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Aceptar
                    </Button>
                </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
