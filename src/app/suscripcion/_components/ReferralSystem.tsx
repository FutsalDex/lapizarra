
'use client';

import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../hooks/use-toast';
import { Users, Clipboard } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import Link from 'next/link';

export default function ReferralSystem() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const referralCode = userProfile?.referralCode;
  const isSubscribed = userProfile?.subscription === 'Pro' || userProfile?.subscription === 'Admin';


  const copyToClipboard = () => {
    if (!referralCode) return;
    const referralLink = `${window.location.origin}/invitacion/referido/${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: '¡Enlace copiado!',
      description: 'El enlace de referido se ha copiado al portapapeles.',
    });
  };

  const renderContent = () => {
    if (authLoading) {
      return <Skeleton className="h-10 w-full" />;
    }

    if (!user) {
      return <p className="text-sm text-muted-foreground">Inicia sesión para ver tu código de referido.</p>;
    }
    
    if (!isSubscribed) {
        return (
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Esta función está disponible para usuarios con un plan de suscripción.</p>
                <Button asChild variant="link">
                    <Link href="/suscripcion">Ver planes</Link>
                </Button>
            </div>
        );
    }

    if (referralCode) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Comparte tu código único con tus amigos y colegas:
          </p>
          <div className="flex items-center space-x-2">
            <Input value={referralCode} readOnly className="font-mono tracking-widest text-lg h-12"/>
            <Button onClick={copyToClipboard} size="icon" variant="outline" className="h-12 w-12 shrink-0">
              <Clipboard className="h-5 w-5" />
            </Button>
          </div>
        </div>
      );
    }

    return <p className="text-sm text-muted-foreground">No se pudo cargar tu código de referido. Inténtalo de nuevo más tarde.</p>;
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          Invita a un Amigo
        </CardTitle>
        <CardDescription>
          Por cada amigo que se suscriba usando tu código, recibirás 100
          puntos de fidelización.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
