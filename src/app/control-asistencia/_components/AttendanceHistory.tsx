
'use client';
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
import { Progress } from '@/components/ui/progress';
import { History } from 'lucide-react';

const historyData = [
    { dorsal: 1, name: 'Manel', p: 8, a: 0, j: 0, l: 0, total: 8, percentage: 100 },
    { dorsal: 2, name: 'Victor', p: 6, a: 0, j: 1, l: 1, total: 8, percentage: 75 },
    { dorsal: 3, name: 'Marc Muñoz', p: 6, a: 1, j: 1, l: 0, total: 8, percentage: 75 },
    { dorsal: 4, name: 'Marc Montoro', p: 7, a: 0, j: 1, l: 0, total: 8, percentage: 88 },
    { dorsal: 5, name: 'Roger', p: 7, a: 0, j: 1, l: 0, total: 8, percentage: 88 },
    { dorsal: 7, name: 'David', p: 7, a: 0, j: 1, l: 0, total: 8, percentage: 88 },
    { dorsal: 8, name: 'Elena', p: 8, a: 0, j: 0, l: 0, total: 8, percentage: 100 },
];

export default function AttendanceHistory() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Historial de Asistencia</CardTitle>
            <CardDescription>
              Resumen de la asistencia de los jugadores a todos los entrenamientos registrados.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dorsal</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-center">P</TableHead>
                <TableHead className="text-center">A</TableHead>
                <TableHead className="text-center">J</TableHead>
                <TableHead className="text-center">L</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead>% Asistencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyData.map((player) => (
                <TableRow key={player.dorsal}>
                  <TableCell className="font-medium">{player.dorsal}</TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell className="text-center">{player.p}</TableCell>
                  <TableCell className="text-center">{player.a}</TableCell>
                  <TableCell className="text-center">{player.j}</TableCell>
                  <TableCell className="text-center">{player.l}</TableCell>
                  <TableCell className="text-center">{player.total}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={player.percentage} className="h-2" />
                      <span className="text-xs text-muted-foreground w-12 text-right">{player.percentage}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          * El % de asistencia se calcula como: (Presente / (Presente + Ausente + Justificado + Lesionado)) * 100.
        </p>
      </CardContent>
    </Card>
  );
}
