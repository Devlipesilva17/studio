'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Client, Pool, Visit } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, addDoc, collection, query } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '../ui/calendar';
import { Textarea } from '../ui/textarea';


const formSchema = z.object({
  clientId: z.string().min(1, { message: 'Selecione um cliente.' }),
  poolId: z.string().min(1, { message: 'Selecione uma piscina.' }),
  scheduledDate: z.date({ required_error: 'A data da visita é obrigatória.' }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora inválido (HH:mm).' }),
  notes: z.string().optional(),
});

type VisitEditDialogProps = {
  visit?: Visit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
};

export function VisitEditDialog({
  visit,
  open,
  onOpenChange,
  clients,
}: VisitEditDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  
  const [selectedClientId, setSelectedClientId] = React.useState<string | undefined>(visit?.clientId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: visit?.clientId || '',
      poolId: visit?.poolId || '',
      scheduledDate: visit ? new Date(visit.scheduledDate) : new Date(),
      time: visit?.time || '09:00',
      notes: visit?.notes || '',
    },
  });

  const poolsQuery = useMemoFirebase(() => {
    if (!auth?.currentUser || !firestore || !selectedClientId) return null;
    return query(collection(firestore, `users/${auth.currentUser.uid}/clients/${selectedClientId}/pools`));
  }, [firestore, auth?.currentUser, selectedClientId]);

  const { data: pools, isLoading: arePoolsLoading } = useCollection<Pool>(poolsQuery);


  React.useEffect(() => {
    if (visit) {
      form.reset({
        clientId: visit.clientId,
        poolId: visit.poolId,
        scheduledDate: new Date(visit.scheduledDate),
        time: visit.time,
        notes: visit.notes || '',
      });
      setSelectedClientId(visit.clientId);
    } else {
      form.reset({
        clientId: '',
        poolId: '',
        scheduledDate: new Date(),
        time: '09:00',
        notes: '',
      });
      setSelectedClientId(undefined);
    }
  }, [visit, form, open]);
  
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    form.setValue('clientId', clientId);
    form.setValue('poolId', ''); // Reset pool selection
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!auth?.currentUser || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: 'Você precisa estar logado para agendar uma visita.',
        action: <Button onClick={() => router.push('/')}>Fazer Login</Button>,
      });
      return;
    }
    setIsSaving(true);
    
    try {
      const { clientId, poolId, scheduledDate, time, notes } = values;
      const clientName = clients.find(c => c.id === clientId)?.name || 'Cliente desconhecido';

      const visitData = {
        clientId,
        poolId,
        clientName,
        scheduledDate: scheduledDate.toISOString(),
        time,
        notes: notes || '',
        status: 'pending' as const,
        productsUsed: [],
        updatedAt: serverTimestamp(),
      };

      const collectionRef = collection(firestore, `users/${auth.currentUser.uid}/clients/${clientId}/schedules`);
      
      if (visit?.id) {
        // Update existing visit
        const visitRef = doc(collectionRef, visit.id);
        await setDoc(visitRef, visitData, { merge: true });
        toast({
          title: 'Agendamento Atualizado!',
          description: `A visita para ${clientName} foi atualizada.`,
        });
      } else {
        // Create new visit
        await addDoc(collectionRef, {
          ...visitData,
          createdAt: serverTimestamp(),
        });
        toast({
          title: 'Visita Agendada!',
          description: `Nova visita para ${clientName} em ${format(scheduledDate, 'PPP', { locale: ptBR })}.`,
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving visit:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar o agendamento. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{visit ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar ou editar um agendamento.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] w-full">
          <div className='p-4'>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select onValueChange={handleClientChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="poolId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Piscina</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClientId || arePoolsLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={arePoolsLoading ? "Carregando..." : "Selecione uma piscina"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pools?.map(pool => (
                            <SelectItem key={pool.id} value={pool.id}>{pool.name || `Piscina de ${pool.volume}L`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data da Visita</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ptBR })
                              ) : (
                                <span>Escolha uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora da Visita</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Adicione observações sobre a visita..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="pt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {visit ? 'Salvar Alterações' : 'Agendar Visita'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
