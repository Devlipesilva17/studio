'use client';

import * as React from 'react';
import { File, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where, limit, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import type { Payment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [locale, setLocale] = React.useState('pt-BR');

  const paymentsQuery = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;
    return query(
        collectionGroup(firestore, 'payments'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc'),
        limit(20)
    );
  }, [user?.uid, firestore]);

  const { data: payments, isLoading } = useCollection<Payment>(paymentsQuery);
  
  React.useEffect(() => {
    const userLocale = navigator.language || 'pt-BR';
    setLocale(userLocale);
  }, []);

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Pagamentos</h1>
      </div>
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="paid">Pagos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Exportar
              </span>
            </Button>
          </div>
        </div>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos</CardTitle>
              <CardDescription>
                Acompanhe os pagamentos e faturas dos clientes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && payments && payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.clientName}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            payment.status === 'paid' && 'bg-green-500/20 text-green-700 border-green-500/20 hover:bg-green-500/30',
                            payment.status === 'pending' && 'bg-amber-500/20 text-amber-700 border-amber-500/20 hover:bg-amber-500/30'
                          )}
                          variant="outline"
                        >
                          {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(payment.date).toLocaleDateString(locale)}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {payment.amount.toFixed(2).replace('.', ',')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Abrir menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem>Ver Cliente</DropdownMenuItem>
                            <DropdownMenuItem>Marcar como Pago</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                   {!isLoading && (!payments || payments.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">Nenhum pagamento encontrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Mostrando <strong>{payments?.length ?? 0}</strong> de <strong>{payments?.length ?? 0}</strong> pagamentos
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

    