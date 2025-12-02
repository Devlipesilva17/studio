'use client';

import {
    ArrowUpRight,
    CalendarCheck,
    CreditCard,
    DollarSign,
    Users,
  } from "lucide-react"
  import Link from "next/link"
  import * as React from 'react';
  
  import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "@/components/ui/avatar"
  import { Badge } from "@/components/ui/badge"
  import { Button } from "@/components/ui/button"
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
  import { Client, Payment, Visit } from "@/lib/types";
  import { collection, collectionGroup, query, where, limit, orderBy, getCountFromServer } from "firebase/firestore";
  import { Skeleton } from "@/components/ui/skeleton";
  
  export default function Dashboard() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [locale, setLocale] = React.useState('pt-BR');
    const [clientCount, setClientCount] = React.useState(0);
    const [pendingPaymentsCount, setPendingPaymentsCount] = React.useState(0);
    const [isLoadingAggregates, setIsLoadingAggregates] = React.useState(true);

    React.useEffect(() => {
        const userLocale = navigator.language || 'pt-BR';
        setLocale(userLocale);
    }, []);

    // Aggregate queries
    React.useEffect(() => {
      async function fetchAggregates() {
        if (!user?.uid || !firestore) return;

        setIsLoadingAggregates(true);
        try {
          // These queries are fast as they only fetch counts from the server.
          const clientsRef = collection(firestore, `users/${user.uid}/clients`);
          const clientSnapshot = await getCountFromServer(clientsRef);
          setClientCount(clientSnapshot.data().count);

          const paymentsRef = collectionGroup(firestore, 'payments');
          const paymentsQuery = query(paymentsRef, where('userId', '==', user.uid), where('status', '==', 'pending'));
          const paymentSnapshot = await getCountFromServer(paymentsQuery);
          setPendingPaymentsCount(paymentSnapshot.data().count);

        } catch (error) {
          console.error("Error fetching aggregate counts:", error);
        } finally {
          setIsLoadingAggregates(false);
        }
      }

      fetchAggregates();
    }, [user?.uid, firestore]);

    const todayString = new Date().toISOString().split('T')[0];

    const visitsQuery = useMemoFirebase(() => {
        if (!user?.uid || !firestore) return null;
        return query(
            collectionGroup(firestore, 'visits'),
            where('userId', '==', user.uid),
            where('date', '>=', todayString),
            orderBy('date'),
            orderBy('time'),
            limit(5)
        );
    }, [user?.uid, firestore, todayString]);

    const recentClientsQuery = useMemoFirebase(() => {
        if (!user?.uid || !firestore) return null;
        return query(
            collection(firestore, `users/${user.uid}/clients`),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
    }, [user?.uid, firestore]);

    const paidPaymentsQuery = useMemoFirebase(() => {
        if (!user?.uid || !firestore) return null;
        return query(
            collectionGroup(firestore, 'payments'),
            where('userId', '==', user.uid),
            where('status', '==', 'paid')
        );
    }, [user?.uid, firestore]);

    const { data: upcomingVisits, isLoading: areVisitsLoading } = useCollection<Visit>(visitsQuery);
    const { data: recentClients, isLoading: areClientsLoading } = useCollection<Client>(recentClientsQuery);
    const { data: paidPayments, isLoading: arePaidPaymentsLoading } = useCollection<Payment>(paidPaymentsQuery);

    const totalRevenue = React.useMemo(() => {
        if (!paidPayments) return 0;
        return paidPayments.reduce((sum, p) => sum + p.amount, 0);
    }, [paidPayments]);

    const todayVisitsCount = upcomingVisits?.filter(v => v.date === todayString).length || 0;
    const isLoading = areVisitsLoading || areClientsLoading || arePaidPaymentsLoading || isLoadingAggregates;

    if (isLoading) {
        return (
             <div className="flex flex-col gap-6">
                <div className="flex items-center">
                    <h1 className="text-lg font-semibold md:text-2xl font-headline">Dashboard</h1>
                </div>
                 <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                    <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-10 w-1/2" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-10 w-1/2" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-10 w-1/2" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-10 w-1/2" /></CardContent></Card>
                </div>
                <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                    <Card className="xl:col-span-2">
                        <CardHeader><Skeleton className="h-8 w-1/4" /><Skeleton className="h-4 w-1/2" /></CardHeader>
                        <CardContent><Skeleton className="h-[200px] w-full" /></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Skeleton className="h-8 w-1/3" /><Skeleton className="h-4 w-3/4" /></CardHeader>
                        <CardContent className="grid gap-8">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Dashboard</h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2}) }</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% do último mês
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Clientes Ativos
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{clientCount}</div>
                <p className="text-xs text-muted-foreground">
                  +2 desde o último mês
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingPaymentsCount}</div>
                <p className="text-xs text-muted-foreground">
                  agendados para cobrança
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visitas de Hoje</CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayVisitsCount}</div>
                <p className="text-xs text-muted-foreground">
                  agendadas para hoje
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                  <CardTitle>Próximas Visitas</CardTitle>
                  <CardDescription>
                    Visitas recentes de seus clientes.
                  </CardDescription>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                  <Link href="/schedule">
                    Ver Todas
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>
                        Status
                      </TableHead>
                      <TableHead>
                        Data
                      </TableHead>
                      <TableHead className="text-right">Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingVisits && upcomingVisits.map(visit => (
                        <TableRow key={visit.id}>
                            <TableCell>
                                <div className="font-medium">{visit.clientName}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={visit.status === 'completed' ? 'text-green-500 border-green-500' : 'text-amber-500 border-amber-500'}>
                                    {visit.status === 'completed' ? 'Concluída' : 'Pendente'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {new Date(visit.scheduledDate).toLocaleDateString(locale)}
                            </TableCell>
                            <TableCell className="text-right">{visit.time}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Clientes Recentes</CardTitle>
                {recentClients && <CardDescription>
                  Você tem {recentClients.length} clientes novos.
                </CardDescription>}
              </CardHeader>
              <CardContent className="grid gap-8">
                {recentClients && recentClients.map(client => (
                    <div key={client.id} className="flex items-center gap-4">
                        <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src={client.avatarUrl} alt="Avatar" />
                        <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none">
                            {client.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {client.email}
                        </p>
                        </div>
                    </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
    )
  }

    