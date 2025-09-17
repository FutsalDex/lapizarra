
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
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  id: string;
  email: string;
  displayName?: string;
  role?: 'Admin' | 'Subscribed' | 'Registered' | 'Guest';
  subscription?: string;
  createdAt: Timestamp;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || 'N/A',
          displayName: data.displayName,
          role: data.role || 'Registered', // Default role
          subscription: data.subscription || 'Trial', // Default subscription
          createdAt: data.createdAt,
        } as User;
      });
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(user => user.email.toLowerCase().includes(searchTerm.toLowerCase()));

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
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
                <TableHead>Rol</TableHead>
                <TableHead className="hidden sm:table-cell">Suscripción</TableHead>
                <TableHead className="hidden md:table-cell">Miembro desde</TableHead>
                <TableHead>
                    <span className="sr-only">Acciones</span>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                    <Badge variant={user.role === 'Admin' ? 'destructive' : user.role === 'Subscribed' ? 'default' : 'secondary'}>
                        {user.role}
                    </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{user.subscription}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(user.createdAt)}</TableCell>
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
                        <DropdownMenuItem>Editar Rol</DropdownMenuItem>
                        <DropdownMenuItem>Gestionar Suscripción</DropdownMenuItem>
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
