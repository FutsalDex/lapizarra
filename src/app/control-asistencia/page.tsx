
'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardCheck, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const players = [
    { id: '1', name: 'Álex' },
    { id: '2', name: 'Javier' },
    { id: '3', name: 'Marta' },
    { id: '4', name: 'Carlos' },
    { id: '5', name: 'Lucía' },
    { id: '6', name: 'Sofía' },
    { id: '7', name: 'David' },
    { id: '8', name: 'Elena' },
];

export default function ControlAsistenciaPage() {
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  const handleAttendanceChange = (playerId: string, isPresent: boolean) => {
    setAttendance(prev => ({ ...prev, [playerId]: isPresent }));
  };

  const markAll = (isPresent: boolean) => {
    const newAttendance: Record<string, boolean> = {};
    players.forEach(player => {
        newAttendance[player.id] = isPresent;
    });
    setAttendance(newAttendance);
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="text-center mb-12">
         <div className="flex justify-center mb-4">
            <ClipboardCheck className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Control de Asistencia
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Registra y consulta la asistencia de tus jugadores.
        </p>
      </div>
      
       <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Asistencia de Hoy</CardTitle>
              <CardDescription>
                Marca los jugadores presentes en la sesión de hoy.
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon"><ArrowLeft /></Button>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="font-semibold">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <Button variant="outline" size="icon"><ArrowRight /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="flex justify-between items-center mb-4">
                <Select defaultValue="training">
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Tipo de Sesión" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="training">Entrenamiento</SelectItem>
                        <SelectItem value="match">Partido</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => markAll(true)}>Marcar Todos</Button>
                    <Button variant="secondary" onClick={() => markAll(false)}>Desmarcar Todos</Button>
                </div>
            </div>
            <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Jugador</TableHead>
                    <TableHead className="text-center w-32">Asiste</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {players.map((player) => (
                    <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell className="text-center">
                            <Checkbox 
                                checked={attendance[player.id] || false}
                                onCheckedChange={(checked) => handleAttendanceChange(player.id, !!checked)}
                                className="h-5 w-5"
                            />
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </div>
            <div className="flex justify-end mt-6">
                <Button size="lg">Guardar Asistencia</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
