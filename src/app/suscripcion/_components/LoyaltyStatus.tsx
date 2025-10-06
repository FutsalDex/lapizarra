'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, Star, Gift, Calendar } from 'lucide-react';

interface Exercise {
  id: string;
}

const StatCard = ({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  description: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default function LoyaltyStatus() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'exercises'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const exercisesData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Exercise)
        );
        setExercises(exercisesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user exercises:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!user) {
    return <p>Inicia sesión para ver tu estado de fidelización.</p>;
  }

  const exerciseCount = exercises.length;
  const points = exerciseCount * 5;
  const savings = (exerciseCount * 0.1).toFixed(2);

  // Example renewal date (you would get this from user's subscription data)
  const renewalDate = new Date();
  renewalDate.setFullYear(renewalDate.getFullYear() + 1);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Target}
        title="Ejercicios Subidos"
        value={exerciseCount}
        description="Total de ejercicios aportados."
      />
      <StatCard
        icon={Star}
        title="Puntos Acumulados"
        value={points}
        description="5 puntos por cada ejercicio."
      />
      <StatCard
        icon={Gift}
        title="Ahorro en Renovación"
        value={`${savings} €`}
        description="10 céntimos por cada ejercicio."
      />
      <StatCard
        icon={Calendar}
        title="Próxima Renovación"
        value={renewalDate.toLocaleDateString('es-ES')}
        description="Fecha de tu próxima cuota."
      />
    </div>
  );
}
