
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  PlusCircle,
  UploadCloud,
  ClipboardList,
  Users,
  Trophy,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="container mx-auto max-w-7xl py-12 px-4">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
            <ShieldCheck className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Panel de Administración
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Herramientas para gestionar el contenido de LaPizarra.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Card de Gestión de Ejercicios */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Gestión de Ejercicios</CardTitle>
            <CardDescription>
              Añade, modifica o elimina ejercicios de la biblioteca,
              individualmente o por lote.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button asChild size="lg">
                <Link href="/admin/gestion-ejercicios">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Añadir Nuevo Ejercicio
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                 <Link href="/admin/gestion-ejercicios">
                    <UploadCloud className="mr-2 h-5 w-5" />
                    Añadir por Lote
                 </Link>
              </Button>
            </div>
            <Button asChild variant="outline" className="w-full" size="lg">
                <Link href="/admin/gestion-ejercicios/listado">
                    <ClipboardList className="mr-2 h-5 w-5" />
                    Ver/Gestionar Ejercicios
                </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Card de Gestión de Usuarios */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Gestión de Usuarios</CardTitle>
            <CardDescription>
              Gestiona las suscripciones y los roles de los usuarios registrados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="lg">
              <Link href="/admin/gestion-usuarios">
                <Users className="mr-2 h-5 w-5" />
                Gestionar Usuarios y Roles
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        {/* Card de Gestión de Partidos */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Gestión de Partidos</CardTitle>
            <CardDescription>
              Añade partidos a la base de datos de forma masiva a través de un archivo Excel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="lg">
              <Link href="/admin/gestion-partidos">
                <Trophy className="mr-2 h-5 w-5" />
                Subir Partidos por Lote
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Card de Estadísticas de Navegación */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Estadísticas de Navegación</CardTitle>
            <CardDescription>
              Métricas de uso y visitas de la aplicación.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="border p-3 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Visitantes Hoy</p>
                <p className="text-3xl font-bold">1,234</p>
             </div>
             <div className="grid grid-cols-2 gap-4">
                 <div className="border p-3 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Registrados</p>
                    <p className="text-2xl font-bold">345</p>
                 </div>
                 <div className="border p-3 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Anónimos</p>
                    <p className="text-2xl font-bold">889</p>
                 </div>
             </div>
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href="#">
                <BarChart3 className="mr-2 h-5 w-5" />
                Ver Analytics Completo
              </Link>
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
