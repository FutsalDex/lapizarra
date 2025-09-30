
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RefreshCw, Settings, PenSquare, Minus, Plus, Goal, Shield, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface GeneralStats {
    goals: number;
    fouls: number;
    yellowCards: number;
    redCards: number;
    timeouts: number;
}

export default function MarcadorPage() {
  const [localTeam, setLocalTeam] = useState('Local');
  const [visitorTeam, setVisitorTeam] = useState('Visitante');
  const [initialTime, setInitialTime] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const defaultGeneralStats: GeneralStats = { goals: 0, fouls: 0, yellowCards: 0, redCards: 0, timeouts: 0 };
  const [localGeneralStats, setLocalGeneralStats] = useState<GeneralStats>({...defaultGeneralStats});
  const [visitorGeneralStats, setVisitorGeneralStats] = useState<GeneralStats>({...defaultGeneralStats});


  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (!isActive && timeLeft !== 0) {
      if(interval) clearInterval(interval);
    } else if (timeLeft === 0) {
        setIsActive(false);
    }
    return () => {
        if(interval) clearInterval(interval)
    };
  }, [isActive, timeLeft]);
  
  useEffect(() => {
    setTimeLeft(initialTime * 60);
  }, [initialTime]);


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(initialTime*60);
  }

  const handleSettingsSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newLocalTeam = formData.get('localTeam') as string;
    const newVisitorTeam = formData.get('visitorTeam') as string;
    const newTime = parseInt(formData.get('time') as string, 10);
    
    setLocalTeam(newLocalTeam || 'Local');
    setVisitorTeam(newVisitorTeam || 'Visitante');
    if (!isNaN(newTime) && newTime > 0) {
      setInitialTime(newTime);
      setTimeLeft(newTime * 60);
    }
    setIsActive(false);
    setIsSettingsOpen(false);
  }

  const handleGeneralStatChange = (
    team: 'local' | 'visitor',
    stat: keyof GeneralStats,
    delta: 1 | -1
  ) => {
    if (stat === 'timeouts') {
      if (team === 'local') {
        setLocalGeneralStats(prev => {
          let newValue = (prev.timeouts || 0) + delta;
          if (newValue < 0) newValue = 0;
          if (newValue > 1) newValue = 1;
          
          const actualDelta = newValue - (prev.timeouts || 0);
          if (actualDelta !== 0) {
            setTimeLeft(time => time + actualDelta * 60);
            if (isActive) setIsActive(false);
          }
          return { ...prev, timeouts: newValue };
        });
      } else { // visitor
        setVisitorGeneralStats(prev => {
          let newValue = (prev.timeouts || 0) + delta;
          if (newValue < 0) newValue = 0;
          if (newValue > 1) newValue = 1;

          const actualDelta = newValue - (prev.timeouts || 0);
          if (actualDelta !== 0) {
            setTimeLeft(time => time + actualDelta * 60);
            if (isActive) setIsActive(false);
          }
          return { ...prev, timeouts: newValue };
        });
      }
    } else {
      const setter = team === 'local' ? setLocalGeneralStats : setVisitorGeneralStats;
      setter(prev => {
        let newValue = (prev[stat] || 0) + delta;
        if (newValue < 0) newValue = 0;
        
        const newStats = { ...prev, [stat]: newValue };

        if (stat === 'goals') {
          if (team === 'local') {
            setLocalGeneralStats(newStats);
          } else {
            setVisitorGeneralStats(newStats);
          }
        }
        
        return newStats;
      });
    }
  };

  useEffect(() => {
    setLocalGeneralStats(prev => ({...prev, goals: localGeneralStats.goals}));
  }, [localGeneralStats.goals]);
  
  useEffect(() => {
    setVisitorGeneralStats(prev => ({...prev, goals: visitorGeneralStats.goals}));
  }, [visitorGeneralStats.goals]);


  const resetGeneralStats = () => {
    setLocalGeneralStats({...defaultGeneralStats});
    setVisitorGeneralStats({...defaultGeneralStats});
  }

  const YellowCardIcon = () => (
    <div className="w-3 h-4 bg-yellow-400 border border-yellow-600 rounded-sm" />
  );
  const RedCardIcon = () => (
    <div className="w-3 h-4 bg-red-600 border border-red-800 rounded-sm" />
  );


  const renderStatRow = (team: 'local' | 'visitor', stat: keyof GeneralStats, label: string, icon: React.ReactNode) => {
    const stats = team === 'local' ? localGeneralStats : visitorGeneralStats;
    return (
      <div className="flex items-center justify-between p-2 border-b">
        <span className="flex items-center gap-2">{icon}{label}</span>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleGeneralStatChange(team, stat, -1)}><Minus className="h-4 w-4"/></Button>
          <span className="w-4 text-center">{stats[stat]}</span>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleGeneralStatChange(team, stat, 1)}><Plus className="h-4 w-4"/></Button>
        </div>
      </div>
    );
  };
  
    const FoulsIndicator = ({ count }: { count: number }) => (
    <div className="flex items-center justify-center gap-1.5 mt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-3 w-3 rounded-full border-2 border-red-500',
            i < count ? 'bg-red-500' : 'bg-transparent'
          )}
        />
      ))}
    </div>
  );

  const TimeoutIndicator = ({ used }: { used: boolean }) => (
      <div className={cn(
          "flex items-center justify-center w-10 h-10 border-2 border-primary rounded-md",
          used ? "bg-primary text-primary-foreground" : "bg-transparent text-primary"
      )}>
          <span className="font-bold text-sm">TM</span>
      </div>
  );


  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
       <div className="text-center mb-12">
         <div className="flex justify-center mb-4">
            <PenSquare className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Marcador Rápido
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Usa el marcador para un partido rápido o un entrenamiento.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
            <div className="bg-card border rounded-lg p-6 flex flex-col items-center justify-center">
                <div className="grid grid-cols-3 items-center w-full max-w-2xl mb-6">
                    <div className="flex flex-col items-center">
                         <h2 className="text-xl font-bold text-center truncate">{localTeam}</h2>
                         <FoulsIndicator count={localGeneralStats.fouls} />
                    </div>
                    <div className="text-5xl font-bold text-primary tabular-nums text-center">
                        {localGeneralStats.goals} - {visitorGeneralStats.goals}
                    </div>
                    <div className="flex flex-col items-center">
                        <h2 className="text-xl font-bold text-center truncate">{visitorTeam}</h2>
                        <FoulsIndicator count={visitorGeneralStats.fouls} />
                    </div>
                </div>

                 <div className="flex items-center justify-center">
                    <TimeoutIndicator used={localGeneralStats.timeouts > 0} />
                    <div className="text-7xl font-mono font-bold my-4 text-center tabular-nums bg-gray-900 dark:bg-gray-800 text-white py-4 px-6 rounded-lg mx-4">
                        {formatTime(timeLeft)}
                    </div>
                    <TimeoutIndicator used={visitorGeneralStats.timeouts > 0} />
                </div>
                <div className="flex items-center gap-4 mt-4">
                    <Button onClick={() => setIsActive(!isActive)} size="lg" disabled={timeLeft === 0}>
                        {isActive ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                        {isActive ? 'Pausar' : 'Iniciar'}
                    </Button>
                     <Button onClick={resetTimer} variant="outline" size="lg">
                        <RefreshCw className="mr-2"/>
                        Reiniciar
                    </Button>
                     <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Settings />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Ajustes del Marcador</DialogTitle>
                                <DialogDescription>Configura los nombres de los equipos y el tiempo del partido.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSettingsSave}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="localTeam" className="text-right">Local</Label>
                                        <Input id="localTeam" name="localTeam" defaultValue={localTeam} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="visitorTeam" className="text-right">Visitante</Label>
                                        <Input id="visitorTeam" name="visitorTeam" defaultValue={visitorTeam} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="time" className="text-right">Tiempo (min)</Label>
                                        <Input id="time" name="time" type="number" defaultValue={initialTime} className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                                    <Button type="submit">Guardar</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </CardContent>
      </Card>

       <Card className="mt-8">
            <CardHeader className="flex flex-row items-center justify-between p-3 bg-primary text-primary-foreground rounded-t-lg">
                <CardTitle className="text-lg">Estadísticas Generales</CardTitle>
                <Button variant="destructive" size="sm" onClick={resetGeneralStats}>
                    <RefreshCw className="mr-2 h-4 w-4"/>
                    Reiniciar Todo
                </Button>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-2">
                    <h3 className="font-semibold text-center">{localTeam}</h3>
                    {renderStatRow('local', 'goals', 'Goles', <Goal className="h-4 w-4 text-muted-foreground"/>)}
                    {renderStatRow('local', 'fouls', 'Faltas', <Shield className="h-4 w-4 text-muted-foreground"/>)}
                    {renderStatRow('local', 'timeouts', 'Tiempos Muertos', <Clock className="h-4 w-4 text-muted-foreground"/>)}
                    {renderStatRow('local', 'yellowCards', 'T. Amarillas', <YellowCardIcon />)}
                    {renderStatRow('local', 'redCards', 'T. Rojas', <RedCardIcon />)}
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold text-center">{visitorTeam}</h3>
                    {renderStatRow('visitor', 'goals', 'Goles', <Goal className="h-4 w-4 text-muted-foreground"/>)}
                    {renderStatRow('visitor', 'fouls', 'Faltas', <Shield className="h-4 w-4 text-muted-foreground"/>)}
                    {renderStatRow('visitor', 'timeouts', 'Tiempos Muertos', <Clock className="h-4 w-4 text-muted-foreground"/>)}
                    {renderStatRow('visitor', 'yellowCards', 'T. Amarillas', <YellowCardIcon />)}
                    {renderStatRow('visitor', 'redCards', 'T. Rojas', <RedCardIcon />)}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
