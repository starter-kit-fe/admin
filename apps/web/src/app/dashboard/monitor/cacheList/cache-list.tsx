'use client';

import { CacheListDataSection } from './components/cache-list-data-section';
import { CacheManagementHeader } from './components/cache-management-header';
import { CacheListFiltersSection } from './components/filters/cache-list-filters-section';

export function CacheList() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <CacheManagementHeader />
      {/* <section className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-none dark:border-border/40">
        <CacheListFiltersSection />
      </section> */}
      <CacheListDataSection />
    </div>
  );
}
