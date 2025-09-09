
"use client";

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Goal, Menu, LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";


const baseNav = [
  { title: "Ejercicios", href: "/ejercicios" },
  { title: "Crear Sesión", href: "/crear-sesion" },
  { title: "Mi Equipo", href: "/mi-equipo" },
];

const adminNav = [
    { title: "Panel Admin", href: "/admin", icon: Shield },
]

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

  const isAdmin = user?.email === "futsaldex@gmail.com";
  const mainNav = isAdmin ? [...baseNav, ...adminNav] : baseNav;

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Goal className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline inline-block">
              LaPizarra
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-2"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          {user ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || ''} />
                    <AvatarFallback>
                      {isAdmin ? <Shield className="h-5 w-5" /> : (user.email ? user.email.charAt(0).toUpperCase() : <User />)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName || 'Usuario'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Registrarse</Link>
              </Button>
            </div>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="md:hidden px-2"
                aria-label="Toggle Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0 flex flex-col">
              <SheetClose asChild>
                <Link href="/" className="flex items-center space-x-2 mb-6">
                  <Goal className="h-6 w-6 text-primary" />
                  <span className="font-bold font-headline inline-block">
                    LaPizarra
                  </span>
                </Link>
              </SheetClose>
              <div className="flex flex-col space-y-3">
                {mainNav.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className="transition-colors hover:text-foreground/80 text-foreground/60 p-2 rounded-md flex items-center gap-2"
                    >
                       {item.icon && <item.icon className="h-4 w-4" />}
                      {item.title}
                    </Link>
                  </SheetClose>
                ))}
              </div>
              <div className="mt-auto flex flex-col space-y-2">
                {user ? (
                   <SheetClose asChild>
                     <Button onClick={handleLogout} variant="outline">
                       Cerrar Sesión
                     </Button>
                   </SheetClose>
                ) : (
                  <>
                  <SheetClose asChild>
                    <Button variant="ghost" asChild>
                      <Link href="/login">Iniciar Sesión</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild>
                      <Link href="/register">Registrarse</Link>
                    </Button>
                  </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
