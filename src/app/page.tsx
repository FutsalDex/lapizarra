import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 md:py-24 lg:py-32 px-4">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-headline text-foreground">
        LaPizarra
      </h1>
      <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed mx-auto mt-4">
        Tu compañero definitivo para el entrenamiento de fútbol sala. Descubre
        cientos de ejercicios, diseña sesiones de entrenamientos, gestiona tu
        equipo y analiza su rendimiento.
      </p>
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Card className="text-left border-primary border-2 shadow-lg bg-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">¡Potencia Tu Entrenamiento!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Suscríbete a uno de los planes para acceder al catálogo completo de ejercicios y desbloquear las herramientas avanzadas de gestión de equipos.
            </p>
            <Button asChild size="lg" className="w-full font-bold">
              <Link href="/suscripcion">
                Ver Planes <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="text-left bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Lock className="h-6 w-6 text-muted-foreground" />
              Acceso de Invitado
            </CardTitle>
             <p className="text-sm text-muted-foreground pt-1">¿Quieres probar antes de suscribirte?</p>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground space-y-2">
                <p className="font-semibold mb-2">Como invitado, puedes:</p>
                <ul className="list-disc list-inside space-y-2">
                    <li>Explorar una selección de <span className="font-bold text-primary">15 ejercicios</span> de nuestra biblioteca.</li>
                    <li>Navegar y visualizar todas las herramientas que te ofrecemos</li>
                    <li>{"Y si te registras disfrutarás de 30 días de todos los ejercicios y herramientas, antes de decidir tu suscripción."}</li>
                </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
