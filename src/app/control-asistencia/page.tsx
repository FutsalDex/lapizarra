
'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { CalendarIcon, ClipboardCheck, Trash2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';
import { Calendar } from '../../components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import AttendanceHistory from './_components/AttendanceHistory';

const players = [
    { id: '1', name: 'Manel', dorsal: 1 },
    { id: '2', name: 'Victor', dorsal: 2 },
    { id: '3', name: 'Marc Muñoz', dorsal: 3 },
    { id: '4', name: 'Marc Montoro', dorsal: 4 },
    { id: '5', name: 'Roger', dorsal: 5 },
    { id: '6', name: 'David', dorsal: 7 },
    { id: '7', name: 'Elena', dorsal: 8 },
];

type AttendanceStatus = 'presente' | 'ausente' | 'justificado' | 'lesionado';

export default function ControlAsistenciaPage() {
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [date, setDate] = useState<Date>(new Date());

  const handleAttendanceChange = (playerId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [playerId]: status }));
  };


  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 space-y-12">
      <div className="text-left">
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Registro de Asistencia
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
                    {date ? format(date, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => setDate(newDate || new Date())}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
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
                        <TableCell className="font-medium">{player.dorsal}</TableCell>
                        <TableCell>{player.name}</TableCell>
                        <TableCell className="text-right">
                           <RadioGroup
                              defaultValue="presente"
                              className="flex justify-end gap-4"
                              value={attendance[player.id] || 'presente'}
                              onValueChange={(value: string) => handleAttendanceChange(player.id, value as AttendanceStatus)}
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
                <Button size="lg" variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Registro
                </Button>
                <Button size="lg">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Guardar Asistencia
                </Button>
            </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
