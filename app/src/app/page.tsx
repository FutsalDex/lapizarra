import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../components/ui/card";
import { Lock, ArrowRight, UserPlus } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 md:py-24 lg:py-32 px-4 bg-background">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-headline text-foreground">
        LaPizarra
      </h1>
      <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed mx-auto mt-4">
        Tu compañero definitivo para el entrenamiento de fútbol sala. Descubre
        cientos de ejercicios, diseña sesiones de entrenamientos, gestiona tu
        equipo y analiza su rendimiento.
      </p>
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Card className="text-left shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">¡Potencia Tu Entrenamiento!</CardTitle>
            <CardDescription>
              Accede al catálogo completo y a las herramientas avanzadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Suscríbete a uno de nuestros planes para desbloquear todo el potencial de LaPizarra y llevar a tu equipo al siguiente nivel.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild size="lg" className="w-full font-bold">
              <Link href="/suscripcion">
                Ver Planes <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="text-left bg-secondary/50 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Lock className="h-6 w-6 text-muted-foreground" />
              Acceso de Invitado
            </CardTitle>
             <CardDescription>¿Quieres probar antes de suscribirte?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground space-y-4">
                <p>Como invitado, puedes explorar una selección de nuestros ejercicios y familiarizarte con la plataforma.</p>
                <p className="font-semibold">Para una experiencia completa, regístrate y obtén 30 días de prueba con acceso a todas las funcionalidades.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="secondary" size="lg" className="w-full font-bold">
                <Link href="/register">
                    Regístrate Gratis <UserPlus className="ml-2 h-5 w-5" />
                </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
