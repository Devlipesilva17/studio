'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Payment, Visit } from '@/lib/types';
import { collectionGroup, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the chart components
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false, loading: () => <Skeleton className="w-full h-[350px]" /> });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });


export default function ReportsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const visitsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collectionGroup(firestore, 'visits'),
            where('userId', '==', user.uid),
            where('status', '==', 'completed')
        );
    }, [user, firestore]);

    const paymentsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collectionGroup(firestore, 'payments'),
            where('userId', '==', user.uid),
            where('status', '==', 'paid')
        );
    }, [user, firestore]);

    const { data: completedVisits, isLoading: areVisitsLoading } = useCollection<Visit>(visitsQuery);
    const { data: paidPayments, isLoading: arePaymentsLoading } = useCollection<Payment>(paymentsQuery);
    
    const chartData = React.useMemo(() => {
        const monthlyRevenue: { [key: string]: number } = { Jan: 0, Fev: 0, Mar: 0, Abr: 0, Mai: 0, Jun: 0, Jul: 0, Ago: 0, Set: 0, Out: 0, Nov: 0, Dez: 0 };
        
        if (paidPayments) {
            paidPayments.forEach(payment => {
                const month = new Date(payment.date).getMonth();
                const monthName = Object.keys(monthlyRevenue)[month];
                if (monthName) {
                    monthlyRevenue[monthName] += payment.amount;
                }
            });
        }
        
        return Object.entries(monthlyRevenue).map(([name, total]) => ({ name, total }));
    }, [paidPayments]);

    const totalVisits = completedVisits?.length || 0;
    const totalRevenue = paidPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const productsUsedCount = completedVisits?.flatMap(v => v.productsUsed).reduce((sum, p) => sum + p.quantity, 0) || 0;
    
    const isLoading = areVisitsLoading || arePaymentsLoading;

    if (isLoading) {
        return (
             <div className="flex flex-col gap-6">
                <div className="flex items-center">
                    <h1 className="text-lg font-semibold md:text-2xl font-headline">Relatórios</h1>
                </div>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-10 w-1/2" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-10 w-1/2" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-10 w-1/2" /></CardContent></Card>
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[350px] w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Relatórios</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Visitas Totais (Este Mês)</CardTitle>
                        <CardDescription>Número total de visitas concluídas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{totalVisits}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Receita Total (Este Mês)</CardTitle>
                        <CardDescription>Renda total de faturas pagas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">R$ {totalRevenue.toLocaleString('pt-BR')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Produtos Consumidos</CardTitle>
                        <CardDescription>Total de unidades de produtos usados nas visitas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{productsUsedCount}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Receita Mensal</CardTitle>
                    <CardDescription>Uma visão geral de sua receita para o ano.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData}>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `R$${value}`}
                            />
                            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
