'use client';

import * as React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DUMMY_PAYMENTS, DUMMY_VISITS } from "@/lib/placeholder-data";

export default function ReportsPage() {
    const [chartData, setChartData] = React.useState<any[]>([]);
    const [totalVisits, setTotalVisits] = React.useState(0);
    const [totalRevenue, setTotalRevenue] = React.useState(0);
    const [productsUsedCount, setProductsUsedCount] = React.useState(0);

    React.useEffect(() => {
        const data = [
            { name: "Jan", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Fev", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Mar", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Abr", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Mai", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Jun", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Jul", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Ago", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Set", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Out", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Nov", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Dez", total: Math.floor(Math.random() * 5000) + 1000 },
        ];
        setChartData(data);

        setTotalVisits(DUMMY_VISITS.filter(v => v.status === 'completed').length);
        setTotalRevenue(DUMMY_PAYMENTS.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0));
        setProductsUsedCount(DUMMY_VISITS.flatMap(v => v.productsUsed).reduce((sum, p) => sum + p.quantity, 0));

    }, []);

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
