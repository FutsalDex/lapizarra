
'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';


interface Event {
    id: string;
    type: 'training' | 'match';
    title: string;
    date: Date;
}

interface EventsByDate {
    [key: string]: Event[];
}


export default function MisEventosPage() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<EventsByDate>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchEvents = async () => {
            setLoading(true);

            // Fetch teams to get teamIds
            const teamsQuery = query(collection(db, 'teams'), where('ownerId', '==', user.uid));
            const teamsSnapshot = await getDocs(teamsQuery);
            const teamIds = teamsSnapshot.docs.map(doc => doc.id);

            const allEvents: Event[] = [];

            // Fetch sessions
            const sessionsQuery = query(collection(db, 'sessions'), where('userId', '==', user.uid));
            const sessionsSnapshot = await getDocs(sessionsQuery);
            sessionsSnapshot.forEach(doc => {
                const data = doc.data();
                const date = (data.date as Timestamp).toDate();
                allEvents.push({
                    id: doc.id,
                    type: 'training',
                    title: `Sesión #${data.sessionNumber || doc.id.substring(0,4)}`,
                    date: date
                });
            });

            // Fetch matches if user has teams
            if (teamIds.length > 0) {
                 const matchesQuery = query(collection(db, 'matches'), where('teamId', 'in', teamIds));
                 const matchesSnapshot = await getDocs(matchesQuery);
                 matchesSnapshot.forEach(doc => {
                     const data = doc.data();
                     allEvents.push({
                         id: doc.id,
                         type: 'match',
                         title: `${data.localTeam} vs ${data.visitorTeam}`,
                         date: new Date(data.date)
                     });
                 });
            }

            const groupedEvents = allEvents.reduce((acc, event) => {
                const dateKey = format(event.date, 'yyyy-MM-dd');
                if (!acc[dateKey]) {
                    acc[dateKey] = [];
                }
                acc[dateKey].push(event);
                return acc;
            }, {} as EventsByDate);
            
            setEvents(groupedEvents);
            setLoading(false);
        };
        
        fetchEvents();
        
    }, [user]);


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
            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="text-center font-bold text-muted-foreground">{day}</div>
                    ))}
                    {Array.from({ length: startingDayIndex }).map((_, i) => (
                        <div key={`empty-${i}`} className="border rounded-lg h-28 bg-muted/50"></div>
                    ))}
                    {daysInMonth.map(day => {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const dayEvents = events[dayKey] || [];
                        return (
                            <div key={day.toString()} className={cn("border rounded-lg h-28 p-2 flex flex-col", { 'bg-primary/10': isToday(day) })}>
                                <time dateTime={day.toString()} className={cn("font-semibold", { 'text-primary': isToday(day) })}>
                                    {format(day, 'd')}
                                </time>
                                <div className="mt-1 space-y-1 overflow-y-auto">
                                    {dayEvents.map((event, i) => {
                                        const href = event.type === 'match' ? `/partido/${event.id}` : `/crear-sesion?sessionId=${event.id}`;
                                        return (
                                            <Link href={href} key={i} className="block cursor-pointer">
                                                <Badge variant={event.type === 'match' ? 'default' : 'secondary'} className="w-full block truncate text-xs">
                                                    {event.title}
                                                </Badge>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

    
