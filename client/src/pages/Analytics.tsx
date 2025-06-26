import { AnalyticsDashboard } from '@/components/Dashboard/AnalyticsDashboard';

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl border border-indigo-200 dark:border-indigo-800 mb-8">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-white/5"></div>
        
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    Analytics Dashboard
                  </h1>
                  <p className="text-indigo-100 mt-1 text-lg">
                    Comprehensive data visualization and insights
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white font-medium">Real-time Analytics</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-white font-medium">Multi-dimensional Views</span>
                </div>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4 text-right">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-white">∞</div>
                  <div className="text-xs text-indigo-200 uppercase tracking-wider">Data Points</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-xs text-indigo-200 uppercase tracking-wider">Monitoring</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnalyticsDashboard />
    </div>
  );
}