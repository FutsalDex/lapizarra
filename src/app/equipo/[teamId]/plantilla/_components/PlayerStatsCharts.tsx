
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Goal, Hand } from 'lucide-react';

interface Player {
    name: string;
    goals: number;
    assists: number;
    [key: string]: any;
}

interface PlayerStatsChartsProps {
    players: Player[];
}

const chartConfig = {
    value: {
        label: "Value",
    },
    goals: {
        label: "Goles",
        color: "hsl(var(--primary))",
    },
    assists: {
        label: "Asistencias",
        color: "hsl(var(--accent))",
    },
}

export default function PlayerStatsCharts({ players }: PlayerStatsChartsProps) {

    const topScorers = useMemo(() => {
        return players
            .filter(p => p.goals > 0)
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 10);
    }, [players]);

    const topAssisters = useMemo(() => {
        return players
            .filter(p => p.assists > 0)
            .sort((a, b) => b.assists - a.assists)
            .slice(0, 10);
    }, [players]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Goal className="h-5 w-5 text-primary" />
                        <CardTitle>Goleadores de la Temporada</CardTitle>
                    </div>
                    <CardDescription>Visualización de los goles marcados por cada jugador.</CardDescription>
                </CardHeader>
                <CardContent>
                    {topScorers.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topScorers} layout="vertical" margin={{ left: 20, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis dataKey="name" type="category" width={80} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <p className="font-bold">{`${payload[0].payload.name}`}</p>
                                                    <p className="text-sm text-primary">{`Goles: ${payload[0].value}`}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="goals" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                                     <LabelList dataKey="goals" position="right" offset={5} className="fill-foreground font-medium" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            No hay datos de goles para mostrar.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Hand className="h-5 w-5 text-primary" />
                        <CardTitle>Asistentes de la Temporada</CardTitle>
                    </div>
                    <CardDescription>Visualización de las asistencias dadas por cada jugador.</CardDescription>
                </CardHeader>
                <CardContent>
                     {topAssisters.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topAssisters} layout="vertical" margin={{ left: 20, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis dataKey="name" type="category" width={80} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <p className="font-bold">{`${payload[0].payload.name}`}</p>
                                                    <p className="text-sm text-accent">{`Asistencias: ${payload[0].value}`}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="assists" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]}>
                                    <LabelList dataKey="assists" position="right" offset={5} className="fill-foreground font-medium" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            No hay datos de asistencias para mostrar.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
