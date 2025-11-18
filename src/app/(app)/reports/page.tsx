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

    React.useEffect(() => {
        const data = [
            { name: "Jan", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Feb", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Mar", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Apr", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "May", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Jun", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Jul", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Aug", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Sep", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Oct", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Nov", total: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Dec", total: Math.floor(Math.random() * 5000) + 1000 },
        ];
        setChartData(data);
    }, []);

    const totalVisits = DUMMY_VISITS.filter(v => v.status === 'completed').length;
    const totalRevenue = DUMMY_PAYMENTS.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const productsUsedCount = DUMMY_VISITS.flatMap(v => v.productsUsed).reduce((sum, p) => sum + p.quantity, 0);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Reports</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Visits (This Month)</CardTitle>
                        <CardDescription>Total number of completed visits.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{totalVisits}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Revenue (This Month)</CardTitle>
                        <CardDescription>Total income from paid invoices.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">${totalRevenue.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Products Consumed</CardTitle>
                        <CardDescription>Total units of products used in visits.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{productsUsedCount}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Monthly Revenue</CardTitle>
                    <CardDescription>An overview of your revenue for the year.</CardDescription>
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
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
