import { StatsGrid } from '@/components/Dashboard/StatsGrid';
import { ModelUpload } from '@/components/Dashboard/ModelUpload';
import { ExternalAPIConfig } from '@/components/Dashboard/ExternalAPIConfig';
import { ModelsList } from '@/components/Dashboard/ModelsList';
import { RecentActivity } from '@/components/Dashboard/RecentActivity';

export default function Dashboard() {
  return (
    <div className="space-y-4 sm:space-y-6 relative">
      {/* Compact Technical Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 p-4 sm:p-6 border border-primary/20">
        <div className="absolute inset-0 tech-grid opacity-10" />
        <div className="relative z-10 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-primary font-medium">System Operational</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
            Neural Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Advanced LLM Model Management • Real-time Analytics
          </p>
          <div className="flex items-center justify-center space-x-3 sm:space-x-4 mt-4">
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-muted-foreground">API Online</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-xs text-muted-foreground">Connected</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <StatsGrid />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ModelUpload />
          <ExternalAPIConfig />
        </div>

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
