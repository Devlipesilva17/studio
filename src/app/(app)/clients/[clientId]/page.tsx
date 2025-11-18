
'use client';

import * as React from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
import { ArrowLeft, Edit, Phone, Mail, MapPin, Save, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';


const clientFormSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  phone: z.string().optional(),
  address: z.string().optional(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
});

const poolDimensionsSchema = z.object({
    type: z.enum(['quadrilateral', 'circular', 'oval']).default('quadrilateral'),
    length: z.coerce.number().optional(),
    width: z.coerce.number().optional(),
    averageDepth: z.coerce.number().optional(),
});

const chemicalDataSchema = z.object({
    ph: z.coerce.number().optional(),
    chlorine: z.coerce.number().optional(),
    alkalinity: z.coerce.number().optional(),
    calciumHardness: z.coerce.number().optional(),
});

const poolPropertiesSchema = z.object({
    material: z.enum(['fiber', 'masonry', 'vinyl']).default('fiber'),
    hasStains: z.boolean().default(false),
    hasScale: z.boolean().default(false),
    waterQuality: z.enum(['green', 'cloudy', 'crystal-clear']).default('crystal-clear'),
});

const filterDataSchema = z.object({
    filterType: z.enum(['sand', 'cartridge', 'polyester']).default('sand'),
    lastFilterChange: z.string().optional(),
    nextFilterChange: z.string().optional(),
    filterPressure: z.coerce.number().optional(),
    filterCapacity: z.coerce.number().optional(),
});


export default function ClientDetailsPage({
  params,
}: {
  params: { clientId: string };
}) {
  const { clientId } = params;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  // Data fetching
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
  const pool = pools?.[0]; // For now, we edit the first pool

  // Form setup
  const form = useForm({
    resolver: zodResolver(z.object({
      client: clientFormSchema,
      poolDimensions: poolDimensionsSchema,
      chemicalData: chemicalDataSchema,
      poolProperties: poolPropertiesSchema,
      filterData: filterDataSchema,
    })),
    defaultValues: {
        client: { name: '', phone: '', address: '', startDate: '', notes: '' },
        poolDimensions: { type: 'quadrilateral', length: 0, width: 0, averageDepth: 0 },
        chemicalData: { ph: 0, chlorine: 0, alkalinity: 0, calciumHardness: 0 },
        poolProperties: { material: 'fiber', hasStains: false, hasScale: false, waterQuality: 'crystal-clear' },
        filterData: { filterType: 'sand', lastFilterChange: '', nextFilterChange: '', filterPressure: 0, filterCapacity: 0 }
    }
  });
  
  const resetForms = React.useCallback(() => {
    if (client) {
        form.reset({
          client: {
            name: client.name || '',
            phone: client.phone || '',
            address: client.address || '',
            startDate: client.startDate ? new Date(client.startDate).toISOString().split('T')[0] : '',
            notes: client.notes || '',
          },
          poolDimensions: {
            type: pool?.type || 'quadrilateral',
            length: pool?.length || 0,
            width: pool?.width || 0,
            averageDepth: pool?.averageDepth || 0,
          },
          chemicalData: {
            ph: pool?.ph || 0,
            chlorine: pool?.chlorine || 0,
            alkalinity: pool?.alkalinity || 0,
            calciumHardness: pool?.calciumHardness || 0,
          },
          poolProperties: {
            material: pool?.material || 'fiber',
            hasStains: pool?.hasStains || false,
            hasScale: pool?.hasScale || false,
            waterQuality: pool?.waterQuality || 'crystal-clear',
          },
          filterData: {
            filterType: pool?.filterType || 'sand',
            lastFilterChange: pool?.lastFilterChange ? new Date(pool.lastFilterChange).toISOString().split('T')[0] : '',
            nextFilterChange: pool?.nextFilterChange ? new Date(pool.nextFilterChange).toISOString().split('T')[0] : '',
            filterPressure: pool?.filterPressure || 0,
            filterCapacity: pool?.filterCapacity || 0,
          }
        });
    }
  }, [client, pool, form]);


  React.useEffect(() => {
    resetForms();
  }, [client, pool, resetForms]);

  const onSubmit = async (data: z.infer<typeof form.control.schema>) => {
      if (!clientRef || !pool?.id || !user || !firestore) {
          toast({ variant: 'destructive', title: 'Erro', description: 'Cliente ou piscina não carregado.' });
          return;
      }
      setIsSaving(true);
      try {
          const clientUpdateData = { ...data.client };
          await updateDoc(clientRef, clientUpdateData);

          const poolRef = doc(firestore, `users/${user.uid}/clients/${clientId}/pools`, pool.id);
          const poolUpdateData = {
              ...data.poolDimensions,
              ...data.chemicalData,
              ...data.poolProperties,
              ...data.filterData,
              updatedAt: serverTimestamp(),
          };
          await updateDoc(poolRef, poolUpdateData);

          toast({ title: "Sucesso!", description: "Ficha do cliente atualizada." });
      } catch (error) {
          console.error("Error updating document: ", error);
          toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível atualizar a ficha.' });
      } finally {
          setIsSaving(false);
      }
  };

  const isLoading = isClientLoading || arePoolsLoading;

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
        <CardDescription className="mt-2">
          O cliente que você está procurando não existe ou foi removido.
        </CardDescription>
        <Button asChild className="mt-4">
          <Link href="/clients">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Clientes
          </Link>
        </Button>
      </div>
    );
  }
  
  const chemicalParams = [
      { name: 'pH', ideal: '7.2 a 7.6', formKey: 'chemicalData.ph' },
      { name: 'Cloro Livre', ideal: '1.0 a 3.0 ppm', formKey: 'chemicalData.chlorine' },
      { name: 'Alcalinidade', ideal: '80 a 120 ppm', formKey: 'chemicalData.alkalinity' },
      { name: 'Dureza Cálcica', ideal: '200 a 400 ppm', formKey: 'chemicalData.calciumHardness' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between gap-4">
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
                <CardDescription>
                    Cliente desde {client.startDate ? new Date(client.startDate).toLocaleDateString('pt-BR') : 'Data não definida'}
                </CardDescription>
                </div>
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={resetForms} disabled={isSaving}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resetar
                </Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Alterações
                </Button>
            </div>
        </div>

        {/* DADOS PESSOAIS */}
        <Card>
            <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="client.name" render={({ field }) => (
                    <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="client.phone" render={({ field }) => (
                    <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="client.address" render={({ field }) => (
                    <FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="client.startDate" render={({ field }) => (
                    <FormItem><FormLabel>Data de Início</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="client.notes" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Observações</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </CardContent>
        </Card>

        {pool ? (
            <>
            {/* METRAGENS E DIMENSÕES */}
            <Card>
                <CardHeader><CardTitle>Metragens e Dimensões</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={form.control} name="poolDimensions.type" render={({ field }) => (
                        <FormItem><FormLabel>Tipo da Piscina</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                            <FormItem><FormControl><RadioGroupItem value="quadrilateral" id="quadrilateral" /></FormControl><FormLabel htmlFor="quadrilateral" className="ml-2">Quadrilateral</FormLabel></FormItem>
                            <FormItem><FormControl><RadioGroupItem value="circular" id="circular" /></FormControl><FormLabel htmlFor="circular" className="ml-2">Circular</FormLabel></FormItem>
                            <FormItem><FormControl><RadioGroupItem value="oval" id="oval" /></FormControl><FormLabel htmlFor="oval" className="ml-2">Oval</FormLabel></FormItem>
                        </RadioGroup></FormControl><FormMessage /></FormItem>
                    )} />
                     <div className="grid md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="poolDimensions.length" render={({ field }) => (
                            <FormItem><FormLabel>Comprimento / Diâmetro</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="poolDimensions.width" render={({ field }) => (
                            <FormItem><FormLabel>Largura / Diâmetro</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="poolDimensions.averageDepth" render={({ field }) => (
                            <FormItem><FormLabel>Profundidade Média</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </CardContent>
            </Card>

            {/* DADOS QUÍMICOS E TÉCNICOS */}
            <Card>
                <CardHeader><CardTitle>Dados Químicos e Técnicos</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Parâmetro</TableHead>
                                <TableHead>Indicador Ideal</TableHead>
                                <TableHead className="w-[200px]">Indicador Atual</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {chemicalParams.map(param => (
                                <TableRow key={param.name}>
                                    <TableCell className="font-medium">{param.name}</TableCell>
                                    <TableCell>{param.ideal}</TableCell>
                                    <TableCell>
                                        <FormField control={form.control} name={param.formKey as any} render={({ field }) => (
                                            <FormItem><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* PROPRIEDADES DA PISCINA */}
            <Card>
                <CardHeader><CardTitle>Propriedades da Piscina</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="poolProperties.material" render={({ field }) => (
                        <FormItem><FormLabel>Material</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                            <FormItem><FormControl><RadioGroupItem value="fiber" id="fiber" /></FormControl><FormLabel htmlFor="fiber" className="ml-2">Fibra</FormLabel></FormItem>
                            <FormItem><FormControl><RadioGroupItem value="masonry" id="masonry" /></FormControl><FormLabel htmlFor="masonry" className="ml-2">Alvenaria</FormLabel></FormItem>
                            <FormItem><FormControl><RadioGroupItem value="vinyl" id="vinyl" /></FormControl><FormLabel htmlFor="vinyl" className="ml-2">Vinil</FormLabel></FormItem>
                        </RadioGroup></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="poolProperties.waterQuality" render={({ field }) => (
                         <FormItem><FormLabel>Qualidade da Água</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                            <FormItem><FormControl><RadioGroupItem value="green" id="green" /></FormControl><FormLabel htmlFor="green" className="ml-2">Verde</FormLabel></FormItem>
                            <FormItem><FormControl><RadioGroupItem value="cloudy" id="cloudy" /></FormControl><FormLabel htmlFor="cloudy" className="ml-2">Turva</FormLabel></FormItem>
                            <FormItem><FormControl><RadioGroupItem value="crystal-clear" id="crystal-clear" /></FormControl><FormLabel htmlFor="crystal-clear" className="ml-2">Cristalina</FormLabel></FormItem>
                        </RadioGroup></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="poolProperties.hasStains" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Possui Manchas?</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                    )} />
                     <FormField control={form.control} name="poolProperties.hasScale" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Possui Incrustações?</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                    )} />
                </CardContent>
            </Card>

            {/* FILTRO */}
            <Card>
                <CardHeader><CardTitle>Filtro</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FormField control={form.control} name="filterData.filterType" render={({ field }) => (
                        <FormItem><FormLabel>Tipo do Filtro</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="sand">Areia</SelectItem>
                                <SelectItem value="cartridge">Cartucho</SelectItem>
                                <SelectItem value="polyester">Poliéster</SelectItem>
                            </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="filterData.lastFilterChange" render={({ field }) => (
                        <FormItem><FormLabel>Última Troca</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="filterData.nextFilterChange" render={({ field }) => (
                        <FormItem><FormLabel>Próxima Troca</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="filterData.filterPressure" render={({ field }) => (
                        <FormItem><FormLabel>Pressão</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="filterData.filterCapacity" render={({ field }) => (
                        <FormItem><FormLabel>Capacidade</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </CardContent>
            </Card>
            </>
        ) : (
            <Card>
                <CardHeader><CardTitle>Nenhuma Piscina Encontrada</CardTitle></CardHeader>
                <CardContent>
                    <p>Este cliente ainda não tem uma piscina cadastrada. Adicione uma para ver e editar os detalhes.</p>
                    {/* TODO: Add button to create a new pool */}
                </CardContent>
            </Card>
        )}
      </form>
    </Form>
  );
}
