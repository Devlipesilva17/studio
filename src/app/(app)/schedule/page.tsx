'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DUMMY_VISITS } from "@/lib/placeholder-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SchedulePage() {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [visitsByDay, setVisitsByDay] = React.useState<typeof DUMMY_VISITS[]>([]);
    const [weekDays, setWeekDays] = React.useState<Date[]>([]);
    const [weekRange, setWeekRange] = React.useState('');
    const [locale, setLocale] = React.useState('pt-BR');

    React.useEffect(() => {
        const userLocale = navigator.language || 'pt-BR';
        setLocale(userLocale);

        const today = new Date(currentDate);
        const startOfWeek = new Date(today);
        // Adjust to Monday as the start of the week
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startOfWeek.setDate(diff);


        const days = Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            return day;
        });
        setWeekDays(days);
        
        const dailyVisits = days.map(day => 
            DUMMY_VISITS.filter(visit => {
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

    }, [currentDate]);

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

    const getStatusText = (status: 'pending' | 'completed' | 'skipped') => {
        switch (status) {
            case 'completed': return 'Concluída';
            case 'skipped': return 'Prorrogada';
            case 'pending':
            default: return 'Pendente';
        }
    }


    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-4">
                     <h1 className="text-lg font-semibold md:text-2xl font-headline">Agenda Semanal</h1>
                     <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevWeek}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                            {weekRange}
                        </span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextWeek}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                     </div>
                </div>
                <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Nova Visita
                    </span>
                </Button>
            </div>
            
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
        </div>
    );
}
