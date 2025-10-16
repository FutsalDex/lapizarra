
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="font-bold font-headline text-lg text-slate-800">LaPizarra</span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} LaPizarra. Todos los derechos
            reservados.
          </p>
          <div className="flex space-x-4">
            <Link
              href="/terminos"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Términos de Servicio
            </Link>
            <Link
              href="/privacidad"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Política de Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

    