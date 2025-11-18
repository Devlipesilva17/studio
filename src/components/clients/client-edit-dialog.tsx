// src/components/clients/client-edit-dialog.tsx
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
import type { Client } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  phone: z.string().optional(),
  address: z.string().optional(),
  neighborhood: z.string().min(2, { message: 'A região deve ter pelo menos 2 caracteres.' }),
  startDate: z.string().optional(),
});

type ClientEditDialogProps = {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientUpdate: (client: Client) => void;
};

export function ClientEditDialog({
  client,
  open,
  onOpenChange,
  onClientUpdate,
}: ClientEditDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const [addressValue, setAddressValue] = React.useState('');


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      neighborhood: '',
      startDate: new Date().toISOString().split('T')[0],
    },
  });
  
  React.useEffect(() => {
    if (client) {
        form.reset({
            name: client.name,
            phone: client.phone || '',
            address: client.address || '',
            neighborhood: client.neighborhood || '',
            startDate: client.startDate ? new Date(client.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        });
        setAddressValue(client.address || '');
    } else {
        form.reset({
            name: '',
            phone: '',
            address: '',
            neighborhood: '',
            startDate: new Date().toISOString().split('T')[0],
        });
        setAddressValue('');
    }
  }, [client, form, open]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!auth?.currentUser || !firestore) {
        toast({
            variant: "destructive",
            title: "Erro de Autenticação",
            description: "Você precisa estar logado para salvar um cliente.",
        });
        return;
    }
    setIsSaving(true);
    
    try {
        const clientData = {
            ...values,
            avatarUrl: client?.avatarUrl || `https://picsum.photos/seed/${values.name}/100/100`,
            startDate: values.startDate ? new Date(values.startDate).toISOString() : new Date().toISOString(),
            updatedAt: serverTimestamp(),
        };

        if (client?.id) {
            // Update existing client
            const clientRef = doc(firestore, `users/${auth.currentUser.uid}/clients`, client.id);
            setDoc(clientRef, {
                ...clientData,
                createdAt: client.createdAt, // preserve original creation date
            }, { merge: true });
            toast({
                title: 'Cliente Atualizado!',
                description: `As informações de ${values.name} foram salvas.`,
            });
        } else {
            // Create new client
            const collectionRef = collection(firestore, `users/${auth.currentUser.uid}/clients`);
            addDoc(collectionRef, {
                ...clientData,
                createdAt: serverTimestamp(),
            });
            toast({
                title: 'Cliente Adicionado!',
                description: `${values.name} foi adicionado à sua lista.`,
            });
        }
        
        onOpenChange(false);
    } catch (error) {
        console.error("Error saving client:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Salvar",
            description: "Não foi possível salvar as informações do cliente. Tente novamente.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('address', e.target.value);
    setAddressValue(e.target.value);
  }

  const encodedAddress = encodeURIComponent(addressValue);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Cliente' : 'Adicionar Cliente'}</DialogTitle>
          <DialogDescription>
            {client ? 'Faça alterações nos dados do cliente aqui.' : 'Preencha os dados do novo cliente.'}
             Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] w-full">
            <div className='p-4'>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Região</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                            <Input {...field} onChange={handleAddressChange} />
                        </FormControl>
                         {addressValue && (
                           <Link href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 pt-1">
                                <MapPin className="h-3 w-3" />
                                Abrir no Google Maps
                           </Link>
                        )}
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} />
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
                            Salvar
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
