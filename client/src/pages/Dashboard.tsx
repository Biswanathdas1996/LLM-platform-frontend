import { StatsGrid } from '@/components/Dashboard/StatsGrid';
import { ModelsList } from '@/components/Dashboard/ModelsList';
import { RecentActivity } from '@/components/Dashboard/RecentActivity';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Modern Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Monitor your LLM models and system performance</p>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <StatsGrid />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <ModelsList />
          </div>
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
