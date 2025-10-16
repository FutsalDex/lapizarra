
'use client';

import { useState, useRef } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../hooks/use-toast';
import { Loader2, Upload, FileQuestion } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../context/AuthContext';

// Function to convert Excel serial date to JS Date
const excelSerialDateToJSDate = (serial: number) => {
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;                                        
    const date_info = new Date(utc_value * 1000);

    const fractional_day = serial - Math.floor(serial) + 0.0000001;

    let total_seconds = Math.floor(86400 * fractional_day);

    const seconds = total_seconds % 60;
    total_seconds -= seconds;

    const hours = Math.floor(total_seconds / (60 * 60));
    const minutes = Math.floor(total_seconds / 60) % 60;

    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}


export default function UploadMatchForm() {
  const { toast } = useToast();
  const { user, db } = useAuth();
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
                
                let matchDate: Date | undefined;
                
                // Handle Excel serial date number
                if (typeof match.fecha === 'number') {
                    matchDate = excelSerialDateToJSDate(match.fecha);
                } 
                // Handle string date format (DD/MM/AAAA)
                else if (typeof match.fecha === 'string') {
                    const parts = match.fecha.split(/[/|-]/);
                    if (parts.length === 3) {
                        const day = parseInt(parts[0], 10);
                        const month = parseInt(parts[1], 10);
                        let year = parseInt(parts[2], 10);

                        if (isNaN(day) || isNaN(month) || isNaN(year)) {
                           console.warn(`Fecha inválida (partes no numéricas) para el partido: ${match.equipoLocal} vs ${match.equipoVisitante}. Valor: "${match.fecha}".`);
                           continue;
                        }

                        if (year < 100) { 
                            year += 2000;
                        }
                        // Correctly construct date using new Date(year, monthIndex, day)
                        matchDate = new Date(year, month - 1, day);
                    }
                }

                if (!matchDate || isNaN(matchDate.getTime())) {
                    console.warn(`Formato de fecha no reconocido o inválido para el partido: ${match.equipoLocal} vs ${match.equipoVisitante}. Valor de fecha: "${match.fecha}". Se saltará este partido.`);
                    continue; // Skip this record
                }


                const docData = {
                  localTeam: match.equipoLocal,
                  visitorTeam: match.equipoVisitante,
                  date: matchDate.toISOString(),
                  matchType: match.tipoPartido || 'Amistoso',
                  competition: match.competicion || '',
                  matchday: match.jornada || '',
                  localScore: match.golesLocal || 0,
                  visitorScore: match.golesVisitante || 0,
                  teamId: match.idEquipo || '',
                  userId: user.uid,
                  isFinished: match.finalizado !== undefined ? (String(match.finalizado).toUpperCase() === 'TRUE') : false,
                  createdAt: new Date(),
                };
                await addDoc(matchesCollection, docData);
                count++;
            }
        }
        
        if (count > 0) {
            toast({
              title: '¡Éxito!',
              description: `${count} partidos han sido añadidos desde el archivo Excel.`,
            });
        } else {
             toast({
              title: 'Atención',
              description: `No se ha añadido ningún partido. Revisa el formato del archivo Excel y los datos de los partidos.`,
              variant: 'destructive'
            });
        }


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
          Sube un archivo Excel (.xlsx) con los partidos. Las columnas deben ser: `equipoLocal`, `equipoVisitante`, `fecha`, `tipoPartido`, `competicion` (opcional), `jornada` (opcional), `golesLocal` (opcional), `golesVisitante` (opcional), `idEquipo`, `finalizado` (TRUE/FALSE). El formato de la fecha debe ser DD/MM/AAAA.
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
