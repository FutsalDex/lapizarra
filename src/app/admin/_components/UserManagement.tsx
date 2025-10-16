'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Button } from '../../../components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import {
  collection,
  onSnapshot,
  Timestamp,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { Skeleton } from '../../../components/ui/skeleton';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../hooks/use-toast';
import ManageSubscriptionDialog from './ManageSubscriptionDialog';
import ExtendSubscriptionDialog from './ExtendSubscriptionDialog';

interface User {
  docId: string;
  id: string;
  email: string;
  displayName?: string;
  subscription?: string;
  role?: 'Registered' | 'Subscribed' | 'Admin';
  createdAt: Timestamp;
  subscriptionStartDate?: Timestamp;
  subscriptionEndDate?: Timestamp;
  discountAmount?: number;
  subscriptionAmount?: number;
  finalPrice?: number;
  usedReferralCode?: string;
  referredByEmail?: string;
  referralCode?: string;
  successfulReferrals?: number;
}

const subscriptionPrices: { [key: string]: number } = {
  Trial: 0,
  Básico: 9.95,
  Pro: 19.95,
};

export default function UserManagement() {
  const { user, db } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      console.log("UID actual:", user.uid);
      console.log("Email actual:", user.email);
      if (user.uid === 'fR22nZ3iH5d6Pk2gNl7x7s8Jj3a2') {
        setIsAdmin(true);
      }
    } else {
      console.log("No hay usuario autenticado");
    }
  }, [user]);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'users'), async (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() } as User));
      const referralCodeToEmailMap = new Map<string, string>();
      usersData.forEach(u => {
        if(u.referralCode && u.email) {
          referralCodeToEmailMap.set(u.referralCode, u.email);
        }
      });

      const enrichedUsersPromises = usersData.map(async (userData) => {
        let discount = 0;

        if (userData.id) {
          const exercisesQuery = query(
            collection(db, 'exercises'),
            where('userId', '==', userData.id),
            where('Visible', '==', true)
          );
          const exercisesSnapshot = await getDocs(exercisesQuery);
          const exerciseCount = exercisesSnapshot.size;
          const exercisePoints = exerciseCount * 5;
          const referralPoints = (userData.successfulReferrals || 0) * 100;
          const totalPoints = exercisePoints + referralPoints;
          discount = totalPoints * 0.05;
        }

        const subscriptionType = userData.subscription || 'Trial';
        const subscriptionAmount = subscriptionPrices[subscriptionType] || 0;
        const finalPrice = Math.max(0, subscriptionAmount - discount);

        const referredByEmail = userData.usedReferralCode 
          ? referralCodeToEmailMap.get(userData.usedReferralCode) || 'Desconocido'
          : undefined;

        return {
          ...userData,
          discountAmount: discount,
          subscriptionAmount: subscriptionAmount,
          finalPrice: finalPrice,
          referredByEmail: referredByEmail,
        } as User;
      });

      const enrichedUsers = await Promise.all(enrichedUsersPromises);
      setUsers(enrichedUsers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleDeleteUser = async (userId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast({
        title: 'Usuario eliminado',
        description: 'El usuario ha sido eliminado correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el usuario.',
        variant: 'destructive',
      });
      console.error('Error deleting user: ', error);
    }
  };

  const handleUpdateUser = async (userId: string) => {
    if (!isAdmin || !db) {
      toast({
        title: 'Permiso denegado',
        description: 'No tienes permisos para modificar usuarios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        role: 'Admin',
        subscription: 'Pro',
        subscriptionStartDate: Timestamp.fromDate(new Date()),
        subscriptionEndDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      });

      toast({
        title: 'Usuario actualizado',
        description: 'Rol y suscripción asignados correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el usuario.',
        variant: 'destructive',
      });
      console.error('Error updating user: ', error);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return 'N/A';
    return `${amount.toFixed(2)} €`;
  };

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
                <TableHead>Código Usado</TableHead>
                <TableHead>Referido por</TableHead>
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
                  <TableCell>{user.usedReferralCode || '-'}</TableCell>
                  <TableCell>{user.referredByEmail || '-'}</TableCell>
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
                        <DropdownMenuItem asChild>
                         <ManageSubscriptionDialog user={user} />
                        </DropdownMenuItem>
                         <ExtendSubscriptionDialog firestoreDb={db} user={user}>
                           <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            Extender Suscripción
                          </div>
                        </ExtendSubscriptionDialog>
                        <DropdownMenuSeparator />
                        {isAdmin && (
                          <DropdownMenuItem onClick={() => handleUpdateUser(user.docId)}>
                            Asignar Rol Admin + Pro
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteUser(user.docId)}
                        >
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
