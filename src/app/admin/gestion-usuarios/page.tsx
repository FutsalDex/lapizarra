
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import UserManagement from '../_components/UserManagement';

export default function GestionUsuariosPage() {
  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <div className="mb-8">
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Link>
        </Button>
      </div>
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Users className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Gestión de Usuarios
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Administra roles, suscripciones y datos de los usuarios.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Busca, filtra y gestiona los usuarios registrados en LaPizarra.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagement />
        </CardContent>
      </Card>
    </div>
  );
}
