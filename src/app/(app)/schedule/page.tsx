

'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Pencil,
  Trash2,
  Clipboard,
  Check,
  MoreHorizontal,
  Save,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import type { Visit } from '@/lib/types';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  query,
  doc,
  updateDoc,
  deleteDoc,
  collectionGroup,
  where,
} from 'firebase/firestore';
import { addDays, startOfWeek, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const QuickEditDialog = dynamic(() => import('@/components/schedule/quick-edit-dialog').then(module => ({ default: module.QuickEditDialog })), { ssr: false });
const VisitEditDialog = dynamic(() => import('@/components/schedule/visit-edit-dialog').then(module => ({ default: module.VisitEditDialog })), { 
    ssr: false,
    loading: () => <div className='fixed inset-0 bg-black/50 flex items-center justify-center'><Skeleton className='h-96 w-full max-w-lg' /></div>
});

export default function SchedulePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [viewMode, setViewMode] = React.useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date()
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedVisit, setSelectedVisit] = React.useState<Visit | undefined>(
    undefined
  );
  const [locale, setLocale] = React.useState('pt-BR');

  React.useEffect(() => {
    const userLocale = navigator.language || 'pt-BR';
    setLocale(userLocale);
  }, []);

  const selectedDay = selectedDate || currentDate;

  const schedulesQuery = useMemoFirebase(() => {
    if (!user || !firestore || !user.uid || !selectedDay) return null;
    
    return query(
      collectionGroup(firestore, 'visits'),
      where('date', '==', format(selectedDay, 'yyyy-MM-dd')),
      where('userId', '==', user.uid)
    );
  }, [firestore, user, selectedDay]);

  const {
    data: visits,
    isLoading: isVisitsLoading,
  } = useCollection<Visit>(schedulesQuery);

  const daysWithVisits = React.useMemo(() => {
    if (!visits) return [];
    return visits.map((visit) => new Date(visit.scheduledDate));
  }, [visits]);

  const selectedDayVisits = React.useMemo(() => {
    if (!selectedDate || !visits) return [];
    return visits
      .filter((visit) => {
        const visitDate = new Date(visit.scheduledDate);
        return (
          visitDate.getFullYear() === selectedDate.getFullYear() &&
          visitDate.getMonth() === selectedDate.getMonth() &&
          visitDate.getDate() === selectedDate.getDate()
        );
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDate, visits]);

  const weekDays = React.useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday as start of week
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  const visitsByDay = React.useMemo(() => {
    if (!visits) return weekDays.map(() => []);
    return weekDays.map((day) =>
      visits
        .filter((visit) => {
          const visitDate = new Date(visit.scheduledDate);
          return (
            visitDate.getFullYear() === day.getFullYear() &&
            visitDate.getMonth() === day.getMonth() &&
            visitDate.getDate() === day.getDate()
          );
        })
        .sort((a, b) => a.time.localeCompare(b.time))
    );
  }, [weekDays, visits]);

  const weekRange = React.useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startStr = start.toLocaleDateString(locale, {
      month: 'long',
      day: 'numeric',
    });
    const endStr = end.toLocaleDateString(locale, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    return `${startStr} - ${endStr}`;
  }, [weekDays, locale]);

  const handlePrevWeek = () => setCurrentDate((prev) => addDays(prev, -7));
  const handleNextWeek = () => setCurrentDate((prev) => addDays(prev, 7));

  const handleDateSelect = (date: Date | undefined) => setSelectedDate(date);

  const handleAddNewVisit = () => {
    setSelectedVisit(undefined);
    setIsEditDialogOpen(true);
  };

  const handleEditVisit = (visit: Visit) => {
    setSelectedVisit(visit);
    setIsEditDialogOpen(true);
  };

  const handleMarkAsComplete = async (visit: Visit) => {
    if (!user || !firestore) return;

    const visitRef = doc(
      firestore,
      `users/${user.uid}/clients/${visit.clientId}/visits`,
      visit.id
    );

    try {
      await updateDoc(visitRef, {
        status: 'completed',
        completedDate: new Date().toISOString(),
      });

      toast({
        title: 'Visita Concluída!',
        description: `A visita para ${visit.clientName} foi marcada como concluída.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar a visita.',
      });
    }
  };

  const handleDeleteVisit = async (visit: Visit) => {
    if (!user || !firestore) return;

    const visitRef = doc(
      firestore,
      `users/${user.uid}/clients/${visit.clientId}/visits`,
      visit.id
    );

    try {
      await deleteDoc(visitRef);
      toast({
        title: 'Visita Excluída!',
        description: `O agendamento para ${visit.clientName} foi removido.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível excluir a visita.',
      });
    }
  };

  const getStatusText = (status: 'pending' | 'completed' | 'skipped') => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'skipped':
        return 'Prorrogada';
      case 'pending':
      default:
        return 'Pendente';
    }
  };

  const renderVisitActions = (visit: Visit) => (
    <div className="flex justify-end items-center gap-1">
      <React.Suspense fallback={<Button variant="ghost" size="icon" className="h-7 w-7" disabled><Clipboard className="h-4 w-4" /></Button>}>
        <QuickEditDialog visit={visit} />
      </React.Suspense>
      
      {visit.status === 'pending' && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-green-600 hover:text-green-600"
          onClick={() => handleMarkAsComplete(visit)}
        >
          <Check className="h-5 w-5" />
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleEditVisit(visit)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a visita para {visit.clientName}
                  ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteVisit(visit)}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold md:text-2xl font-headline">
              Agenda
            </h1>
            {viewMode === 'week' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handlePrevWeek}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-center w-64">
                  {weekRange}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleNextWeek}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={() => setViewMode(viewMode === 'week' ?
'month' : 'week')}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                {viewMode === 'week' ?
'Visão Mensal' : 'Visão Semanal'}
              </span>
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1"
              onClick={handleAddNewVisit}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Nova Visita
              </span>
            </Button>
          </div>
        </div>

        
        {isVisitsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-7 flex-1 gap-2 items-start">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        ) : viewMode === 'week' ?
(
          <div className="grid grid-cols-1 md:grid-cols-7 flex-1 gap-2 items-start">
            {weekDays.map((day, index) => (
              <div key={day.toISOString()} className="flex flex-col gap-2">
                <div className="text-center p-2 rounded-lg bg-card">
                  <p className="font-semibold text-sm">
                    {day.toLocaleDateString(locale, { weekday: 'short' })}
                  </p>
                  <p className="text-2xl font-bold font-headline">
                    {day.getDate()}
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-h-[100px] flex-1">
                  {visitsByDay[index] && visitsByDay[index].length > 0 ? (
                    visitsByDay[index].map((visit) => (
                      <Card key={visit.id} className="w-full flex flex-col flex-grow">
                        <CardHeader className="p-3">
                          <CardTitle className="text-base">
                            {visit.clientName}
                          </CardTitle>
                          <CardDescription>{visit.time}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 flex-grow">
                          <Badge
                            variant={
                              visit.status === 'completed'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {getStatusText(visit.status)}
                          </Badge>
                        </CardContent>
                        <CardFooter className="p-2 pt-0 mt-auto">
                          {renderVisitActions(visit)}
                        </CardFooter>
                      </Card>
                    ))
                ) : (
                    <div className="text-center text-sm text-muted-foreground p-4">
                      Nenhuma visita
                    </div>
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
                  modifiers={{ hasVisit: daysWithVisits }}
                  modifiersClassNames={{ hasVisit: 'day-has-visit' }}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  Visitas para{' '}
                  {selectedDate
                    ? selectedDate.toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'long',
                      })
                    : 'Data Selecionada'}
                </CardTitle>
                <CardDescription>
                  {selectedDayVisits.length > 0
                    ? `Você tem ${selectedDayVisits.length} visitas.`
                    : 'Nenhuma visita para este dia.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {selectedDayVisits.length > 0 ?
(
                  selectedDayVisits.map((visit) => (
                    <div
                      key={visit.id}
                      className="w-full p-3 rounded-lg border bg-card"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{visit.clientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {visit.time}
                          </p>
                          <Badge
                            variant={
                              visit.status === 'completed'
                                ? 'default'
                                : 'secondary'
                            }
                            className="mt-2"
                          >
                            {getStatusText(visit.status)}
                          </Badge>
                        </div>
                        {renderVisitActions(visit)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-sm text-muted-foreground p-4">
                    Selecione um dia no calendário para ver os detalhes.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      {isEditDialogOpen && (
        <VisitEditDialog
            visit={selectedVisit}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
        />
      )}
    </>
  );
}
