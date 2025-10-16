
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
import { CalendarIcon, ClipboardCheck, Trash2, ArrowLeft, Loader2, Eraser } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AttendanceHistory from '@/app/control-asistencia/_components/AttendanceHistory';
import Link from 'next/link';
import { doc, onSnapshot, collection, query, where, getDocs, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

type AttendanceStatus = 'presente' | 'ausente' | 'justificado' | 'lesionado';

const demoPlayers = [
    { id: 'demo1', number: 1, name: 'Portero Demo', active: true },
    { id: 'demo2', number: 5, name: 'Cierre Demo', active: true },
    { id: 'demo3', number: 7, name: 'Ala Izquierdo', active: true },
    { id: 'demo4', number: 10, name: 'Ala Derecho', active: true },
    { id: 'demo5', number: 9, name: 'Pívot Demo', active: true },
];

const demoTeamData = { name: 'Equipo Demo' };
const demoRecordedDates = [new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)];
const demoAttendance = {
    'demo1': 'presente',
    'demo2': 'presente',
    'demo3': 'ausente',
    'demo4': 'presente',
    'demo5': 'lesionado',
};


interface Team {
  name: string;
}

interface Player {
    id: string;
    name: string;
    number: number;
    active: boolean;
}

export default function TeamAttendancePage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const { db } = useAuth();
  const isDemoMode = teamId === 'demo-team-guest';

  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus | undefined>>({});
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [recordExists, setRecordExists] = useState(false);
  const [recordedDates, setRecordedDates] = useState<Date[]>([]);
  const { toast } = useToast();

   useEffect(() => {
        if (isDemoMode) {
            setTeam(demoTeamData);
            setPlayers(demoPlayers);
            setRecordedDates(demoRecordedDates);
            if (date && format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
                setAttendance(demoAttendance);
                setRecordExists(true);
            }
            setLoading(false);
            return;
        }
        if (!teamId) return;

        setLoading(true);
        const teamDocRef = doc(db, 'teams', teamId);
        const unsubscribeTeam = onSnapshot(teamDocRef, (doc) => {
            if (doc.exists()) {
                setTeam(doc.data() as Team);
            }
        });

        const playersQuery = query(collection(db, 'teams', teamId, 'players'), where('active', '==', true));
        const unsubscribePlayers = onSnapshot(playersQuery, (snapshot) => {
            const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
            setPlayers(playersData.sort((a,b) => a.number - b.number));
            setLoading(false);
        });
        
        // Fetch all recorded dates for the calendar
        const attendanceCollectionRef = collection(db, 'teams', teamId, 'attendance');
        const unsubscribeAttendanceDates = onSnapshot(attendanceCollectionRef, (snapshot) => {
            const dates = snapshot.docs.map(doc => new Date(doc.id));
            setRecordedDates(dates);
        });

        return () => {
            unsubscribeTeam();
            unsubscribePlayers();
            unsubscribeAttendanceDates();
        };
    }, [teamId, isDemoMode, db]);
    
    // Fetch attendance for the selected date
    useEffect(() => {
        if (isDemoMode) {
             const dateString = date ? format(date, 'yyyy-MM-dd') : '';
             if (demoRecordedDates.some(d => format(d, 'yyyy-MM-dd') === dateString)) {
                setAttendance(demoAttendance);
                setRecordExists(true);
             } else {
                setAttendance({});
                setRecordExists(false);
             }
            return;
        }

        if (!date || !teamId || !db) return;

        const dateString = format(date, 'yyyy-MM-dd');
        const attendanceDocRef = doc(db, 'teams', teamId, 'attendance', dateString);
        
        // Always reset state when date changes
        const newAttendance: Record<string, undefined> = {};
        players.forEach(p => {
            newAttendance[p.id] = undefined;
        });
        setAttendance(newAttendance);
        setRecordExists(false);

        const unsubscribe = onSnapshot(attendanceDocRef, (doc) => {
            if (doc.exists()) {
                setAttendance(doc.data().statuses);
                setRecordExists(true);
            }
        });

        return () => unsubscribe();
    }, [date, teamId, players, isDemoMode, db]);


  const handleAttendanceChange = (playerId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [playerId]: status }));
  };
  
  const handleClearAttendance = () => {
    const newAttendance: Record<string, undefined> = {};
    players.forEach(p => {
        newAttendance[p.id] = undefined;
    });
    setAttendance(newAttendance);
  }

  const handleSaveAttendance = async () => {
      if (isDemoMode) {
        toast({ title: 'Modo Demostración', description: 'No se puede guardar la asistencia en el modo demostración.' });
        return;
      }
      if (!date || !teamId || !db) return;
       // Check if all players have a status
      if (Object.values(attendance).some(status => status === undefined || status === null)) {
        toast({
            title: "Faltan datos",
            description: "Por favor, marca la asistencia para todos los jugadores.",
            variant: "destructive"
        });
        return;
      }

      setIsSaving(true);
      const dateString = format(date, 'yyyy-MM-dd');
      const attendanceDocRef = doc(db, 'teams', teamId, 'attendance', dateString);

      try {
          await setDoc(attendanceDocRef, {
              date: date,
              statuses: attendance
          });
          toast({ title: "Asistencia Guardada", description: "El registro de asistencia se ha guardado correctamente." });
      } catch (error) {
          console.error("Error saving attendance: ", error);
          toast({ title: "Error", description: "No se pudo guardar la asistencia.", variant: "destructive" });
      } finally {
          setIsSaving(false);
      }
  }

  const handleDeleteAttendance = async () => {
        if (isDemoMode) {
            toast({ title: 'Modo Demostración', description: 'No se puede eliminar la asistencia en el modo demostración.' });
            return;
        }
        if (!date || !teamId || !db) return;
        setIsSaving(true);
        const dateString = format(date, 'yyyy-MM-dd');
        const attendanceDocRef = doc(db, 'teams', teamId, 'attendance', dateString);
         try {
            await deleteDoc(attendanceDocRef);
            toast({ title: "Registro Eliminado", description: "Se ha eliminado la asistencia para la fecha seleccionada." });
        } catch (error) {
            console.error("Error deleting attendance: ", error);
            toast({ title: "Error", description: "No se pudo eliminar el registro.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
  }
  
    if (loading) {
        return (
             <div className="container mx-auto max-w-6xl py-12 px-4 space-y-8">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full mt-8" />
            </div>
        )
    }


  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 space-y-12">
        <div className="mb-4">
            <Button asChild variant="outline">
            <Link href={`/equipo/${teamId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Panel del Equipo
            </Link>
            </Button>
        </div>
      <div className="text-left">
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Registro de Asistencia: {team?.name || '...'}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Selecciona una fecha y marca el estado de cada jugador. Los días enmarcados ya tienen un registro.
        </p>
      </div>
      
       <Card>
        <CardHeader>
           <div className="flex items-center gap-4">
            <Label htmlFor="training-date" className="text-base font-semibold">Fecha del entrenamiento:</Label>
            <Popover>
              <PopoverTrigger asChild>
                  <Button
                    id="training-date"
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : <span>Elige una fecha</span>}
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={es}
                  modifiers={{ recorded: recordedDates }}
                  modifiersStyles={{ recorded: { backgroundColor: 'hsl(var(--primary) / 0.2)'} }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
             {players.length > 0 ? (
                <>
                <div className="rounded-md border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Dorsal</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead className="text-right">Asistencia</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {players.map((player) => (
                        <TableRow key={player.id}>
                            <TableCell className="font-medium">{player.number}</TableCell>
                            <TableCell>{player.name}</TableCell>
                            <TableCell className="text-right">
                            <RadioGroup
                                className="flex justify-end gap-4"
                                value={attendance[player.id]}
                                onValueChange={(value: string) => handleAttendanceChange(player.id, value as AttendanceStatus)}
                                disabled={isSaving || isDemoMode}
                                >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="presente" id={`presente-${player.id}`} />
                                    <Label htmlFor={`presente-${player.id}`}>Presente</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="ausente" id={`ausente-${player.id}`} />
                                    <Label htmlFor={`ausente-${player.id}`}>Ausente</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="justificado" id={`justificado-${player.id}`} />
                                    <Label htmlFor={`justificado-${player.id}`}>Justificado</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="lesionado" id={`lesionado-${player.id}`} />
                                    <Label htmlFor={`lesionado-${player.id}`}>Lesionado</Label>
                                </div>
                                </RadioGroup>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
                <div className="flex justify-end mt-6 gap-4">
                    <Button size="lg" variant="outline" onClick={handleClearAttendance} disabled={isSaving || isDemoMode}>
                        <Eraser className="mr-2 h-4 w-4" />
                        Limpiar Registros
                    </Button>
                    <Button size="lg" variant="destructive" onClick={handleDeleteAttendance} disabled={isSaving || !recordExists || isDemoMode}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Eliminar Registro
                    </Button>
                    <Button size="lg" onClick={handleSaveAttendance} disabled={isSaving || isDemoMode}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}
                        {recordExists ? 'Actualizar Asistencia' : 'Guardar Asistencia'}
                    </Button>
                </div>
              </>
            ) : (
                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>No hay jugadores activos en la plantilla.</p>
                    <Button asChild variant="link">
                        <Link href={`/equipo/${teamId}/plantilla`}>Gestionar plantilla</Link>
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>

      <AttendanceHistory teamId={teamId} />
    </div>
  );
}
