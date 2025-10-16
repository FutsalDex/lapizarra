
'use client';
import { useState, useEffect } from 'react';
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
import { History, Loader2 } from 'lucide-react';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';


interface AttendanceHistoryProps {
    teamId: string;
}

interface Player {
    id: string;
    name: string;
    number: number;
}

interface AttendanceRecord {
    statuses: Record<string, 'presente' | 'ausente' | 'justificado' | 'lesionado'>;
}

interface PlayerStats {
    id: string;
    name: string;
    number: number;
    p: number; // presente
    a: number; // ausente
    j: number; // justificado
    l: number; // lesionado
    total: number;
    percentage: number;
}


export default function AttendanceHistory({ teamId }: AttendanceHistoryProps) {
    const { db } = useAuth();
    const [stats, setStats] = useState<PlayerStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!teamId || !db) return;

        const playersQuery = query(collection(db, 'teams', teamId, 'players'));
        const attendanceQuery = collection(db, 'teams', teamId, 'attendance');

        const unsubscribe = onSnapshot(attendanceQuery, async (attendanceSnapshot) => {
            setLoading(true);
            const playersSnapshot = await getDocs(playersQuery);
            const players = playersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));

            const playerStats: Record<string, Omit<PlayerStats, 'id' | 'name' | 'number'>> = {};

            players.forEach(player => {
                playerStats[player.id] = { p: 0, a: 0, j: 0, l: 0, total: 0, percentage: 0 };
            });

            let totalSessions = 0;
            attendanceSnapshot.forEach(doc => {
                totalSessions++;
                const record = doc.data() as AttendanceRecord;
                for (const playerId in record.statuses) {
                    if (playerStats[playerId]) {
                        const status = record.statuses[playerId];
                        switch (status) {
                            case 'presente': playerStats[playerId].p++; break;
                            case 'ausente': playerStats[playerId].a++; break;
                            case 'justificado': playerStats[playerId].j++; break;
                            case 'lesionado': playerStats[playerId].l++; break;
                        }
                    }
                }
            });
            
            const finalStats: PlayerStats[] = players.map(player => {
                const p = playerStats[player.id]?.p || 0;
                const a = playerStats[player.id]?.a || 0;
                const j = playerStats[player.id]?.j || 0;
                const l = playerStats[player.id]?.l || 0;
                
                const percentage = p > 0 ? Math.round((p / totalSessions) * 100) : 0;
                
                return {
                    id: player.id,
                    name: player.name,
                    number: player.number,
                    p, a, j, l,
                    total: totalSessions,
                    percentage
                };
            }).sort((a,b) => a.number - b.number);
            
            setStats(finalStats);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [teamId, db]);

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
        {loading ? (
             <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
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
              {stats.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.number}</TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell className="text-center">{player.p}</TableCell>
                  <TableCell className="text-center">{player.a}</TableCell>
                  <TableCell className="text-center">{player.j}</TableCell>
                  <TableCell className="text-center">{player.l}</TableCell>
                  <TableCell className="text-center">{player.total}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Progress value={player.percentage > 100 ? 100 : player.percentage} className="h-2" />
                      <span className="text-xs text-muted-foreground w-12 text-right">{player.percentage}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}
         {stats.length === 0 && !loading && (
            <div className="text-center py-10 text-muted-foreground">
                No hay datos de asistencia para mostrar.
            </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <p><span className="font-bold">P:</span> Presente</p>
            <p><span className="font-bold">A:</span> Ausente</p>
            <p><span className="font-bold">J:</span> Ausencia Justificada</p>
            <p><span className="font-bold">L:</span> Lesionado</p>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          * El % de asistencia se calcula como: (Presente / Sesiones Totales) * 100.
        </p>
      </CardContent>
    </Card>
  );
}
