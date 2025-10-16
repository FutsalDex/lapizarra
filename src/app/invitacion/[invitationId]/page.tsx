
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, writeBatch, collection, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Loader2, Check, X, Mail, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Invitation {
  id: string;
  teamId: string;
  teamName: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedUserEmail: string;
}

export default function InvitationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const invitationId = params.invitationId as string;

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const redirectUrl = searchParams.get('redirect');

  useEffect(() => {
    if (!invitationId) return;

    const fetchInvitation = async () => {
      setLoading(true);
      const invDocRef = doc(db, 'invitations', invitationId);
      const invDoc = await getDoc(invDocRef);

      if (!invDoc.exists()) {
        setError('Esta invitación no es válida o ha caducado.');
      } else {
        const invData = { id: invDoc.id, ...invDoc.data() } as Invitation;
        
        if (user && user.email !== invData.invitedUserEmail) {
            setError('Esta invitación está dirigida a otro usuario. Por favor, inicia sesión con la cuenta correcta.');
        } else if (invData.status !== 'pending') {
             setError(`Esta invitación ya ha sido ${invData.status === 'accepted' ? 'aceptada' : 'rechazada'}.`);
        } else {
            setInvitation(invData);
        }
      }
      setLoading(false);
    };

    if (!authLoading) {
      fetchInvitation();
    }
  }, [invitationId, user, authLoading]);

  const handleResponse = async (action: 'accept' | 'decline') => {
      if (!user || !invitation) return;
      setProcessing(true);
      
      const newStatus = action === 'accept' ? 'accepted' : 'declined';
      
      try {
          const batch = writeBatch(db);
          const invDocRef = doc(db, 'invitations', invitation.id);
          batch.update(invDocRef, { status: newStatus });

          if (action === 'accept') {
              const memberDocRef = doc(collection(db, 'teamMembers'));
              batch.set(memberDocRef, {
                  teamId: invitation.teamId,
                  userId: user.uid,
                  email: user.email,
                  name: user.displayName || user.email?.split('@')[0],
                  role: invitation.role,
                  joinedAt: new Date(),
              });
          }

          await batch.commit();

          toast({
              title: `Invitación ${newStatus === 'accepted' ? 'aceptada' : 'rechazada'}`,
              description: `Ahora ${newStatus === 'accepted' ? `eres miembro de ${invitation.teamName}` : 'has rechazado la invitación'}.`,
          });

          if (action === 'accept') {
            router.push(`/equipo/${invitation.teamId}`);
          } else {
            router.push('/gestion-equipos');
          }

      } catch (e) {
          console.error('Error handling invitation:', e);
          toast({ title: 'Error', description: 'No se pudo procesar tu respuesta.', variant: 'destructive' });
          setProcessing(false);
      }
  };


  if (loading || authLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  const fullRedirectUrl = redirectUrl ? `${redirectUrl}?invitationId=${invitationId}` : `/login?redirect=/invitacion/${invitationId}`;

  if (!user) {
      return (
           <div className="container mx-auto max-w-lg py-12 px-4">
               <Card>
                <CardHeader>
                    <CardTitle>Acción Requerida</CardTitle>
                    <CardDescription>Para aceptar esta invitación, por favor, inicia sesión o regístrate.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {invitation ? (
                            <>
                                Como <span className="font-semibold text-primary">{invitation.role}</span>, estás a punto de unirte al equipo <span className="font-semibold text-primary">{invitation.teamName}</span>. Asegúrate de usar la cuenta con la que fuiste invitado (<span className="font-semibold">{invitation.invitedUserEmail}</span>).
                            </>
                        ) : (
                            "Estás a punto de unirte a un equipo. Asegúrate de usar la cuenta con la que fuiste invitado."
                        )}
                    </p>
                </CardContent>
                <CardFooter className="grid grid-cols-2 gap-4">
                     <Button asChild>
                        <Link href={fullRedirectUrl}>Iniciar Sesión</Link>
                     </Button>
                      <Button asChild variant="outline">
                        <Link href={`/register?redirect=/invitacion/${invitationId}`}>Registrarse</Link>
                     </Button>
                </CardFooter>
               </Card>
           </div>
      )
  }

  if (error || !invitation) {
      return (
           <div className="container mx-auto max-w-lg py-12 px-4">
               <Card className="border-destructive">
                <CardHeader className="text-center">
                    <div className="mx-auto w-fit rounded-full bg-destructive/10 p-3">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Error de Invitación</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground">{error || 'Ha ocurrido un error inesperado.'}</p>
                </CardContent>
                <CardFooter>
                     <Button asChild className="w-full">
                        <Link href="/mi-equipo">Volver al Panel</Link>
                     </Button>
                </CardFooter>
               </Card>
           </div>
      )
  }


  return (
    <div className="container mx-auto max-w-lg py-12 px-4">
      <Card>
        <CardHeader className="text-center">
            <div className="mx-auto w-fit rounded-full bg-primary/10 p-3">
                <Mail className="h-8 w-8 text-primary" />
            </div>
          <CardTitle className="mt-4">Has sido invitado a unirte a un equipo</CardTitle>
          <CardDescription>
            Has recibido una invitación para unirte al equipo{' '}
            <span className="font-bold text-primary">{invitation.teamName}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <p className="text-muted-foreground">Tu rol asignado será:</p>
            <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1 mt-2">
                <Shield className="h-4 w-4 text-secondary-foreground" />
                <span className="font-semibold text-secondary-foreground">{invitation.role}</span>
            </div>
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-4">
          <Button variant="destructive" onClick={() => handleResponse('decline')} disabled={processing}>
            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <X className="mr-2 h-4 w-4" />}
            Rechazar
          </Button>
          <Button onClick={() => handleResponse('accept')} disabled={processing}>
             {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
            Aceptar Invitación
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
