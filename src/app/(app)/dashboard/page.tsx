import {
    Activity,
    ArrowUpRight,
    CircleUser,
    CreditCard,
    DollarSign,
    Menu,
    Package2,
    Search,
    Users,
    Droplets,
    CalendarCheck,
  } from "lucide-react"
  import Link from "next/link"
  
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
  import { DUMMY_CLIENTS, DUMMY_PAYMENTS, DUMMY_VISITS } from "@/lib/placeholder-data"
  
  export default function Dashboard() {
    const todayVisits = DUMMY_VISITS.filter(v => new Date(v.scheduledDate).toDateString() === new Date().toDateString() && v.status === 'pending');
    const totalRevenue = DUMMY_PAYMENTS.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = DUMMY_PAYMENTS.filter(p => p.status === 'pending');
    
    return (
        <>
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl font-headline">Dashboard</h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toLocaleString('en-US')}</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Clients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{DUMMY_CLIENTS.length}</div>
                <p className="text-xs text-muted-foreground">
                  +2 since last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingPayments.length}</div>
                <p className="text-xs text-muted-foreground">
                  ${pendingPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-US')} outstanding
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayVisits.length}</div>
                <p className="text-xs text-muted-foreground">
                  scheduled for today
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                  <CardTitle>Upcoming Visits</CardTitle>
                  <CardDescription>
                    Recent visits from your clients.
                  </CardDescription>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                  <Link href="/schedule">
                    View All
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>
                        Status
                      </TableHead>
                      <TableHead>
                        Date
                      </TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DUMMY_VISITS.filter(v => new Date(v.scheduledDate) >= new Date()).slice(0, 5).map(visit => (
                        <TableRow key={visit.id}>
                            <TableCell>
                                <div className="font-medium">{visit.clientName}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={visit.status === 'completed' ? 'text-green-500 border-green-500' : 'text-amber-500 border-amber-500'}>
                                    {visit.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {new Date(visit.scheduledDate).toLocaleDateString()}
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
                <CardTitle>Recent Clients</CardTitle>
                <CardDescription>
                  You have {DUMMY_CLIENTS.length} active clients.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-8">
                {DUMMY_CLIENTS.slice(0, 5).map(client => (
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
  