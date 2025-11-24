'use client';

import * as React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from '@/components/ui/calendar';
import type { Visit, Client, Pool } from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { VisitEditDialog } from '@/components/schedule/visit-edit-dialog';

export default function SchedulePage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [viewMode, setViewMode] = React.useState<'week' | 'month'>('week');
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [visitsByDay, setVisitsByDay] = React.useState<Visit[][]>([]);
    const [weekDays, setWeekDays] = React.useState<Date[]>([]);
    const [weekRange, setWeekRange] = React.useState('');
    const [locale, setLocale] = React.useState('pt-BR');

    const schedulesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        // This query is simplistic. A real app would query across all clients.
        // For this example, we assume we want all schedules for a user,
        // which isn't directly supported by this structure without sub-collection queries.
        // This is a placeholder for a more complex query logic.
        return query(collection(firestore, `users/${user.uid}/clients/`));
    }, [firestore, user]);
    
    // This is a placeholder. You'd fetch visits from all clients, not from a single root collection.
    // const { data: visits, isLoading } = useCollection<Visit>(schedulesQuery);
    const visits: Visit[] = []; // Using empty array until proper querying is built
    const isLoading = false;


    const clientsQuery = useMemoFirebase(() => {
      if (!user || !firestore) return null;
      return query(collection(firestore, `users/${user.uid}/clients`));
    }, [firestore, user]);
    const { data: clientList } = useCollection<Client>(clientsQuery);
    
    // This would need to be a more complex query to get all pools for a user
    const pools: Pool[] = []; 


    const daysWithVisits = React.useMemo(() => {
        return (visits || []).map(visit => new Date(visit.scheduledDate));
    }, [visits]);

    const selectedDayVisits = React.useMemo(() => {
        if (!selectedDate || !visits) return [];
        return visits.filter(visit => {
            const visitDate = new Date(visit.scheduledDate);
            return visitDate.getFullYear() === selectedDate.getFullYear() &&
                   visitDate.getMonth() === selectedDate.getMonth() &&
                   visitDate.getDate() === selectedDate.getDate();
        }).sort((a,b) => a.time.localeCompare(b.time));
    }, [selectedDate, visits]);


    React.useEffect(() => {
        const userLocale = navigator.language || 'pt-BR';
        setLocale(userLocale);

        const today = new Date(currentDate);
        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday as start of week
        startOfWeek.setDate(diff);

        const days = Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            return day;
        });
        setWeekDays(days);
        
        const dailyVisits = days.map(day => 
            (visits || []).filter(visit => {
                const visitDate = new Date(visit.scheduledDate);
                return visitDate.getFullYear() === day.getFullYear() &&
                       visitDate.getMonth() === day.getMonth() &&
                       visitDate.getDate() === day.getDate();
            }).sort((a,b) => a.time.localeCompare(b.time))
        );
        setVisitsByDay(dailyVisits);

        const start = days[0].toLocaleDateString(userLocale, { month: 'long', day: 'numeric'});
        const end = days[6].toLocaleDateString(userLocale, { month: 'long', day: 'numeric', year: 'numeric'});
        setWeekRange(`${start} - ${end}`);

    }, [currentDate, visits]);

    const handlePrevWeek = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() - 7);
            return newDate;
        });
    }

    const handleNextWeek = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() + 7);
            return newDate;
        });
    }
    
    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
    }
    
    const handleAddNewVisit = () => {
        setIsEditDialogOpen(true);
    }

    const getStatusText = (status: 'pending' | 'completed' | 'skipped') => {
        switch (status) {
            case 'completed': return 'Concluída';
            case 'skipped': return 'Prorrogada';
            case 'pending':
            default: return 'Pendente';
        }
    }


    return (
        <>
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-4">
                     <h1 className="text-lg font-semibold md:text-2xl font-headline">Agenda</h1>
                     {viewMode === 'week' && (
                         <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevWeek}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium text-center w-64">
                                {weekRange}
                            </span>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextWeek}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                         </div>
                     )}
                </div>
                <div className='flex gap-2'>
                    <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}>
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            {viewMode === 'week' ? 'Visão Mensal' : 'Visão Semanal'}
                        </span>
                    </Button>
                    <Button size="sm" className="h-8 gap-1" onClick={handleAddNewVisit}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Nova Visita
                        </span>
                    </Button>
                </div>
            </div>
            
            {isLoading ? (
                 <div className="text-center">Carregando agendamentos...</div>
            ) : viewMode === 'week' ? (
                <div className="grid grid-cols-1 md:grid-cols-7 flex-1 gap-2 items-start">
                    {weekDays.map((day, index) => (
                        <div key={day.toISOString()} className="flex flex-col gap-2">
                            <div className="text-center p-2 rounded-lg bg-card">
                                <p className="font-semibold text-sm">{day.toLocaleDateString(locale, { weekday: 'short' })}</p>
                                <p className="text-2xl font-bold font-headline">{day.getDate()}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {visitsByDay[index] && visitsByDay[index].length > 0 ? visitsByDay[index].map(visit => (
                                    <Card key={visit.id} className="w-full">
                                        <CardHeader className="p-4">
                                            <CardTitle className="text-base">{visit.clientName}</CardTitle>
                                            <CardDescription>{visit.time}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <Badge variant={visit.status === 'completed' ? 'default' : 'secondary'}>{getStatusText(visit.status)}</Badge>
                                        </CardContent>
                                    </Card>
                                )) : (
                                    <div className="text-center text-sm text-muted-foreground p-4">Nenhuma visita</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                        <CardContent className="p-2">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                className="w-full"
                                locale={require('date-fns/locale/pt-BR').ptBR}
                                modifiers={{
                                    hasVisit: daysWithVisits
                                }}
                                modifiersClassNames={{
                                    hasVisit: 'day-has-visit'
                                }}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Visitas para {selectedDate ? selectedDate.toLocaleDateString(locale, {day: 'numeric', month: 'long'}) : 'Data Selecionada'}
                            </CardTitle>
                            <CardDescription>
                                {selectedDayVisits.length > 0 ? `Você tem ${selectedDayVisits.length} visitas.` : 'Nenhuma visita para este dia.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                           {selectedDayVisits.length > 0 ? selectedDayVisits.map(visit => (
                                <div key={visit.id} className="w-full p-3 rounded-lg border bg-background/50">
                                    <p className="font-semibold">{visit.clientName}</p>
                                    <p className="text-sm text-muted-foreground">{visit.time}</p>
                                    <Badge variant={visit.status === 'completed' ? 'default' : 'secondary'} className='mt-2'>{getStatusText(visit.status)}</Badge>
                                </div>
                           )) : (
                                <div className="text-center text-sm text-muted-foreground p-4">
                                    Selecione um dia no calendário para ver os detalhes.
                                </div>
                           )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
        <VisitEditDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            clients={clientList || []}
        />
        </>
    );
}
