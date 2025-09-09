
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Play, Pause, RefreshCw, Settings, PenSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function MarcadorPage() {
  const [localTeam, setLocalTeam] = useState('Local');
  const [visitorTeam, setVisitorTeam] = useState('Visitante');
  const [localScore, setLocalScore] = useState(0);
  const [visitorScore, setVisitorScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (!isActive && timeLeft !== 0) {
      if(interval) clearInterval(interval);
    }
    return () => {
        if(interval) clearInterval(interval)
    };
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25*60);
  }

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
                <div className="flex justify-between items-center w-full max-w-2xl mb-6">
                    <Input className="text-2xl font-bold text-center w-1/3 h-14" value={localTeam} onChange={(e) => setLocalTeam(e.target.value)} />
                    <div className="text-5xl font-bold text-primary tabular-nums">
                        {localScore} - {visitorScore}
                    </div>
                    <Input className="text-2xl font-bold text-center w-1/3 h-14" value={visitorTeam} onChange={(e) => setVisitorTeam(e.target.value)} />
                </div>

                <div className="flex justify-between items-center w-full max-w-xs mb-6">
                    <Button onClick={() => setLocalScore(s => Math.max(0, s-1))}>-</Button>
                    <span className="text-lg font-semibold">Goles Local</span>
                    <Button onClick={() => setLocalScore(s => s+1)}>+</Button>
                </div>
                 <div className="flex justify-between items-center w-full max-w-xs mb-8">
                    <Button onClick={() => setVisitorScore(s => Math.max(0, s-1))}>-</Button>
                     <span className="text-lg font-semibold">Goles Visitante</span>
                    <Button onClick={() => setVisitorScore(s => s+1)}>+</Button>
                </div>

                <div className="text-7xl font-mono font-bold my-4 text-center tabular-nums bg-gray-900 dark:bg-gray-800 text-white py-4 px-6 rounded-lg">
                    {formatTime(timeLeft)}
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={() => setIsActive(!isActive)} size="lg">
                        {isActive ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                        {isActive ? 'Pausar' : 'Iniciar'}
                    </Button>
                     <Button onClick={resetTimer} variant="outline" size="lg">
                        <RefreshCw className="mr-2"/>
                        Reiniciar
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setTimeLeft(prev => prev + 60)}>
                        +1 min
                    </Button>
                     <Button variant="ghost" size="icon" onClick={() => setTimeLeft(prev => Math.max(0, prev - 60))}>
                        -1 min
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
