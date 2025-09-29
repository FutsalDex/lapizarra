
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HardHat, ClipboardList } from 'lucide-react';
import Link from 'next/link';

export default function CrearSesionPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="text-center w-full max-w-lg">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <HardHat className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline tracking-tight text-primary">
            Módulo en Construcción
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            El nuevo creador de sesiones estará disponible muy pronto con funcionalidades increíbles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Estamos trabajando para ofrecerte la mejor herramienta para planificar tus entrenamientos. ¡Gracias por tu paciencia!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
