import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrainCircuit, Users, BarChart, Library } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col">
      <main className="flex-1">
        <section className="relative bg-background pt-16 md:pt-24 lg:pt-32">
          <div className="container px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-headline text-primary">
                  LaPizarra: Tu Asistente de Futsal con IA
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed mx-auto md:mx-0">
                  Planifica entrenamientos, gestiona tu equipo y analiza el
                  rendimiento como nunca antes. Deja que la inteligencia
                  artificial potencie tu estrategia.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Button size="lg" asChild className="font-bold">
                    <Link href="/register">Comienza tu prueba gratis</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/ejercicios">Explorar Ejercicios</Link>
                  </Button>
                </div>
              </div>
              <div className="relative aspect-video max-w-2xl mx-auto">
                <Image
                  src="https://picsum.photos/1200/800"
                  alt="Entrenador de Futsal usando una tablet"
                  data-ai-hint="futsal coach"
                  fill
                  className="rounded-xl object-cover shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-background"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-medium">
                Características Principales
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                Todo lo que un entrenador necesita
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                Desde la creación de sesiones con IA hasta el análisis
                detallado de partidos, LaPizarra te cubre.
              </p>
            </div>
            <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-2">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline">
                    Creación de Sesiones con IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Genera planes de entrenamiento completos y personalizados en
                    segundos. Solo describe tus objetivos y deja que nuestra IA
                    haga el resto.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Library className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline">
                    Biblioteca de Ejercicios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Accede a una amplia galería de ejercicios, fíltralos por
                    categoría y guárdalos como favoritos para un acceso rápido.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline">
                    Gestión de Equipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Lleva un control total de tu plantilla, asistencia, y
                    calendario de partidos y entrenamientos. Todo en un solo
                    lugar.
                  </p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <BarChart className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline">
                    Análisis de Partidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Registra estadísticas en tiempo real y obtén informes
                    detallados para tomar decisiones basadas en datos.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-accent/10">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline text-accent-foreground-dark">
                Lleva tu equipo al siguiente nivel.
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                Regístrate ahora y obtén 48 horas de acceso premium
                completamente gratis. Sin compromisos.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Button size="lg" className="w-full font-bold" asChild variant="default">
                <Link href="/register">Empezar Gratis</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
