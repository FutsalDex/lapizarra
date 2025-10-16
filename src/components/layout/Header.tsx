
"use client";

import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Pencil, Users, Heart, Star, LogIn, UserPlus, Shield, Menu, LogOut, User, Upload, AlertTriangle, Bell } from "lucide-react";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "../ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";


const mainNav = [
  { title: "Ver ejercicios", href: "/ejercicios", icon: BookOpen },
  { title: "Crear Sesión", href: "/crear-sesion", icon: Pencil },
  { title: "Mi Equipo", href: "/mi-equipo", icon: Users },
  { title: "Favoritos", href: "/favoritos", icon: Heart },
];

const adminNav = [
    { title: "Panel Admin", href: "/admin", icon: Shield },
]

export default function Header() {
  const { user, userProfile, trialDaysLeft, db } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newUserCount, setNewUserCount] = useState(0);

  const isAdmin = user?.email === "futsaldex@gmail.com";
  let finalNav = [...mainNav];
  
  if (user && isAdmin) {
    finalNav = [...finalNav, ...adminNav];
  }
  
  useEffect(() => {
    if (!user || !isAdmin || !db) {
      setNewUserCount(0);
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayTimestamp = Timestamp.fromDate(yesterday);

    const usersQuery = query(
      collection(db, 'users'),
      where('createdAt', '>=', yesterdayTimestamp)
    );

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      setNewUserCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user, isAdmin, db]);


  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };
  
  const showTrialBanner = userProfile?.subscription === 'Trial' && trialDaysLeft !== null && trialDaysLeft <= 7 && trialDaysLeft >= 0;

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-primary text-primary-foreground print-hidden">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-2xl font-headline inline-block">
              LaPizarra
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {finalNav.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="transition-colors hover:text-white/80 text-white/90 flex items-center gap-2"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          {user ? (
             <div className="flex items-center gap-2">
               {isAdmin && (
                  <div className="relative">
                      <Bell className={cn("h-6 w-6", newUserCount > 0 ? "text-red-500 fill-red-500" : "text-white")} />
                      {newUserCount > 0 && <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-primary animate-ping" />}
                  </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-white/20">
                    <Avatar className="h-9 w-9 border-2 border-white/50">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || ''} />
                      <AvatarFallback className="bg-primary-foreground text-primary">
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
                   <DropdownMenuItem asChild>
                    <Link href="/perfil">
                      <User className="mr-2 h-4 w-4" />
                      <span>Mi Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                   <DropdownMenuItem asChild>
                    <Link href="/suscripcion">
                      <Star className="mr-2 h-4 w-4" />
                      <span>Suscripción y Puntos</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
             </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button 
                variant={pathname === '/login' ? 'secondary' : 'ghost'} 
                asChild 
                className={cn(
                    pathname === '/login' 
                        ? 'bg-white text-primary hover:bg-white/90' 
                        : 'hover:bg-white/20 hover:text-white'
                )}
              >
                <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión</Link>
              </Button>
              <Button 
                asChild 
                variant={pathname === '/register' ? 'secondary' : 'ghost'}
                className={cn(
                    pathname === '/register'
                        ? 'bg-white text-primary hover:bg-white/90'
                        : 'hover:bg-white/20 hover:text-white'
                )}
              >
                <Link href="/register"><UserPlus className="mr-2 h-4 w-4" /> Registrarse</Link>
              </Button>
            </div>
          )}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="md:hidden px-2 hover:bg-white/20"
                aria-label="Toggle Menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0 flex flex-col bg-primary text-primary-foreground">
              <SheetTitle className="sr-only">Menú de navegación móvil</SheetTitle>
              <SheetDescription className="sr-only">
                Una lista de enlaces para navegar por el sitio web.
              </SheetDescription>
              <SheetClose asChild>
                <Link href="/" className="flex items-center space-x-2 mb-6">
                   <span className="font-bold text-2xl font-headline inline-block">
                    LaPizarra
                  </span>
                </Link>
              </SheetClose>
              <div className="flex flex-col space-y-3">
                {finalNav.map((item) => (
                  <SheetClose asChild key={item.title}>
                    <Link
                      href={item.href}
                      className="transition-colors hover:text-white/80 p-2 rounded-md flex items-center gap-2"
                    >
                       {item.icon && <item.icon className="h-5 w-5" />}
                      {item.title}
                    </Link>
                  </SheetClose>
                ))}
              </div>
              <div className="mt-auto flex flex-col space-y-2">
                {user ? (
                   <SheetClose asChild>
                     <Button onClick={handleLogout} variant="secondary" className="bg-white text-primary hover:bg-white/90">
                       Cerrar Sesión
                     </Button>
                   </SheetClose>
                ) : (
                  <>
                  <SheetClose asChild>
                    <Button variant="ghost" asChild className="hover:bg-white/20 justify-start">
                      <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild variant="secondary" className="bg-white text-primary hover:bg-white/90 justify-start">
                      <Link href="/register"><UserPlus className="mr-2 h-4 w-4" /> Registrarse</Link>
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
     {showTrialBanner && (
        <div className="bg-yellow-400 text-yellow-900 text-sm font-semibold p-2 text-center print-hidden">
            <div className="container mx-auto flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <p>
                    ¡Tu período de prueba {trialDaysLeft === 0 ? 'termina hoy' : `termina en ${trialDaysLeft} día(s)`}! 
                    <Link href="/suscripcion" className="underline hover:text-yellow-800 ml-2">
                        Suscríbete ahora para no perder el acceso.
                    </Link>
                </p>
            </div>
        </div>
      )}
    </>
  );
}
