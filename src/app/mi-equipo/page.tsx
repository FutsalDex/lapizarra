
'use client';
import { useState } from 'react';
import {
  interactiveAiSupport,
  type InteractiveAiSupportInput,
  type InteractiveAiSupportOutput,
} from '@/ai/flows/interactive-ai-support';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Bot, Loader2, Send, User } from 'lucide-react';

const teamMembers = [
  {
    name: 'Alex García',
    position: 'Cierre',
    avatar: 'https://picsum.photos/id/237/40/40',
  },
  {
    name: 'Marta López',
    position: 'Ala',
    avatar: 'https://picsum.photos/id/238/40/40',
  },
  {
    name: 'Carlos Ruiz',
    position: 'Pívot',
    avatar: 'https://picsum.photos/id/239/40/40',
  },
  {
    name: 'Sofía Fernández',
    position: 'Portera',
    avatar: 'https://picsum.photos/id/240/40/40',
  },
  {
    name: 'Javier Moreno',
    position: 'Ala',
    avatar: 'https://picsum.photos/id/241/40/40',
  },
];

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

export default function MiEquipoPage() {
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const newHistory: Message[] = [...chatHistory, { text: query, sender: 'user' }];
    setChatHistory(newHistory);
    setQuery('');
    setLoading(true);

    try {
      const result = await interactiveAiSupport({ query });
      setChatHistory([
        ...newHistory,
        { text: result.response, sender: 'ai' },
      ]);
    } catch (error) {
      console.error('Error with AI support:', error);
      setChatHistory([
        ...newHistory,
        { text: 'Lo siento, no puedo responder en este momento.', sender: 'ai' },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline tracking-tighter text-primary">
          Gestión de Equipo
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Tu centro de mando para todo lo relacionado con el equipo.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Plantilla de Jugadores</CardTitle>
              <CardDescription>
                Lista de todos los miembros de tu equipo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Posición</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((player) => (
                    <TableRow key={player.name}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={player.avatar} alt={player.name} data-ai-hint="person portrait" />
                            <AvatarFallback>
                              {player.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{player.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{player.position}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle>Soporte con IA</CardTitle>
              <CardDescription>
                Consulta tus dudas al asistente virtual.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <ScrollArea className="flex-grow h-64 pr-4 -mr-4 mb-4">
                <div className="space-y-4">
                  {chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 ${
                        msg.sender === 'user' ? 'justify-end' : ''
                      }`}
                    >
                      {msg.sender === 'ai' && (
                        <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                          <AvatarFallback>
                            <Bot className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-xs rounded-lg px-4 py-2 ${
                          msg.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                      </div>
                      {msg.sender === 'user' && (
                         <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {loading && (
                     <div className="flex items-start gap-3">
                       <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                          <AvatarFallback>
                            <Bot className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="max-w-xs rounded-lg px-4 py-2 bg-muted">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                     </div>
                  )}
                </div>
              </ScrollArea>
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pregunta algo..."
                  disabled={loading}
                />
                <Button type="submit" size="icon" disabled={loading}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
