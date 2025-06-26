import { ExternalAPIConfig } from '@/components/Dashboard/ExternalAPIConfig';

export default function ExternalAPIs() {
  return (
    <div className="space-y-8">
      {/* Technical Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 p-8 border border-cyan-500/20">
        <div className="absolute inset-0 tech-grid opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-glow" />
              <span className="text-sm mono text-cyan-400 font-medium">API_GATEWAY</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-glow" />
                <span className="text-xs mono text-muted-foreground">CONFIG_MODE</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow" />
                <span className="text-xs mono text-muted-foreground">SECURE_CHANNEL</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-bold mono bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              API.INTEGRATION
            </h1>
            <p className="text-lg text-muted-foreground mono max-w-3xl tracking-wide">
              External Service Configuration • API Key Management • Endpoint Routing • Protocol Bridging
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <ExternalAPIConfig />
      </div>
    </div>
  );
}
