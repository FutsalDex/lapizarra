'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

interface Player {
  id: string;
  name: string;
  number: number;
}

interface Match {
  id: string;
  localTeam: string;
  visitorTeam: string;
  localPlayers?: { id: string }[];
  visitorPlayers?: { id: string }[];
  teamId: string;
}

interface ConvocatoriaDialogProps {
  children: React.ReactNode;
  teamId: string;
  match: Match;
}

export default function ConvocatoriaDialog({ children, teamId, match }: ConvocatoriaDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [userTeamName, setUserTeamName] = useState<string>('');

  useEffect(() => {
    const fetchTeamAndPlayers = async () => {
      if (!open || !teamId) return;
      setLoading(true);

      // Fetch team name
      const teamDoc = await getDoc(doc(db, 'teams', teamId));
      const currentTeamName = teamDoc.exists() ? teamDoc.data().name : '';
      setUserTeamName(currentTeamName);
      
      // Fetch active players
      const q = query(collection(db, 'teams', teamId, 'players'), where('active', '==', true));
      const querySnapshot = await getDocs(q);
      const playersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
      setTeamPlayers(playersData.sort((a, b) => a.number - b.number));
      
      // Initialize selected players based on which team the user is
      const matchPlayers = currentTeamName === match.localTeam ? match.localPlayers : match.visitorPlayers;
      const initialSelected = new Set(matchPlayers?.map(p => p.id) || []);
      setSelectedPlayers(initialSelected);

      setLoading(false);
    };

    fetchTeamAndPlayers();
  }, [open, teamId, match]);
  
  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(playerId)) {
            newSet.delete(playerId);
        } else {
            newSet.add(playerId);
        }
        return newSet;
    });
  }

  const handleSelectAll = () => {
    if (selectedPlayers.size === teamPlayers.length) {
      // All are selected, so deselect all
      setSelectedPlayers(new Set());
    } else {
      // Not all are selected, so select all
      const allPlayerIds = new Set(teamPlayers.map(p => p.id));
      setSelectedPlayers(allPlayerIds);
    }
  };
  
  const handleSaveConvocatoria = async () => {
    setSaving(true);
    const playersKey = userTeamName === match.localTeam ? 'localPlayers' : 'visitorPlayers';
    
    const selectedPlayerData = teamPlayers
      .filter(p => selectedPlayers.has(p.id))
      .map(p => ({
        id: p.id,
        name: p.name,
        number: p.number,
        goals: 0,
        assists: 0,
        amarillas: 0,
        rojas: 0,
        faltas: 0,
        paradas: 0,
        gRec: 0,
        vs1: 0,
        isPlaying: false,
        timeOnCourt: 0,
        lastEntryTime: 0,
        minutosJugados: 0,
      }));

    try {
        const matchRef = doc(db, 'matches', match.id);
        await updateDoc(matchRef, { [playersKey]: selectedPlayerData });
        toast({ title: 'Convocatoria Guardada', description: 'Los jugadores para este partido han sido actualizados.' });
        setOpen(false);
    } catch(error) {
        console.error('Error saving convocatoria:', error);
        toast({ title: 'Error', description: 'No se pudo guardar la convocatoria.', variant: 'destructive' });
    } finally {
        setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convocar Jugadores</DialogTitle>
          <DialogDescription>
            Selecciona los jugadores que participarán en el partido.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
        ) : (
        <ScrollArea className="h-80 pr-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Dorsal</TableHead>
                <TableHead>Nombre</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamPlayers.map(player => (
                <TableRow key={player.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedPlayers.has(player.id)}
                      onCheckedChange={() => handleSelectPlayer(player.id)}
                      id={`player-${player.id}`}
                    />
                  </TableCell>
                  <TableCell>{player.number}</TableCell>
                  <TableCell>{player.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        )}
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={handleSelectAll}>
            {selectedPlayers.size === teamPlayers.length ? 'Desmarcar Todos' : 'Marcar Todos'}
          </Button>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleSaveConvocatoria} disabled={loading || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
