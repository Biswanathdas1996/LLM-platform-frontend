import { StatsGrid } from '@/components/Dashboard/StatsGrid';
import { ModelUpload } from '@/components/Dashboard/ModelUpload';
import { ExternalAPIConfig } from '@/components/Dashboard/ExternalAPIConfig';
import { ModelsList } from '@/components/Dashboard/ModelsList';
import { RecentActivity } from '@/components/Dashboard/RecentActivity';

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage your local and external LLM models with advanced analytics and monitoring
        </p>
      </div>

      <div className="space-y-8">
        <StatsGrid />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <ModelUpload />
          <ExternalAPIConfig />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <ModelsList />
          </div>
          <div className="xl:col-span-1">
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
