import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DUMMY_VISITS } from "@/lib/placeholder-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SchedulePage() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Adjust to Monday

    const days = Array.from({ length: 7 }).map((_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
    });

    const visitsByDay = days.map(day => 
        DUMMY_VISITS.filter(visit => new Date(visit.scheduledDate).toDateString() === day.toDateString())
            .sort((a,b) => a.time.localeCompare(b.time))
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-4">
                     <h1 className="text-lg font-semibold md:text-2xl font-headline">Weekly Schedule</h1>
                     <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                            {startOfWeek.toLocaleDateString(undefined, { month: 'long', day: 'numeric'})} - {days[6].toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric'})}
                        </span>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                     </div>
                </div>
                <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        New Visit
                    </span>
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-7 flex-1 gap-2 items-start">
                {days.map((day, index) => (
                    <div key={day.toISOString()} className="flex flex-col gap-2">
                        <div className="text-center p-2 rounded-lg bg-card">
                            <p className="font-semibold text-sm">{day.toLocaleDateString(undefined, { weekday: 'short' })}</p>
                            <p className="text-2xl font-bold font-headline">{day.getDate()}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            {visitsByDay[index].length > 0 ? visitsByDay[index].map(visit => (
                                <Card key={visit.id} className="w-full">
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-base">{visit.clientName}</CardTitle>
                                        <CardDescription>{visit.time}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <Badge variant={visit.status === 'completed' ? 'default' : 'secondary'}>{visit.status}</Badge>
                                    </CardContent>
                                </Card>
                            )) : (
                                <div className="text-center text-sm text-muted-foreground p-4">No visits</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
