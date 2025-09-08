"use client";

import Link from "next/link";
import { Goal, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

const mainNav = [
  { title: "Ejercicios", href: "/ejercicios" },
  { title: "Crear Sesión", href: "/crear-sesion" },
  { title: "Mi Equipo", href: "/mi-equipo" },
];

export default function Header() {
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
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Registrarse</Link>
            </Button>
          </div>
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
                      className="transition-colors hover:text-foreground/80 text-foreground/60 p-2 rounded-md"
                    >
                      {item.title}
                    </Link>
                  </SheetClose>
                ))}
              </div>
              <div className="mt-auto flex flex-col space-y-2">
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
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
