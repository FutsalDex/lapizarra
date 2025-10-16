
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Upload, List } from 'lucide-react';
import UploadExerciseForm from '../admin/_components/UploadExerciseForm';
import UserExerciseList from '../suscripcion/_components/UserExerciseList';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import Link from 'next/link';

export default function MisEjerciciosPage() {
    const { userProfile } = useAuth();
    const canUpload = userProfile?.subscription === 'Pro' || userProfile?.subscription === 'Admin';
  return (
    <div className="container mx-auto max-w-5xl py-12 px-4">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Upload className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
          Mis Ejercicios
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Aporta ejercicios a la comunidad, gestiónalos y gana puntos para tu suscripción.
        </p>
      </div>

      <Tabs defaultValue="subir-ejercicio" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subir-ejercicio">
            <Upload className="mr-2 h-4 w-4" />
            Subir Ejercicio
          </TabsTrigger>
          <TabsTrigger value="mis-ejercicios">
            <List className="mr-2 h-4 w-4" />
            Mis Ejercicios Subidos
          </TabsTrigger>
        </TabsList>
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
                {canUpload ? (
                    <UploadExerciseForm showBatchUpload={false} />
                ) : (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p className="font-semibold">Función exclusiva para usuarios Pro</p>
                        <p className="text-sm mt-2">Suscríbete al plan Pro para poder subir tus propios ejercicios.</p>
                        <Button asChild className="mt-4">
                            <Link href="/suscripcion">Ver Planes</Link>
                        </Button>
                    </div>
                )}
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
