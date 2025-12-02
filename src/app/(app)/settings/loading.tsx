'use client';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
        <div className="flex items-center">
            <Skeleton className="h-9 w-48" />
        </div>
        <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-sm" />

            <div className="space-y-6">
                <div className="border rounded-lg">
                    <div className='p-6 space-y-2'>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-full max-w-md" />
                    </div>
                    <div className='p-6'>
                        <Skeleton className="h-12 w-full max-w-sm" />
                    </div>
                </div>
                <div className="border rounded-lg">
                    <div className='p-6 space-y-2'>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-full max-w-md" />
                    </div>
                    <div className='p-6 space-y-4'>
                        <Skeleton className="h-12 w-full max-w-sm" />
                        <Skeleton className="h-20 w-full max-w-md" />
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
