
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
       <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline tracking-tighter text-primary">
          Panel de Administración
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Gestión central de LaPizarra.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <span>Acceso de Administrador</span>
          </CardTitle>
          <CardDescription>
            Bienvenido al panel de control. Desde aquí puedes gestionar la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Próximamente: gestión de usuarios, estadísticas y más.</p>
        </CardContent>
      </Card>
    </div>
  );
}
