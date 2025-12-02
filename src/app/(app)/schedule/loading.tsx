'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function ScheduleLoading() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7 flex-1 gap-2 items-start">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="text-center p-2 rounded-lg">
                <Skeleton className="h-6 w-12 mx-auto mb-2" />
                <Skeleton className="h-8 w-8 mx-auto" />
            </div>
            <div className="flex flex-col gap-2 min-h-[100px] flex-1">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
