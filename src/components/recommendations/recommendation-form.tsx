'use client';

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Client, Pool } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { getProductRecommendations } from '@/app/actions/get-recommendations';
import type { ProductRecommendationsOutput } from '@/ai/flows/ai-product-recommendations';
import { Loader2, WandSparkles } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const formSchema = z.object({
    clientId: z.string().min(1, { message: "Por favor, selecione um cliente." }),
    poolId: z.string().min(1, { message: "Por favor, selecione uma piscina." }),
    lastTreatment: z.string().min(10, { message: "Por favor, descreva o último tratamento com mais detalhes." }),
    algaeLevel: z.enum(["none", "low", "medium", "high"]),
    pHLevel: z.coerce.number().min(6.0).max(8.0),
})

type RecommendationFormProps = {
    clients: Client[];
    pools: Pool[];
}

export function RecommendationForm({ clients, pools }: RecommendationFormProps) {
    const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null);
    const [selectedPool, setSelectedPool] = React.useState<Pool | null>(null);
    const [recommendations, setRecommendations] = React.useState<ProductRecommendationsOutput | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clientId: "",
            poolId: "",
            lastTreatment: "",
            algaeLevel: "none",
            pHLevel: 7.4,
        },
    })

    const handleClientChange = (clientId: string) => {
        form.setValue("clientId", clientId);
        setSelectedClientId(clientId);
        form.setValue("poolId", "");
        setSelectedPool(null);
    }

    const handlePoolChange = (poolId: string) => {
        form.setValue("poolId", poolId);
        const pool = pools.find(p => p.id === poolId);
        if (pool) {
            setSelectedPool(pool);
            form.setValue("lastTreatment", pool.lastTreatment || "");
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!selectedPool) return;
        setIsLoading(true);
        setRecommendations(null);

        const input = {
            poolSize: selectedPool.size,
            poolType: selectedPool.type,
            lastTreatment: values.lastTreatment,
            algaeLevel: values.algaeLevel,
            pHLevel: values.pHLevel,
        }
        
        const result = await getProductRecommendations(input);
        setRecommendations(result);
        setIsLoading(false);
    }
    
    const clientPools = selectedClientId ? pools.filter(p => p.clientId === selectedClientId) : [];

    return (
        <div className="grid md:grid-cols-2 gap-8 items-start">
        <Card>
            <CardHeader>
                <CardTitle>Condições da Piscina</CardTitle>
                <CardDescription>Preencha os detalhes sobre o estado atual da piscina.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                    <Select onValueChange={handlePoolChange} value={field.value} disabled={!selectedClientId}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione uma piscina" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {clientPools.map(pool => (
                                                <SelectItem key={pool.id} value={pool.id}>{pool.name} ({pool.size} gal)</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lastTreatment"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Último Tratamento</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="ex: Adicionado 2 tabletes de cloro, pH balanceado..." {...field} />
                                </FormControl>
                                <FormDescription>
                                    Descreva o último serviço realizado nesta piscina.
                                </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="algaeLevel"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nível de Algas</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o nível de algas" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        <SelectItem value="low">Baixo</SelectItem>
                                        <SelectItem value="medium">Médio</SelectItem>
                                        <SelectItem value="high">Alto</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="pHLevel"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nível de pH</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.1" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
                             Obter Recomendações
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
        <Card className="bg-secondary/50">
            <CardHeader>
                <CardTitle>Recomendações da IA</CardTitle>
                <CardDescription>Produtos e dosagens sugeridos pela IA.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                )}
                {recommendations ? (
                    recommendations.recommendedProducts.map((rec, index) => (
                        <div key={index} className="p-4 rounded-lg border bg-card">
                            <h3 className="font-semibold text-primary">{rec.productName}</h3>
                            <p className="font-mono text-sm bg-muted p-2 rounded-md my-2">Dosagem: {rec.dosage}</p>
                            <p className="text-sm text-muted-foreground">{rec.reason}</p>
                        </div>
                    ))
                ) : (
                    !isLoading && <div className="text-center text-muted-foreground py-10">
                        <WandSparkles className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2">Suas recomendações aparecerão aqui.</p>
                    </div>
                )}
            </CardContent>
        </Card>
        </div>
    )
}
