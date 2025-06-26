import { StatsGrid } from '@/components/Dashboard/StatsGrid';
import { ModelUpload } from '@/components/Dashboard/ModelUpload';
import { ExternalAPIConfig } from '@/components/Dashboard/ExternalAPIConfig';
import { ModelsList } from '@/components/Dashboard/ModelsList';
import { RecentActivity } from '@/components/Dashboard/RecentActivity';
import { Analytics } from '@/components/Dashboard/Analytics';

export default function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Manage your local and external LLM models
        </p>
      </div>

      <div className="space-y-8">
        <StatsGrid />

        <Analytics />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ModelUpload />
          <ExternalAPIConfig />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ModelsList />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
