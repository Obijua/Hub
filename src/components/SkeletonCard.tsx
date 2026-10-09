import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
      <div className="aspect-video bg-gray-200 dark:bg-gray-800" />
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-6 w-full bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-6 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
        <div className="flex justify-between items-center pt-4">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonList = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
