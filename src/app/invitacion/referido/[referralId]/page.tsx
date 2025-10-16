
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Loader2, Gift, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Referral {
  id: string;
  inviterEmail: string;
  status: 'pending' | 'completed';
}

export default function ReferralPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const referralId = params.referralId as string;

  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!referralId) return;

    const fetchReferral = async () => {
      setLoading(true);
      const refDocRef = doc(db, 'referrals', referralId);
      const refDoc = await getDoc(refDocRef);

      if (!refDoc.exists()) {
        setError('Esta invitación no es válida o ha caducado.');
      } else {
        const refData = { id: refDoc.id, ...refDoc.data() } as Referral;
        if (refData.status !== 'pending') {
          setError('Esta invitación ya ha sido utilizada.');
        } else {
          setReferral(refData);
        }
      }
      setLoading(false);
    };

    fetchReferral();
  }, [referralId]);

  useEffect(() => {
    // If user is already logged in, redirect them to register page with referralId
    if (!authLoading && user) {
      router.push(`/register?referralId=${referralId}`);
    }
  }, [user, authLoading, referralId, router]);


  if (loading || authLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !referral) {
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
                      <Link href="/ejercicios">Explorar Ejercicios</Link>
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
                <Gift className="h-8 w-8 text-primary" />
            </div>
          <CardTitle className="mt-4">¡Te han invitado a LaPizarra!</CardTitle>
          <CardDescription>
            <span className="font-bold text-primary">{referral.inviterEmail}</span> te ha invitado a unirte a la comunidad.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <p className="text-muted-foreground">
                Regístrate para empezar a disfrutar de todas las herramientas y ayudar a tu amigo a ganar puntos de fidelización.
            </p>
        </CardContent>
        <CardFooter className="grid grid-cols-1 gap-4">
          <Button asChild size="lg">
            <Link href={`/register?referralId=${referralId}`}>Crear una cuenta</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/login?referralId=${referralId}`}>Ya tengo una cuenta</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

