
'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Dummy data
const events = {
    '2024-08-10': [{ type: 'training', title: 'Sesión #24' }],
    '2024-08-15': [{ type: 'match', title: 'vs. Rival F.S.' }],
    '2024-08-22': [{ type: 'training', title: 'Sesión #25' }],
    '2024-09-01': [{ type: 'match', title: 'vs. Amigos C.F.' }],
};

export default function MisEventosPage() {
    const [currentDate, setCurrentDate] = useState(new Date());

    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);

    const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

    const startingDayIndex = getDay(firstDayOfMonth) === 0 ? 6 : getDay(firstDayOfMonth) - 1;

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="container mx-auto max-w-7xl py-12 px-4">
      <div className="text-center mb-12">
         <div className="flex justify-center mb-4">
            <CalendarDays className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Mis Eventos
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Un calendario con todos tus partidos y entrenamientos.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl capitalize">
                 {format(currentDate, 'MMMM yyyy', { locale: es })}
            </CardTitle>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-7 gap-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                    <div key={day} className="text-center font-bold text-muted-foreground">{day}</div>
                ))}
                {Array.from({ length: startingDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="border rounded-lg h-28 bg-muted/50"></div>
                ))}
                {daysInMonth.map(day => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    // @ts-ignore
                    const dayEvents = events[dayKey] || [];
                    return (
                        <div key={day.toString()} className={cn("border rounded-lg h-28 p-2 flex flex-col", { 'bg-primary/10': isToday(day) })}>
                            <time dateTime={day.toString()} className={cn("font-semibold", { 'text-primary': isToday(day) })}>
                                {format(day, 'd')}
                            </time>
                            <div className="mt-1 space-y-1 overflow-y-auto">
                                {dayEvents.map((event, i) => (
                                    <Badge key={i} variant={event.type === 'match' ? 'default' : 'secondary'} className="w-full block truncate">
                                        {event.title}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
