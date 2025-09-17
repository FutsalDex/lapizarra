
'use client';

import { useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileQuestion } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import * as XLSX from 'xlsx';
import { useAuth } from '@/context/AuthContext';

export default function UploadMatchForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBatchUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result;
        if (!arrayBuffer) throw new Error("No se pudo leer el archivo.");

        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const matchesData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!Array.isArray(matchesData) || matchesData.length === 0) {
            throw new Error("El archivo de Excel está vacío o tiene un formato incorrecto.");
        }

        const matchesCollection = collection(db, 'matches');
        let count = 0;
        for (const match of matchesData) {
            if (match.equipoLocal && match.equipoVisitante && match.fecha) {
                // Basic validation
                const date = new Date(match.fecha);
                if (isNaN(date.getTime())) {
                    console.warn(`Fecha inválida para el partido: ${match.equipoLocal} vs ${match.equipoVisitante}`);
                    continue;
                }

                const docData = {
                  localTeam: match.equipoLocal,
                  visitorTeam: match.equipoVisitante,
                  date: date.toISOString(),
                  matchType: match.tipoPartido || 'Amistoso',
                  competition: match.competicion || '',
                  matchday: match.jornada || '',
                  localScore: match.golesLocal || 0,
                  visitorScore: match.golesVisitante || 0,
                  teamId: match.idEquipo || '', // Make sure teamId is in the Excel file
                  userId: user.uid,
                  isFinished: match.finalizado !== undefined ? !!match.finalizado : false,
                  createdAt: new Date(),
                };
                await addDoc(matchesCollection, docData);
                count++;
            }
        }
        
        toast({
          title: '¡Éxito!',
          description: `${count} partidos han sido añadidos desde el archivo Excel.`,
        });

      } catch (error: any) {
        console.error('Error uploading batch matches: ', error);
        toast({
          title: 'Error en la carga por lotes',
          description: error.message || 'Por favor, comprueba el formato del archivo Excel.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Subida por Lotes (Excel)</h3>
      <Alert className="mb-4">
        <FileQuestion className="h-4 w-4" />
        <AlertTitle>¿Cómo funciona?</AlertTitle>
        <AlertDescription>
          Sube un archivo Excel (.xlsx) con los partidos. Las columnas deben ser: `equipoLocal`, `equipoVisitante`, `fecha` (formato YYYY-MM-DD), `tipoPartido`, `competicion` (opcional), `jornada` (opcional), `golesLocal` (opcional), `golesVisitante` (opcional), `idEquipo`, `finalizado` (TRUE/FALSE).
        </AlertDescription>
      </Alert>

      <div className="mt-4">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleBatchUpload}
          className="hidden"
          ref={fileInputRef}
          disabled={loading}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          disabled={loading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {loading ? 'Subiendo...' : 'Seleccionar Archivo Excel'}
        </Button>
      </div>
    </div>
  );
}
