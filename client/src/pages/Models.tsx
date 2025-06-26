import { ModelsList } from '@/components/Dashboard/ModelsList';
import { ModelUpload } from '@/components/Dashboard/ModelUpload';

export default function Models() {
  return (
    <div className="space-y-8">
      {/* Technical Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 p-8 border border-purple-500/20">
        <div className="absolute inset-0 tech-grid opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-glow" />
              <span className="text-sm mono text-purple-400 font-medium">MODEL_MANAGER</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow" />
                <span className="text-xs mono text-muted-foreground">STORAGE_READY</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-glow" />
                <span className="text-xs mono text-muted-foreground">SYNC_ENABLED</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-bold mono bg-gradient-to-r from-purple-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
              MODEL.REPOSITORY
            </h1>
            <p className="text-lg text-muted-foreground mono max-w-3xl tracking-wide">
              Neural Model Management • File Operations • Repository Synchronization • Version Control
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <ModelUpload />
        <ModelsList />
      </div>
    </div>
  );
}
