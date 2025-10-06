'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Upload, List } from 'lucide-react';
import LoyaltyStatus from './_components/LoyaltyStatus';
import UploadExerciseForm from '../admin/_components/UploadExerciseForm';
import UserExerciseList from './_components/UserExerciseList';

export default function SuscripcionPage() {
  return (
    <div className="container mx-auto max-w-5xl py-12 px-4">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Star className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Mi Suscripción y Puntos
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Gestiona tu plan, consulta tus puntos de fidelización y aporta a la
          comunidad.
        </p>
      </div>

      <Tabs defaultValue="fidelizacion" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fidelizacion">
            <Star className="mr-2 h-4 w-4" />
            Mi Fidelización
          </TabsTrigger>
          <TabsTrigger value="subir-ejercicio">
            <Upload className="mr-2 h-4 w-4" />
            Subir Ejercicio
          </TabsTrigger>
          <TabsTrigger value="mis-ejercicios">
            <List className="mr-2 h-4 w-4" />
            Mis Ejercicios Subidos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fidelizacion">
          <Card>
            <CardHeader>
              <CardTitle>Programa de Fidelización</CardTitle>
              <CardDescription>
                Gana puntos subiendo ejercicios y obtén descuentos en tu
                renovación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoyaltyStatus />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="subir-ejercicio">
          <Card>
            <CardHeader>
              <CardTitle>Añadir Nuevo Ejercicio</CardTitle>
              <CardDescription>
                Completa el formulario para añadir un nuevo ejercicio a la
                biblioteca y ganar puntos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadExerciseForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="mis-ejercicios">
          <Card>
            <CardHeader>
              <CardTitle>Ejercicios que Has Subido</CardTitle>
              <CardDescription>
                Aquí puedes ver y gestionar todos los ejercicios que has
                aportado a la comunidad.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserExerciseList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
