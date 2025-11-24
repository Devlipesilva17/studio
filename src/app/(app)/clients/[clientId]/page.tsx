'use client';

import * as React from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import type { Client, Pool } from '@/lib/types';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Save, Loader2, RefreshCw, MapPin, CalendarIcon, Droplets, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


// Custom Icons
function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413.001 6.557-5.335 11.894-11.892 11.894-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.89-5.464 0-9.888 4.424-9.888 9.884 0 2.021.59 3.996 1.698 5.665l.33 1.02-1.218 4.459 4.549-1.186z" />
    </svg>
  );
}

const clientFormSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  phone: z.string().optional(),
  address: z.string().optional(),
  startDate: z.date().optional(),
  notes: z.string().optional(),
});

const poolFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nome da piscina é obrigatório."),
  type: z.enum(['quadrilateral', 'circular', 'oval']).default('quadrilateral'),
  length: z.coerce.number().positive({ message: "Deve ser positivo" }).optional(),
  width: z.coerce.number().positive({ message: "Deve ser positivo" }).optional(),
  averageDepth: z.coerce.number().positive({ message: "Deve ser positivo" }).optional(),
  volume: z.coerce.number().positive({ message: "Deve ser positivo" }).optional(),
  volumeMode: z.enum(['auto', 'manual']).default('auto'),
  ph: z.coerce.number().optional(),
  chlorine: z.coerce.number().optional(),
  alkalinity: z.coerce.number().optional(),
  calciumHardness: z.coerce.number().optional(),
  material: z.enum(['fiber', 'masonry', 'vinyl']).default('fiber'),
  hasStains: z.boolean().default(false),
  hasScale: z.boolean().default(false),
  waterQuality: z.enum(['green', 'cloudy', 'crystal-clear']).default('crystal-clear'),
  filterType: z.enum(['sand', 'cartridge', 'polyester']).default('sand'),
  lastFilterChange: z.date().optional(),
  filterCapacity: z.coerce.number().optional(),
});

const fullClientProfileSchema = z.object({
    client: clientFormSchema,
    pools: z.array(poolFormSchema),
});


export default function ClientDetailsPage({ params }: { params: { clientId: string } }) {
  const router = useRouter();
  const { clientId } = params;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSavingClient, setIsSavingClient] = React.useState(false);
  const [isSavingPool, setIsSavingPool] = React.useState<string | null>(null); // pool id or 'new'
  const [activeTab, setActiveTab] = React.useState('pool-0');


  const clientRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}/clients`, clientId);
  }, [firestore, user, clientId]);

  const poolsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/clients/${clientId}/pools`));
  }, [firestore, user, clientId]);

  const { data: client, isLoading: isClientLoading } = useDoc<Client>(clientRef);
  const { data: pools, isLoading: arePoolsLoading } = useCollection<Pool>(poolsQuery);
  
  const form = useForm<z.infer<typeof fullClientProfileSchema>>({
    resolver: zodResolver(fullClientProfileSchema),
    defaultValues: {
      client: { name: '', phone: '', address: '', notes: '' },
      pools: []
    }
  });
  
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "pools",
  });

   const formatPhoneNumber = (value: string) => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };
  
  React.useEffect(() => {
    if (client || pools) {
      const formattedPhone = client?.phone ? formatPhoneNumber(client.phone) : '';
      form.reset({
        client: {
          name: client?.name || '',
          phone: formattedPhone,
          address: client?.address || '',
          startDate: client?.startDate ? new Date(client.startDate) : undefined,
          notes: client?.notes || '',
        },
        pools: pools?.map(p => ({
          ...p,
          lastFilterChange: p.lastFilterChange ? new Date(p.lastFilterChange) : undefined,
           volume: p.volume ? Math.round(p.volume / 10) * 10 : undefined,
        })) || []
      });
    }
  }, [client, pools, form]);


  const handleCalculateVolume = React.useCallback((poolIndex: number) => {
    const poolData = form.getValues(`pools.${poolIndex}`);

    if (poolData.volumeMode === 'manual') return;

    let volumeM3 = 0;
    const CIRCULAR_FACTOR = 0.785;
    const OVAL_FACTOR = 0.89;
    const { type, length = 0, width = 0, averageDepth = 0 } = poolData;

    if (averageDepth > 0) {
        switch (type) {
            case 'quadrilateral':
                if (length > 0 && width > 0) {
                    volumeM3 = length * width * averageDepth;
                }
                break;
            case 'circular':
                 if (length > 0) { // diameter
                    volumeM3 = length * length * averageDepth * CIRCULAR_FACTOR;
                }
                break;
            case 'oval':
                if (length > 0 && width > 0) {
                    volumeM3 = length * width * averageDepth * OVAL_FACTOR;
                }
                break;
        }
    }
    
    const finalVolumeLiters = volumeM3 * 1000;
    const roundedVolume = Math.round(finalVolumeLiters / 10) * 10;
    
    form.setValue(`pools.${poolIndex}.volume`, roundedVolume > 0 ? roundedVolume : undefined, { shouldValidate: true });
  }, [form]);


  const onClientSubmit = async (data: z.infer<typeof clientFormSchema>) => {
      if (!clientRef || !user || !firestore) {
          toast({ variant: 'destructive', title: 'Erro', description: 'Usuário ou cliente não carregado.' });
          return;
      }
      setIsSavingClient(true);
      try {
          const clientData = {
              ...data,
              phone: data.phone?.replace(/\D/g, '') || '',
              startDate: data.startDate?.toISOString(),
          }
          await updateDoc(clientRef, clientData as Partial<Client>);
          toast({ title: "Sucesso!", description: "Dados do cliente atualizados." });
      } catch (error) {
          console.error("Error updating document: ", error);
          toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível atualizar os dados do cliente.' });
      } finally {
          setIsSavingClient(false);
      }
  };
  
  const onPoolSubmit = async (poolIndex: number) => {
    if (!user || !firestore) return;
    
    const poolData = form.getValues(`pools.${poolIndex}`);
    const poolId = poolData.id;
    setIsSavingPool(poolId || 'new');
    
    try {
        const dataToSave = {
            ...poolData,
            clientId: clientId,
            lastFilterChange: poolData.lastFilterChange?.toISOString(),
            updatedAt: serverTimestamp(),
        };
        delete dataToSave.id;

        if (poolId) {
            // Update existing pool
            const poolRef = doc(firestore, `users/${user.uid}/clients/${clientId}/pools`, poolId);
            await updateDoc(poolRef, dataToSave);
            toast({ title: "Piscina Atualizada!", description: `Os dados de "${poolData.name}" foram salvos.` });
        } else {
            // Create new pool
            const poolsCollectionRef = collection(firestore, `users/${user.uid}/clients/${clientId}/pools`);
            const newPoolRef = await addDoc(poolsCollectionRef, {
                ...dataToSave,
                createdAt: serverTimestamp(),
            });
            // Update the form state with the new ID
            update(poolIndex, { ...poolData, id: newPoolRef.id });
             if (clientRef) {
                await updateDoc(clientRef, {
                    poolIds: [...(client?.poolIds || []), newPoolRef.id]
                });
            }
            setActiveTab(`pool-${poolIndex}`);
            toast({ title: "Piscina Adicionada!", description: `"${poolData.name}" foi adicionada com sucesso.` });
        }

    } catch (error) {
        console.error("Error saving pool: ", error);
        toast({ variant: 'destructive', title: 'Erro ao Salvar Piscina', description: 'Não foi possível salvar os dados da piscina.' });
    } finally {
        setIsSavingPool(null);
    }
  };

  const handleAddNewPool = () => {
    append({
        name: `Piscina ${fields.length + 1}`,
        type: 'quadrilateral',
        volumeMode: 'auto',
        ph: 7.2,
        chlorine: 1.0,
        alkalinity: 80,
        calciumHardness: 200,
        material: 'fiber',
        hasStains: false,
        hasScale: false,
        waterQuality: 'crystal-clear',
        filterType: 'sand',
    });
    // Switch to the new tab
    setTimeout(() => setActiveTab(`new-pool-${fields.length}`), 0);
  };
  
  const handleDeletePool = async (poolIndex: number, poolId?: string) => {
    if (poolId && user && firestore) {
        const poolRef = doc(firestore, `users/${user.uid}/clients/${clientId}/pools`, poolId);
        try {
            await deleteDoc(poolRef);
            toast({ title: "Piscina Removida", description: "A piscina foi removida com sucesso." });
            // The real-time listener will update the state
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível remover a piscina." });
        }
    }
    remove(poolIndex);
    setActiveTab('pool-0');
  };

  const isLoading = isClientLoading || arePoolsLoading;
  
  const getChemicalStatusColor = (param: string, value?: number) => {
    if (value === undefined || value === null) return 'text-foreground';
    switch(param) {
      case 'ph':
        if (value >= 7.2 && value <= 7.6) return 'text-green-600';
        if (value >= 7.0 && value <= 7.8) return 'text-yellow-600';
        return 'text-red-600';
      case 'chlorine':
        if (value >= 1.0 && value <= 3.0) return 'text-green-600';
        if (value >= 0.5 && value <= 4.0) return 'text-yellow-600';
        return 'text-red-600';
      case 'alkalinity':
        if (value >= 80 && value <= 120) return 'text-green-600';
        if (value >= 60 && value <= 150) return 'text-yellow-600';
        return 'text-red-600';
      case 'calciumHardness':
        if (value >= 200 && value <= 400) return 'text-green-600';
        if (value >= 150 && value <= 500) return 'text-yellow-600';
        return 'text-red-600';
      default:
        return 'text-foreground';
    }
  };
  
    const watchedPhone = form.watch('client.phone');
    const watchedAddress = form.watch('client.address');
    
    const cleanPhoneNumber = React.useMemo(() => {
      return watchedPhone?.replace(/\D/g, '') || '';
    }, [watchedPhone]);

    const encodedAddress = encodeURIComponent(watchedAddress || '');
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    const whatsappUrl = `https://wa.me/55${cleanPhoneNumber}`;
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        form.setValue('client.phone', formatPhoneNumber(e.target.value));
    };
    
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <CardTitle>Cliente não encontrado</CardTitle>
        <CardDescription className="mt-2"> O cliente que você está procurando não existe ou foi removido. </CardDescription>
        <Button asChild className="mt-4">
          <Link href="/clients"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Clientes</Link>
        </Button>
      </div>
    );
  }
  
  const chemicalParams = [
      { name: 'pH', formKey: 'ph', paramKey: 'ph' },
      { name: 'Cloro Livre', formKey: 'chlorine', paramKey: 'chlorine' },
      { name: 'Alcalinidade', formKey: 'alkalinity', paramKey: 'alkalinity' },
      { name: 'Dureza Cálcica', formKey: 'calciumHardness', paramKey: 'calciumHardness' },
  ];

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Client Info Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className='flex items-center gap-4'>
                <Button variant="outline" size="icon" asChild>
                    <Link href="/clients"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <Avatar className="h-16 w-16">
                  <AvatarImage src={client.avatarUrl} alt={client.name} />
                  <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-3xl font-headline">{client.name}</CardTitle>
                  <CardDescription>Cliente desde {client.startDate ? format(new Date(client.startDate), "dd/MM/yyyy") : 'Data não definida'}</CardDescription>
                </div>
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isSavingClient}><RefreshCw className="mr-2 h-4 w-4" />Resetar</Button>
            </div>
        </div>

        {/* Client Data Card */}
        <Card>
          <form onSubmit={form.handleSubmit(data => onClientSubmit(data.client))}>
            <CardHeader>
                <div className='flex justify-between items-center'>
                    <CardTitle className="text-center">Dados Pessoais</CardTitle>
                    <Button type="submit" disabled={isSavingClient} size="sm">{isSavingClient ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar</Button>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormField control={form.control} name="client.name" render={({ field }) => (<FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="client.phone" render={({ field }) => (
                  <FormItem><FormLabel>Telefone</FormLabel>
                    <div className="relative">
                      <FormControl><Input {...field} onChange={handlePhoneChange} placeholder="(XX) XXXXX-XXXX" className="pr-10" /></FormControl>
                      {cleanPhoneNumber && (<Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-y-0 right-0 flex items-center pr-3"><WhatsAppIcon className="h-5 w-5 text-gray-400 hover:text-[#25D366] transition-colors" /></Link>)}
                    </div><FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="client.address" render={({ field }) => (
                <FormItem><FormLabel>Endereço</FormLabel>
                  <div className="relative">
                    <FormControl><Input {...field} className="pr-10" /></FormControl>
                    {watchedAddress && (<Link href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-y-0 right-0 flex items-center pr-3"><MapPin className="h-5 w-5 text-gray-400 hover:text-[#4285F4] transition-colors" /></Link>)}
                  </div><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="client.startDate" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? (format(field.value, "PPP", { locale: ptBR })) : (<span>Escolha uma data</span>)}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                      </PopoverContent>
                    </Popover><FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="client.notes" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Observações</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
            </CardContent>
          </form>
        </Card>

        {/* Pools Section */}
        <div className='space-y-4'>
            <h2 className="text-2xl font-headline">Piscinas</h2>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-flow-col auto-cols-auto">
                    {fields.map((field, index) => (
                        <TabsTrigger key={field.id} value={`pool-${index}`}>{form.watch(`pools.${index}.name`)}</TabsTrigger>
                    ))}
                     <TabsTrigger value="new" onClick={handleAddNewPool} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span>Adicionar Piscina</span>
                    </TabsTrigger>
                </TabsList>
                
                {fields.map((field, index) => {
                    const watchedPoolData = form.watch(`pools.${index}`);
                    const isNewPool = !watchedPoolData.id;
                    const tabValue = isNewPool ? `new-pool-${index}` : `pool-${index}`;
                    
                    return (
                        <TabsContent key={field.id} value={tabValue}>
                            <form onSubmit={form.handleSubmit(() => onPoolSubmit(index))}>
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <FormField control={form.control} name={`pools.${index}.name`} render={({ field: nameField }) => (
                                                <FormItem>
                                                    <FormControl><Input {...nameField} className="text-2xl font-bold border-none shadow-none -ml-2 p-1 h-auto focus-visible:ring-1" /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <div className="flex items-center gap-2">
                                                <Button type="submit" size="sm" disabled={isSavingPool === (watchedPoolData.id || 'new')}>
                                                    {isSavingPool === (watchedPoolData.id || 'new') ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                    Salvar Piscina
                                                </Button>
                                                {!isNewPool && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button type="button" variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Excluir</Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente a piscina
                                                                    "{watchedPoolData.name}" e todos os seus dados associados.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeletePool(index, watchedPoolData.id)}>Excluir</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className='space-y-8'>
                                        {/* Dimensions */}
                                        <div className="space-y-6 p-6 border rounded-lg">
                                            <CardTitle>Metragens e Dimensões</CardTitle>
                                             <FormField
                                                control={form.control}
                                                name={`pools.${index}.type`}
                                                render={({ field: typeField }) => (
                                                    <FormItem className="space-y-3">
                                                    <FormLabel>Tipo da Piscina</FormLabel>
                                                    <FormControl>
                                                        <RadioGroup
                                                            onValueChange={(value) => {
                                                                typeField.onChange(value);
                                                                handleCalculateVolume(index);
                                                            }}
                                                            value={typeField.value}
                                                            className="grid grid-cols-3 gap-4"
                                                        >
                                                        {(['quadrilateral', 'circular', 'oval'] as const).map(type => (
                                                            <FormItem key={type} className="flex-1">
                                                                <FormControl>
                                                                    <RadioGroupItem value={type} id={`${field.id}-${type}`} className="sr-only" />
                                                                </FormControl>
                                                                <FormLabel
                                                                    htmlFor={`${field.id}-${type}`}
                                                                    className={cn( 'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 cursor-pointer transition-all duration-300', 'hover:shadow-lg hover:-translate-y-1', typeField.value === type ? 'border-primary shadow-lg' : '' )}
                                                                >
                                                                    <div className="mb-2 h-14 w-20 flex items-center justify-center">
                                                                        {type === 'quadrilateral' && <div className="w-16 h-12 bg-accent/50 border-2 border-accent rounded-sm"></div>}
                                                                        {type === 'circular' && <div className="w-14 h-14 bg-accent/50 border-2 border-accent rounded-full"></div>}
                                                                        {type === 'oval' && <div className="w-20 h-12 bg-accent/50 border-2 border-accent rounded-full"></div>}
                                                                    </div>
                                                                    <span className="text-sm font-medium capitalize">{type === 'quadrilateral' ? 'Retangular' : type}</span>
                                                                </FormLabel>
                                                            </FormItem>
                                                        ))}
                                                        </RadioGroup>
                                                    </FormControl>
                                                    <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                                                {watchedPoolData.type === 'quadrilateral' && (
                                                    <>
                                                        <FormField control={form.control} name={`pools.${index}.length`} render={({ field: f }) => (<FormItem><FormLabel>Comprimento</FormLabel><FormControl><Input type="number" step="0.1" {...f} onChange={(e) => { f.onChange(e); handleCalculateVolume(index); }}/></FormControl><FormMessage /></FormItem>)} />
                                                        <FormField control={form.control} name={`pools.${index}.width`} render={({ field: f }) => (<FormItem><FormLabel>Largura</FormLabel><FormControl><Input type="number" step="0.1" {...f} onChange={(e) => { f.onChange(e); handleCalculateVolume(index); }}/></FormControl><FormMessage /></FormItem>)} />
                                                    </>
                                                )}
                                                {watchedPoolData.type === 'circular' &&
                                                    <FormField control={form.control} name={`pools.${index}.length`} render={({ field: f }) => (<FormItem className="lg:col-span-2"><FormLabel>Diâmetro</FormLabel><FormControl><Input type="number" step="0.1" {...f} onChange={(e) => { f.onChange(e); handleCalculateVolume(index); }}/></FormControl><FormMessage /></FormItem>)} />
                                                }
                                                {watchedPoolData.type === 'oval' && (
                                                    <>
                                                        <FormField control={form.control} name={`pools.${index}.length`} render={({ field: f }) => (<FormItem><FormLabel>Comprimento</FormLabel><FormControl><Input type="number" step="0.1" {...f} onChange={(e) => { f.onChange(e); handleCalculateVolume(index); }}/></FormControl><FormMessage /></FormItem>)} />
                                                        <FormField control={form.control} name={`pools.${index}.width`} render={({ field: f }) => (<FormItem><FormLabel>Largura</FormLabel><FormControl><Input type="number" step="0.1" {...f} onChange={(e) => { f.onChange(e); handleCalculateVolume(index); }}/></FormControl><FormMessage /></FormItem>)} />
                                                    </>
                                                )}
                                                <FormField control={form.control} name={`pools.${index}.averageDepth`} render={({ field: f }) => (<FormItem><FormLabel>Profundidade Média</FormLabel><FormControl><Input type="number" step="0.1" {...f} onChange={(e) => { f.onChange(e); handleCalculateVolume(index); }}/></FormControl><FormMessage /></FormItem>)} />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                                <FormField control={form.control} name={`pools.${index}.volume`} render={({ field: f }) => (
                                                    <FormItem>
                                                    <FormLabel>Litragem</FormLabel>
                                                    <FormControl>
                                                        <div className='relative'>
                                                            <Droplets className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                                                            <Input type="text" value={f.value ? new Intl.NumberFormat('pt-BR').format(f.value) : ''} readOnly={watchedPoolData.volumeMode === 'auto'} onChange={(e) => { const val = parseInt(e.target.value.replace(/\D/g, '')); f.onChange(isNaN(val) ? undefined : val); }} className={cn("font-bold bg-muted/50 pl-9", {'max-w-40': watchedPoolData.volumeMode === 'auto'})} />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription>Volume em litros (L)</FormDescription>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name={`pools.${index}.volumeMode`} render={({ field: f }) => (
                                                    <FormItem>
                                                        <FormLabel>Modo</FormLabel>
                                                        <Select onValueChange={(v) => {f.onChange(v); handleCalculateVolume(index);}} value={f.value}>
                                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="auto">Automático</SelectItem>
                                                                <SelectItem value="manual">Manual</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormDescription>Modo de cálculo</FormDescription>
                                                    </FormItem>
                                                )} />
                                            </div>
                                            <p className="text-xs text-muted-foreground pt-4">Obs: Para o cálculo correto da litragem, certifique-se de informar todas as medidas em metros.</p>
                                        </div>

                                        {/* Chemical Data */}
                                         <div className="space-y-6 p-6 border rounded-lg">
                                            <CardTitle>Dados Químicos</CardTitle>
                                            <Table>
                                                <TableHeader><TableRow><TableHead>Parâmetro</TableHead><TableHead className="w-[200px]">Indicador Atual</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {chemicalParams.map(param => (
                                                        <TableRow key={param.name}>
                                                            <TableCell className="font-medium">{param.name}</TableCell>
                                                            <TableCell>
                                                                <FormField control={form.control} name={`pools.${index}.${param.formKey}` as any} render={({ field: chemField }) => (<FormItem><FormControl><Input type="number" step="0.1" {...chemField} className={cn("font-bold", getChemicalStatusColor(param.paramKey, chemField.value))} /></FormControl><FormMessage /></FormItem>)} />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Pool Properties */}
                                        <div className="space-y-6 p-6 border rounded-lg">
                                            <CardTitle>Propriedades da Piscina</CardTitle>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField control={form.control} name={`pools.${index}.material`} render={({ field: f }) => (<FormItem><FormLabel>Material</FormLabel><Select onValueChange={f.onChange} value={f.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="fiber">Fibra</SelectItem><SelectItem value="masonry">Alvenaria</SelectItem><SelectItem value="vinyl">Vinil</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name={`pools.${index}.waterQuality`} render={({ field: f }) => (<FormItem><FormLabel>Qualidade da Água</FormLabel><Select onValueChange={f.onChange} value={f.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="green">Verde</SelectItem><SelectItem value="cloudy">Turva</SelectItem><SelectItem value="crystal-clear">Cristalina</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField control={form.control} name={`pools.${index}.hasStains`} render={({ field: f }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Possui Manchas?</FormLabel></div><FormControl><Switch checked={f.value} onCheckedChange={f.onChange} /></FormControl></FormItem>)}/>
                                                <FormField control={form.control} name={`pools.${index}.hasScale`} render={({ field: f }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Possui Incrustações?</FormLabel></div><FormControl><Switch checked={f.value} onCheckedChange={f.onChange} /></FormControl></FormItem>)}/>
                                            </div>
                                            <div className="h-px bg-border my-2" />
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                                <FormField control={form.control} name={`pools.${index}.filterType`} render={({ field: f }) => (<FormItem><FormLabel>Tipo do Filtro</FormLabel><Select onValueChange={f.onChange} value={f.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="sand">Areia</SelectItem><SelectItem value="cartridge">Cartucho</SelectItem><SelectItem value="polyester">Poliéster</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                                                {form.watch(`pools.${index}.filterType`) === 'sand' && (
                                                    <>
                                                        <FormField control={form.control} name={`pools.${index}.lastFilterChange`} render={({ field: f }) => (
                                                            <FormItem className="flex flex-col"><FormLabel>Última Troca</FormLabel><Popover><PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button variant={'outline'} className={cn('pl-3 text-left font-normal', !f.value && 'text-muted-foreground')}>
                                                                {f.value ? format(f.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                            </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={f.value} onSelect={f.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                                                        )}/>
                                                        <FormField control={form.control} name={`pools.${index}.filterCapacity`} render={({ field: f }) => (<FormItem><FormLabel>Capacidade do Filtro (kg)</FormLabel><FormControl><Input type="number" {...f} /></FormControl><FormMessage /></FormItem>)}/>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </form>
                        </TabsContent>
                    )
                })}
            </Tabs>
        </div>
      </div>
    </Form>
  );
}