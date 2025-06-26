import { StatsGrid } from '@/components/Dashboard/StatsGrid';
import { ModelUpload } from '@/components/Dashboard/ModelUpload';
import { ExternalAPIConfig } from '@/components/Dashboard/ExternalAPIConfig';
import { ModelsList } from '@/components/Dashboard/ModelsList';
import { RecentActivity } from '@/components/Dashboard/RecentActivity';

export default function Dashboard() {
  return (
    <div className="space-y-8 relative">
      {/* Technical Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 p-8 border border-primary/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm mono text-primary font-medium">SYSTEM OPERATIONAL</span>
          </div>
          <h1 className="text-5xl font-bold mono bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
            NEURAL.DASHBOARD
          </h1>
          <p className="text-lg text-muted-foreground mono max-w-3xl mx-auto tracking-wide">
            Advanced LLM Model Management • Real-time Analytics • Neural Interface v2.1.0
          </p>
          <div className="flex items-center justify-center space-x-6 mt-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow" />
              <span className="text-xs mono text-muted-foreground">API_ONLINE</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 shadow-glow" />
              <span className="text-xs mono text-muted-foreground">DB_CONNECTED</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 shadow-glow" />
              <span className="text-xs mono text-muted-foreground">NEURAL_ACTIVE</span>
            </div>
          </div>
        </div>
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
