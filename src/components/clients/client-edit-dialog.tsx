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
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { WhatsAppIcon } from '../icons';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  phone: z.string().optional(),
  address: z.string().optional(),
  neighborhood: z.string().min(2, { message: 'O grupo deve ter pelo menos 2 caracteres.' }),
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
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const [addressValue, setAddressValue] = React.useState('');
  const [phoneValue, setPhoneValue] = React.useState('');

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
  
  const formatPhoneNumber = (value: string) => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) {
      return `(${digits}`;
    }
    if (digits.length <= 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  React.useEffect(() => {
    if (client) {
        const formattedPhone = client.phone ? formatPhoneNumber(client.phone) : '';
        form.reset({
            name: client.name,
            phone: formattedPhone,
            address: client.address || '',
            neighborhood: client.neighborhood || '',
            startDate: client.startDate ? new Date(client.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        });
        setAddressValue(client.address || '');
        setPhoneValue(client.phone || '');
    } else {
        form.reset({
            name: '',
            phone: '',
            address: '',
            neighborhood: '',
            startDate: new Date().toISOString().split('T')[0],
        });
        setAddressValue('');
        setPhoneValue('');
    }
  }, [client, form, open]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!auth?.currentUser || !firestore) {
        toast({
            variant: "destructive",
            title: "Erro de Autenticação",
            description: "Você precisa estar logado para salvar um cliente.",
             action: <Button onClick={() => router.push('/')}>Fazer Login</Button>
        });
        return;
    }
    setIsSaving(true);
    
    try {
        const clientData = {
            ...values,
            phone: values.phone?.replace(/\D/g, '') || '',
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
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formatted = formatPhoneNumber(e.target.value);
    form.setValue('phone', formatted);
    setPhoneValue(rawValue);
  }

  const encodedAddress = encodeURIComponent(addressValue);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  
  const whatsappUrl = `https://wa.me/55${phoneValue}`;


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
                        <FormLabel>Grupo</FormLabel>
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
                           <Button variant="outline" size="sm" asChild className="mt-2 hover:bg-[#4285F4] hover:text-white transition-colors">
                             <Link href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                                <MapPin className="mr-2 h-4 w-4" />
                                Abrir no Google Maps
                           </Link>
                           </Button>
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
                            <Input {...field} onChange={handlePhoneChange} placeholder="(XX) XXXXX-XXXX"/>
                        </FormControl>
                         {phoneValue && (
                           <Button variant="outline" size="sm" asChild className="mt-2 hover:bg-[#25D366] hover:text-white transition-colors">
                               <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                    <WhatsAppIcon className="mr-2 h-4 w-4" />
                                    Abrir no WhatsApp
                               </Link>
                           </Button>
                        )}
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
