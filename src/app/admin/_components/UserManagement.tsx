
'use client';

import { useState } from 'react';
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

const users = [
  {
    id: 'usr_1',
    email: 'usuario1@example.com',
    role: 'Subscribed',
    subscription: 'Pro',
    joined: '2023-10-01',
  },
  {
    id: 'usr_2',
    email: 'otro@example.com',
    role: 'Registered',
    subscription: 'Trial',
    joined: '2023-11-15',
  },
    {
    id: 'usr_3',
    email: 'futsaldex@gmail.com',
    role: 'Admin',
    subscription: 'N/A',
    joined: '2023-09-01',
  },
  {
    id: 'usr_4',
    email: 'guestuser@example.com',
    role: 'Guest',
    subscription: 'None',
    joined: '2024-01-20',
  },
];

export default function UserManagement() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user => user.email.toLowerCase().includes(searchTerm.toLowerCase()));

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
                <TableCell className="hidden md:table-cell">{user.joined}</TableCell>
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
      </div>
       {filteredUsers.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No se encontraron usuarios con ese email.
          </div>
        )}
    </div>
  );
}
