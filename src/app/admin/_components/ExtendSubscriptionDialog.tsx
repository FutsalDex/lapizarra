
'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../hooks/use-toast';
import { doc, updateDoc, Timestamp, Firestore } from 'firebase/firestore';
import { Loader2, CalendarPlus } from 'lucide-react';
import { errorEmitter } from '../../../lib/firebase/error-emitter';
import { FirestorePermissionError } from '../../../lib/firebase/errors';

interface User {
  docId: string;
  email: string;
  subscriptionEndDate?: Timestamp;
}

interface ExtendSubscriptionDialogProps {
  children: React.ReactNode;
  user: User;
  firestoreDb: Firestore;
}

export default function ExtendSubscriptionDialog({
  children,
  user,
  firestoreDb,
}: ExtendSubscriptionDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentEndDate = user.subscriptionEndDate?.toDate();
  const newEndDate = new Date();
  
  if (currentEndDate && currentEndDate > new Date()) {
    newEndDate.setTime(currentEndDate.getTime());
  }
  newEndDate.setFullYear(newEndDate.getFullYear() + 1);


  const handleExtend = async () => {
    setLoading(true);
    const userRef = doc(firestoreDb, 'users', user.docId);
    
    const dataToUpdate = {
      subscriptionEndDate: Timestamp.fromDate(newEndDate),
      // Optionally, update subscription type and role if needed
      // subscription: 'Pro', 
      // role: 'Subscribed',
    };

    updateDoc(userRef, dataToUpdate)
      .then(() => {
        toast({
          title: 'Suscripción extendida',
          description: `La suscripción de ${user.email} ha sido extendida por un año.`,
        });
        setOpen(false);
      })
      .catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extender Suscripción de: {user.email}</DialogTitle>
          <DialogDescription>
            Confirma para extender la suscripción de este usuario por un año más.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
            <p className="text-sm">
                <span className="font-semibold">Vencimiento actual:</span> {currentEndDate ? currentEndDate.toLocaleDateString('es-ES') : 'N/A'}
            </p>
             <p className="text-sm">
                <span className="font-semibold">Nuevo vencimiento:</span> {newEndDate.toLocaleDateString('es-ES')}
            </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleExtend} disabled={loading}>
            {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <CalendarPlus className="mr-2 h-4 w-4" />
            )}
            Extender 1 año
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
