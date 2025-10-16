
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
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Download, BookCopy } from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../../lib/utils';
import Image from 'next/image';
import SessionSheetPreviewDialog from './SessionSheetPreviewDialog';
import SessionSheetPreviewSummarizedDialog from './SessionSheetPreviewSummarizedDialog';
import { useAuth } from '../../../context/AuthContext';

interface DownloadOptionsDialogProps {
  children: React.ReactNode;
  onDownload: () => any;
}

const options = [
  {
    title: 'Resumido',
    id: 'resumido',
    pro: false,
    description: 'Solo datos de la sesión e imágenes de los ejercicios.',
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
    description: 'Ficha completa con todos los detalles de los ejercicios.',
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
];

export default function DownloadOptionsDialog({
  children,
  onDownload,
}: DownloadOptionsDialogProps) {
  const { userProfile } = useAuth();
  const [selected, setSelected] = useState('resumido');
  const isPro = userProfile?.subscription === 'Pro' || userProfile?.subscription === 'Admin';


  const handleSelect = (id: string) => {
    const option = options.find(opt => opt.id === id);
    if (option?.pro && !isPro) {
        // Optionally, show a toast or message
        return;
    }
    setSelected(id);
  }

  const PreviewDialog = selected === 'extendido' ? SessionSheetPreviewDialog : SessionSheetPreviewSummarizedDialog;


  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>¿Qué tipo de PDF quieres descargar?</DialogTitle>
          <DialogDescription>
            Elige el formato que mejor se adapte a tus necesidades.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          {options.map((opt) => (
            <div
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={cn(
                'border-2 rounded-lg p-4 text-center cursor-pointer transition-all relative',
                selected === opt.id
                  ? 'border-primary shadow-lg'
                  : 'border-border hover:border-primary/50',
                opt.pro && !isPro ? 'opacity-50 cursor-not-allowed' : ''
              )}
            >
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                 {opt.pro && <Badge variant="destructive" className="bg-yellow-500 hover:bg-yellow-600 text-white">PRO</Badge>}
              </div>

              <div className="h-24 w-full text-muted-foreground p-2">{opt.icon}</div>

              <p className="font-semibold mt-2">{opt.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
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
          <PreviewDialog onDownload={onDownload}>
              <Button disabled={selected === 'extendido' && !isPro}>
                <Download className="mr-2 h-4 w-4" />
                Descargar sesión
              </Button>
          </PreviewDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
