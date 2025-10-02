
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, BookCopy } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import SessionSheetPreviewDialog from './SessionSheetPreviewDialog';

interface DownloadOptionsDialogProps {
  children: React.ReactNode;
  onDownload: () => void;
  previewImage: string | null;
}

const options = [
  {
    title: 'Resumido',
    id: 'resumido',
    pro: false,
    new: false,
    icon: (
        <svg viewBox="0 0 100 80" className="w-full h-full">
            <rect x="5" y="5" width="90" height="70" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"></rect>
            <rect x="10" y="10" width="80" height="10" fill="currentColor" opacity="0.2"></rect>
            <rect x="10" y="25" width="38" height="20" fill="currentColor" opacity="0.2"></rect>
            <rect x="52" y="25" width="38" height="20" fill="currentColor" opacity="0.2"></rect>
            <rect x="10" y="50" width="38" height="20" fill="currentColor" opacity="0.2"></rect>
            <rect x="52" y="50" width="38" height="20" fill="currentColor" opacity="0.2"></rect>
        </svg>
    )
  },
  {
    title: 'Extendido',
    id: 'extendido',
    pro: true,
    new: false,
     icon: (
        <svg viewBox="0 0 100 80" className="w-full h-full">
            <rect x="5" y="5" width="90" height="70" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"></rect>
            <rect x="10" y="10" width="80" height="10" fill="currentColor" opacity="0.2"></rect>
            <rect x="10" y="25" width="45" height="45" fill="currentColor" opacity="0.2"></rect>
            <rect x="60" y="25" width="30" height="20" fill="currentColor" opacity="0.2"></rect>
            <rect x="60" y="50" width="30" height="20" fill="currentColor" opacity="0.2"></rect>
        </svg>
    )
  },
  {
    title: 'Editable',
    id: 'editable',
    pro: true,
    new: true,
    icon: (
        <svg viewBox="0 0 100 80" className="w-full h-full">
            <rect x="5" y="5" width="90" height="70" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"></rect>
            <rect x="10" y="10" width="80" height="10" fill="currentColor" opacity="0.2"></rect>
            <rect x="10" y="25" width="45" height="45" fill="currentColor" opacity="0.2"></rect>
            <rect x="60" y="25" width="30" height="20" fill="currentColor" opacity="0.2"></rect>
            <rect x="60" y="50" width="30" height="20" fill="currentColor" opacity="0.2">
            </rect>
            <path d="M70 60 L75 65 L85 55" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
  },
];

export default function DownloadOptionsDialog({
  children,
  onDownload,
  previewImage,
}: DownloadOptionsDialogProps) {
  const [selected, setSelected] = useState('resumido');

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>¿Qué tipo de PDF quieres descargar?</DialogTitle>
          <DialogDescription>
            Elige el formato que mejor se adapte a tus necesidades.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-40 rounded-md overflow-hidden bg-muted my-4">
            <Image 
                src={previewImage || `https://picsum.photos/seed/session/800/400`}
                alt="Vista previa de la sesión"
                fill
                className="object-contain"
            />
        </div>

        <div className="grid grid-cols-3 gap-4 py-4">
          {options.map((opt) => (
            <div
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={cn(
                'border-2 rounded-lg p-3 text-center cursor-pointer transition-all relative',
                selected === opt.id
                  ? 'border-primary shadow-lg'
                  : 'border-border hover:border-primary/50',
                opt.pro ? 'opacity-50 cursor-not-allowed' : ''
              )}
            >
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                 {opt.pro && <Badge variant="destructive" className="bg-yellow-500 hover:bg-yellow-600 text-white">PRO</Badge>}
                 {opt.new && <Badge variant="destructive">Nuevo</Badge>}
              </div>

              <div className="h-24 w-full text-muted-foreground p-2">{opt.icon}</div>

              <p className="font-semibold mt-2">{opt.title}</p>
            </div>
          ))}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" asChild>
            <Link href="/mis-sesiones">
              <BookCopy className="mr-2 h-4 w-4" />
              Ir a sesiones
            </Link>
          </Button>
          <SessionSheetPreviewDialog onDownload={onDownload}>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Descargar sesión
              </Button>
          </SessionSheetPreviewDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

