'use client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ProductsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-1/3" />
            <div className='flex gap-2'>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-36" />
            </div>
        </div>
        <div className="border rounded-lg p-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
