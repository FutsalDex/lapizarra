
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { collection, onSnapshot, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import ManageSubscriptionDialog from './ManageSubscriptionDialog';

interface User {
  docId: string; // Document ID from Firestore
  id: string; // User UID from Auth
  email: string;
  displayName?: string;
  subscription?: string;
  createdAt: Timestamp;
  subscriptionStartDate?: Timestamp;
  subscriptionEndDate?: Timestamp;
  discountAmount?: number;
  subscriptionAmount?: number;
  finalPrice?: number;
}

const subscriptionPrices: { [key: string]: number } = {
  'Trial': 0,
  'Básico': 9.95,
  'Pro': 19.95,
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), async (snapshot) => {
      const usersDataPromises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let discount = 0;
        
        if (data.uid) {
            // Fetch user's exercises to calculate discount
            const exercisesQuery = query(collection(db, 'exercises'), where('userId', '==', data.uid));
            const exercisesSnapshot = await getDocs(exercisesQuery);
            const exerciseCount = exercisesSnapshot.size;
            discount = exerciseCount * 5 * 0.05; // 5 points per exercise, 5 cents per point
        }

        const subscriptionType = data.subscription || 'Trial';
        const subscriptionAmount = subscriptionPrices[subscriptionType] || 0;
        const finalPrice = Math.max(0, subscriptionAmount - discount);


        return {
          docId: doc.id,
          id: data.uid,
          email: data.email || 'N/A',
          displayName: data.displayName,
          subscription: data.subscription || 'Trial',
          createdAt: data.createdAt,
          subscriptionStartDate: data.subscriptionStartDate,
          subscriptionEndDate: data.subscriptionEndDate,
          discountAmount: discount,
          subscriptionAmount: subscriptionAmount,
          finalPrice: finalPrice,
        } as User;
      });
      
      const usersData = await Promise.all(usersDataPromises);
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(user => user.email.toLowerCase().includes(searchTerm.toLowerCase()));

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
  }

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return 'N/A';
    return `${amount.toFixed(2)} €`;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-start">
        <Input
          placeholder="Buscar por email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border overflow-x-auto">
        {loading ? (
             <div className="space-y-2 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        ) : (
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Suscripción</TableHead>
                <TableHead>Fecha Suscripción</TableHead>
                <TableHead>Fecha Vencimiento</TableHead>
                <TableHead>Importe Sub.</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Precio Final</TableHead>
                <TableHead>
                    <span className="sr-only">Acciones</span>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredUsers.map((user) => (
                <TableRow key={user.docId}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell>
                        <Badge variant={user.subscription === 'Pro' ? 'default' : 'secondary'}>
                            {user.subscription}
                        </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.subscriptionStartDate)}</TableCell>
                    <TableCell>{formatDate(user.subscriptionEndDate)}</TableCell>
                    <TableCell>{formatCurrency(user.subscriptionAmount)}</TableCell>
                    <TableCell>{formatCurrency(user.discountAmount)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(user.finalPrice)}</TableCell>
                    <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <ManageSubscriptionDialog user={user} />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                            Eliminar Usuario
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        )}
      </div>
      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          No se encontraron usuarios con ese email.
        </div>
      )}
    </div>
  );
}
