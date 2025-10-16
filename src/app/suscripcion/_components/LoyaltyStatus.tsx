
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Target, Star, Gift, Calendar, Users } from 'lucide-react';

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
  const [successfulReferrals, setSuccessfulReferrals] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    let active = true;

    const fetchAllData = async () => {
        const exercisesQuery = query(collection(db, 'exercises'), where('userId', '==', user.uid), where('Visible', '==', true));
        const userDocRef = doc(db, 'users', user.uid);
        
        const unsubExercises = onSnapshot(exercisesQuery, (snapshot) => {
            if (!active) return;
            const exercisesData = snapshot.docs.map(doc => ({ id: doc.id } as Exercise));
            setExercises(exercisesData);
        }, (error) => {
            console.error("Error fetching exercises:", error);
        });

        const unsubUser = onSnapshot(userDocRef, (docSnap) => {
             if (!active) return;
             if(docSnap.exists()){
                setSuccessfulReferrals(docSnap.data().successfulReferrals || 0);
             }
        }, (error) => {
             console.error("Error fetching user data:", error);
        });
        
        // Wait for initial fetches to complete to set loading to false
        const exercisesSnap = await getDoc(userDocRef);
        const userSnap = await getDoc(userDocRef);
        
        if (active) {
            setLoading(false);
        }

        return () => {
          active = false;
          unsubExercises();
          unsubUser();
        };
    }

    fetchAllData();

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
  const exercisePoints = exerciseCount * 5;
  const referralPoints = successfulReferrals * 100;
  const totalPoints = exercisePoints + referralPoints;
  const savings = (totalPoints * 0.05).toFixed(2);

  // Example renewal date (you would get this from user's subscription data)
  const renewalDate = new Date();
  renewalDate.setFullYear(renewalDate.getFullYear() + 1);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Target}
        title="Ejercicios Válidos"
        value={exerciseCount}
        description="Ejercicios públicos aportados."
      />
      <StatCard
        icon={Users}
        title="Amigos Suscritos"
        value={successfulReferrals}
        description="Invitaciones completadas."
      />
      <StatCard
        icon={Star}
        title="Puntos Totales"
        value={totalPoints}
        description="5 por ejercicio, 100 por amigo."
      />
      <StatCard
        icon={Gift}
        title="Ahorro en Renovación"
        value={`${savings} €`}
        description="1 punto = 5 céntimos"
      />
    </div>
  );
}
