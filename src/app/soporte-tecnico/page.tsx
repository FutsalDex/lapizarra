
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LifeBuoy, Send, User, Bot, Loader2, CornerDownLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { interactiveAiSupport } from '@/ai/flows/interactive-ai-support';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export default function SoporteTecnicoPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    useEffect(() => {
        // Add initial greeting from AI
        setMessages([
            { id: 'init', text: '¡Hola! Soy LaPizarra AI, tu asistente de futsal. ¿En qué puedo ayudarte hoy?', sender: 'ai'}
        ])
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await interactiveAiSupport({ query: input });
            const aiMessage: Message = { id: (Date.now() + 1).toString(), text: aiResponse.response, sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Error calling AI support:", error);
            const errorMessage: Message = { id: (Date.now() + 1).toString(), text: 'Lo siento, he tenido un problema para procesar tu solicitud. Inténtalo de nuevo.', sender: 'ai' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="text-center mb-12">
         <div className="flex justify-center mb-4">
            <LifeBuoy className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Soporte Técnico con IA
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Chatea con nuestro entrenador por IA para resolver tus dudas.
        </p>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle>Chat con LaPizarra AI</CardTitle>
          <CardDescription>Haz una pregunta sobre tácticas, ejercicios o gestión de equipos.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
            <ScrollArea className="flex-grow h-0 pr-4" ref={scrollAreaRef}>
                 <div className="space-y-6">
                    {messages.map((message) => (
                    <div key={message.id} className={cn("flex items-start gap-4", message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                        {message.sender === 'ai' && (
                            <Avatar className="h-9 w-9 border-2 border-primary/50">
                                <AvatarFallback className="bg-primary text-primary-foreground"><Bot/></AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn("max-w-md p-3 rounded-lg", message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                           <p className="text-sm">{message.text}</p>
                        </div>
                         {message.sender === 'user' && (
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user?.photoURL || undefined} />
                                <AvatarFallback><User /></AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-4 justify-start">
                            <Avatar className="h-9 w-9 border-2 border-primary/50">
                                <AvatarFallback className="bg-primary text-primary-foreground"><Bot/></AvatarFallback>
                            </Avatar>
                            <div className="max-w-md p-3 rounded-lg bg-muted">
                                <Loader2 className="h-5 w-5 animate-spin"/>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
           <form onSubmit={handleSendMessage} className="mt-4 border-t pt-4">
             <div className="relative">
                <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu pregunta aquí..."
                    className="pr-16"
                    disabled={isLoading}
                />
                <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-14" disabled={isLoading}>
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Enviar</span>
                </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3"/>
                <span>Presiona <kbd className="font-sans">Enter</kbd> para enviar</span>
            </p>
           </form>
        </CardContent>
      </Card>
    </div>
  );
}
