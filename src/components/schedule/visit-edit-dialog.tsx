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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Client, Pool, Visit, Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Clock, Loader2, Check } from 'lucide-react';
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
import { Input } from '../ui/input';
import { syncVisitToGoogleCalendar } from '@/ai/flows/google-calendar-sync';
import { Label } from '../ui/label';


const formSchema = z.object({
  clientId: z.string().min(1, { message: 'Selecione um cliente.' }),
  poolId: z.string().min(1, { message: 'Selecione uma piscina.' }),
  scheduledDate: z.date({ required_error: 'A data da visita é obrigatória.' }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora inválido (HH:mm).' }),
  notes: z.string().optional(),
  productsUsed: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1, "A quantidade deve ser pelo menos 1."),
  })).optional(),
});

type VisitFormValues = z.infer<typeof formSchema>;


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
  const [isClientPopoverOpen, setIsClientPopoverOpen] = React.useState(false);

  const [selectedClientId, setSelectedClientId] = React.useState<string | undefined>(visit?.clientId);

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: '',
      poolId: '',
      scheduledDate: new Date(),
      time: '09:00',
      notes: '',
      productsUsed: [],
    },
  });
  
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'));
  }, [firestore]);
  const { data: productList, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

  const poolsQuery = useMemoFirebase(() => {
    if (!auth?.currentUser || !firestore || !selectedClientId) return null;
    return query(collection(firestore, `users/${auth.currentUser.uid}/clients/${selectedClientId}/pools`));
  }, [firestore, auth?.currentUser, selectedClientId]);

  const { data: pools, isLoading: arePoolsLoading } = useCollection<Pool>(poolsQuery);


  React.useEffect(() => {
    if (open) {
      if (visit) {
        form.reset({
          clientId: visit.clientId,
          poolId: visit.poolId,
          scheduledDate: new Date(visit.scheduledDate),
          time: visit.time,
          notes: visit.notes || '',
          productsUsed: visit.productsUsed || [],
        });
        setSelectedClientId(visit.clientId);
      } else {
        form.reset({
          clientId: '',
          poolId: '',
          scheduledDate: new Date(),
          time: '09:00',
          notes: '',
          productsUsed: [],
        });
        setSelectedClientId(undefined);
      }
    }
  }, [visit, form, open]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    form.setValue('clientId', clientId);
    form.setValue('poolId', ''); // Reset pool selection
    setIsClientPopoverOpen(false);
  }

  const handleProductQuantityChange = (productId: string, quantity: number) => {
    const currentProducts = form.getValues('productsUsed') || [];
    const existingProductIndex = currentProducts.findIndex(p => p.productId === productId);

    if (quantity > 0) {
      if (existingProductIndex > -1) {
        // Update quantity
        currentProducts[existingProductIndex].quantity = quantity;
        form.setValue('productsUsed', [...currentProducts]);
      } else {
        // Add new product
        form.setValue('productsUsed', [...currentProducts, { productId, quantity }]);
      }
    } else {
      // Remove product if quantity is 0 or less
      if (existingProductIndex > -1) {
        form.setValue('productsUsed', currentProducts.filter(p => p.productId !== productId));
      }
    }
  };

  const onSubmit = async (values: VisitFormValues) => {
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
      const { clientId, poolId, scheduledDate, time, notes, productsUsed } = values;
      const clientName = clients.find(c => c.id === clientId)?.name || 'Cliente desconhecido';

      const visitData = {
        userId: auth.currentUser.uid, // Add userId for collectionGroup query
        clientId,
        poolId,
        clientName,
        scheduledDate: scheduledDate.toISOString(),
        time,
        notes: notes || '',
        productsUsed: productsUsed || [],
        status: 'pending' as const,
        updatedAt: serverTimestamp(),
      };

      const collectionRef = collection(firestore, `users/${auth.currentUser.uid}/clients/${clientId}/schedules`);

      let visitId: string;

      if (visit?.id) {
        // Update existing visit
        visitId = visit.id;
        const visitRef = doc(collectionRef, visitId);
        await setDoc(visitRef, visitData, { merge: true });
        toast({
          title: 'Agendamento Atualizado!',
          description: `A visita para ${clientName} foi atualizada.`,
        });
      } else {
        // Create new visit
        const newDocRef = await addDoc(collectionRef, {
          ...visitData,
          createdAt: serverTimestamp(),
        });
        visitId = newDocRef.id;
        toast({
          title: 'Visita Agendada!',
          description: `Nova visita para ${clientName} em ${format(scheduledDate, 'PPP', { locale: ptBR })}.`,
        });
      }

      // After saving to Firestore, sync with Google Calendar
      await syncVisitToGoogleCalendar({
          userId: auth.currentUser.uid,
          visitId: visitId,
          summary: `Limpeza de Piscina: ${clientName}`,
          description: `Visita agendada para o cliente ${clientName}. Observações: ${notes || 'N/A'}`,
          startTime: `${scheduledDate.toISOString().split('T')[0]}T${time}:00`,
          endTime: `${scheduledDate.toISOString().split('T')[0]}T${(parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0')}:${time.split(':')[1]}:00`, // Assume 1 hour duration
      });

      toast({
          title: 'Sincronizado!',
          description: 'A visita foi sincronizada com seu Google Agenda.',
      });

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

  const groupedClients = React.useMemo(() => {
    if (!clients) return {};
    return clients
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .reduce((acc, client) => {
        const firstLetter = client.name[0].toUpperCase();
        if (!acc[firstLetter]) {
          acc[firstLetter] = [];
        }
        acc[firstLetter].push(client);
        return acc;
      }, {} as Record<string, Client[]>);
  }, [clients]);

  const selectedClientName = clients.find(c => c.id === selectedClientId)?.name || "Selecione um cliente";

  const watchedProductsUsed = form.watch('productsUsed') || [];


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
                        <Popover open={isClientPopoverOpen} onOpenChange={setIsClientPopoverOpen}>
                            <PopoverTrigger asChild>
                                 <FormControl>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {selectedClientName}
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                               <ScrollArea className="h-72">
                                 {Object.entries(groupedClients).map(([letter, clientGroup]) => (
                                    <div key={letter} className="relative">
                                        <div className="sticky top-0 z-10 bg-muted px-3 py-1 text-sm font-semibold">
                                            {letter}
                                        </div>
                                        <div className="p-1">
                                         {clientGroup.map(client => (
                                            <Button
                                                variant="ghost"
                                                key={client.id}
                                                onClick={() => handleClientChange(client.id)}
                                                className="w-full justify-start font-normal h-auto py-2"
                                            >
                                                <div className="flex justify-between w-full items-center">
                                                    <div className="flex flex-col text-left">
                                                        <span>{client.name}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="text-xs text-muted-foreground mr-2">{client.neighborhood}</span>
                                                         {field.value === client.id && <Check className="h-4 w-4 text-primary" />}
                                                    </div>
                                                </div>
                                            </Button>
                                        ))}
                                        </div>
                                    </div>
                                ))}
                               </ScrollArea>
                            </PopoverContent>
                        </Popover>
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
                <div className="flex flex-col sm:flex-row gap-4">
                    <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                        <FormItem className="flex-1 flex flex-col">
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
                        <FormItem className="flex-1 flex flex-col">
                        <FormLabel>Hora da Visita</FormLabel>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                                <Input type="time" {...field} className="pl-9"/>
                            </FormControl>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

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
                
                <div className="border-t pt-4">
                  <FormLabel>Produtos a serem Utilizados</FormLabel>
                   <div className="space-y-3 mt-2">
                        {areProductsLoading ? <p>Carregando produtos...</p> : productList?.map(product => (
                            <div key={product.id} className="flex items-center justify-between">
                                <Label htmlFor={`prod-dialog-${product.id}`} className="flex-1">
                                    {product.name} <span className="text-xs text-muted-foreground">({product.stock} em estoque)</span>
                                </Label>
                                <Input
                                    id={`prod-dialog-${product.id}`}
                                    type="number"
                                    min="0"
                                    max={product.stock}
                                    value={watchedProductsUsed.find(p => p.productId === product.id)?.quantity || ''}
                                    onChange={e => handleProductQuantityChange(product.id, e.target.valueAsNumber)}
                                    className="w-20 h-8"
                                    placeholder="0"
                                />
                            </div>
                        ))}
                    </div>
                </div>


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
