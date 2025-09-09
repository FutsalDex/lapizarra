
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, PlusCircle, Trash2, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const initialPlayers = [
    { id: '1', name: 'Álex', position: 'Cierre', number: 5, goals: 12, assists: 8 },
    { id: '2', name: 'Javier', position: 'Ala', number: 10, goals: 25, assists: 15 },
    { id: '3', name: 'Marta', position: 'Pívot', number: 9, goals: 30, assists: 5 },
    { id: '4', name: 'Carlos', position: 'Portero', number: 1, goals: 0, assists: 1 },
    { id: '5', name: 'Lucía', position: 'Ala', number: 7, goals: 18, assists: 20 },
];


export default function MiPlantillaPage() {
    const [players, setPlayers] = useState(initialPlayers);
    const [open, setOpen] = useState(false);

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
       <div className="flex justify-between items-center mb-12">
            <div className="text-left">
            <div className="flex items-center gap-4">
                <Users className="h-10 w-10 text-primary" />
                <div>
                <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
                    Mi Plantilla
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                    Gestiona la plantilla de tu equipo, añade jugadores y consulta sus estadísticas.
                </p>
                </div>
            </div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button size="lg">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Añadir Jugador
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Añadir Nuevo Jugador</DialogTitle>
                        <DialogDescription>
                            Introduce los datos del nuevo jugador de tu plantilla.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nombre</Label>
                            <Input id="name" className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="position" className="text-right">Posición</Label>
                            <Input id="position" className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="number" className="text-right">Dorsal</Label>
                            <Input id="number" type="number" className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={() => setOpen(false)}>Guardar Jugador</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Listado de Jugadores</CardTitle>
          <CardDescription>Visualiza y gestiona los miembros de tu equipo.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
             <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Posición</TableHead>
                    <TableHead className="text-center">Dorsal</TableHead>
                    <TableHead className="text-center">Goles</TableHead>
                    <TableHead className="text-center">Asistencias</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {players.map((player) => (
                        <TableRow key={player.id}>
                            <TableCell className="font-medium">{player.name}</TableCell>
                            <TableCell>{player.position}</TableCell>
                            <TableCell className="text-center">{player.number}</TableCell>
                            <TableCell className="text-center">{player.goals}</TableCell>
                            <TableCell className="text-center">{player.assists}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                 <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
