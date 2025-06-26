import { 
  LayoutDashboard, 
  Box, 
  PlayCircle, 
  Plug, 
  HardDrive, 
  RotateCcw, 
  Trash2,
  FileText,
  Server,
  BookOpen
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useModels, useSyncModels, useClearCache } from '@/hooks/useLocalAPI';
import { useNotifications } from '@/hooks/useNotifications';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Models', href: '/models', icon: Box },
  { name: 'Playground', href: '/playground', icon: PlayCircle },
  { name: 'External APIs', href: '/external-apis', icon: Plug },
  { name: 'Cache Status', href: '/cache', icon: HardDrive },
  { name: 'API Docs', href: '/api-docs', icon: BookOpen },
  { name: 'External Logs', href: '/external-logs', icon: Server },
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: modelsData } = useModels();
  const syncMutation = useSyncModels();
  const clearCacheMutation = useClearCache();
  const { addNotification } = useNotifications();

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync();
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Models synchronized successfully',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to sync models',
      });
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCacheMutation.mutateAsync();
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Cache cleared successfully',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to clear cache',
      });
    }
  };

  return (
    <aside className="w-80 glass-effect border-r border-border/50 min-h-screen backdrop-blur-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/2 to-transparent" />
      
      <nav className="mt-6 px-6 relative z-10 space-y-6">
        {/* System Status Header */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/20 border border-border/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs mono text-muted-foreground uppercase tracking-wider font-bold">
                NEURAL_CORE
              </span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-glow" />
                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-glow" />
                <div className="w-2 h-2 rounded-full bg-red-400 shadow-glow" />
              </div>
            </div>
            <div className="text-xs mono text-foreground font-medium">
              SYSTEM OPERATIONAL
            </div>
            <div className="text-xs mono text-muted-foreground">
              127.0.0.1:5000 • SECURED
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <div className="space-y-1">
          <div className="px-4 pb-2">
            <span className="text-xs mono text-muted-foreground uppercase tracking-wider font-bold">
              PRIMARY_NAV
            </span>
          </div>

          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div className={`
                  group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 cursor-pointer relative overflow-hidden
                  ${isActive 
                    ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/30 shadow-tech' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent hover:border-border/50 hover:shadow-tech'
                  }
                `}>
                  {isActive && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-purple-600 rounded-r-full shadow-glow" />
                    </>
                  )}
                  
                  <div className={`mr-3 p-2 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary/20 shadow-inner' 
                      : 'bg-muted/30 group-hover:bg-primary/10'
                  }`}>
                    <Icon className={`h-4 w-4 transition-all duration-300 ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary group-hover:scale-110'
                    }`} />
                  </div>
                  
                  <span className="relative z-10 flex-1 mono">{item.name.toUpperCase()}</span>
                  
                  {item.name === 'Models' && modelsData && (
                    <div className={`ml-auto relative z-10 px-2 py-1 text-xs mono rounded-md border ${
                      isActive 
                        ? 'bg-primary/20 border-primary/30 text-primary' 
                        : 'bg-muted/50 border-border/50 text-muted-foreground'
                    }`}>
                      {modelsData.count.toString().padStart(2, '0')}
                    </div>
                  )}
                  
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        
        {/* System Operations */}
        <div className="space-y-1">
          <div className="px-4 pb-2 border-t border-border/50 pt-4">
            <span className="text-xs mono text-muted-foreground uppercase tracking-wider font-bold">
              SYS_OPERATIONS
            </span>
          </div>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-xl px-4 py-3 transition-all duration-300 border border-transparent hover:border-border/50 hover:shadow-tech group"
              onClick={handleSync}
              disabled={syncMutation.isPending}
            >
              <div className="mr-3 p-2 rounded-lg bg-muted/30 group-hover:bg-gradient-terminal transition-all duration-300">
                <RotateCcw className={`h-4 w-4 transition-all duration-300 ${
                  syncMutation.isPending ? 'animate-spin text-emerald-400' : 'group-hover:rotate-180 group-hover:text-white'
                }`} />
              </div>
              <span className="mono">SYNC_MODELS</span>
              {syncMutation.isPending && (
                <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-xl px-4 py-3 transition-all duration-300 border border-transparent hover:border-border/50 hover:shadow-tech group"
              onClick={handleClearCache}
              disabled={clearCacheMutation.isPending}
            >
              <div className="mr-3 p-2 rounded-lg bg-muted/30 group-hover:bg-gradient-to-r group-hover:from-red-500 group-hover:to-red-600 transition-all duration-300">
                <Trash2 className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-white" />
              </div>
              <span className="mono">CLEAR_CACHE</span>
              {clearCacheMutation.isPending && (
                <div className="ml-auto w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              )}
            </Button>
          </div>
        </div>

        {/* Resource Monitor */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-muted/20 to-muted/10 border border-border/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
          <div className="relative z-10">
            <div className="px-0 pb-3">
              <span className="text-xs mono text-muted-foreground uppercase tracking-wider font-bold">
                SYSTEM_MONITOR
              </span>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs mono text-muted-foreground">CPU_USAGE</span>
                  <span className="text-xs mono text-emerald-400 font-bold">23%</span>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-1.5 rounded-full" style={{width: '23%'}}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs mono text-muted-foreground">MEMORY</span>
                  <span className="text-xs mono text-blue-400 font-bold">2.1GB</span>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-1.5 rounded-full" style={{width: '45%'}}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs mono text-muted-foreground">STORAGE</span>
                  <span className="text-xs mono text-purple-400 font-bold">156GB</span>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-purple-400 to-purple-500 h-1.5 rounded-full" style={{width: '67%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-muted/20 to-muted/10 border border-border/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5" />
          <div className="relative z-10">
            <div className="px-0 pb-3">
              <span className="text-xs mono text-muted-foreground uppercase tracking-wider font-bold">
                SYSTEM_INFO
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs mono text-muted-foreground">UPTIME</span>
                <span className="text-xs mono text-foreground font-bold">04:23:15</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs mono text-muted-foreground">VERSION</span>
                <span className="text-xs mono text-foreground font-bold">2.1.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs mono text-muted-foreground">NODE_ENV</span>
                <span className="text-xs mono text-emerald-400 font-bold">DEV</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs mono text-muted-foreground">MODELS</span>
                <span className="text-xs mono text-blue-400 font-bold">{modelsData?.count || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs mono text-muted-foreground">PROTOCOLS</span>
                <span className="text-xs mono text-purple-400 font-bold">HTTP/WS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-muted/20 to-muted/10 border border-border/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />
          <div className="relative z-10">
            <div className="px-0 pb-3">
              <span className="text-xs mono text-muted-foreground uppercase tracking-wider font-bold">
                NETWORK_STATUS
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs mono text-muted-foreground">API_SERVER</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow" />
                  <span className="text-xs mono text-emerald-400 font-bold">ONLINE</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs mono text-muted-foreground">DATABASE</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 shadow-glow" />
                  <span className="text-xs mono text-blue-400 font-bold">CONNECTED</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs mono text-muted-foreground">WEBSOCKET</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 shadow-glow" />
                  <span className="text-xs mono text-purple-400 font-bold">ACTIVE</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/30">
                <span className="text-xs mono text-muted-foreground">LATENCY</span>
                <span className="text-xs mono text-emerald-400 font-bold">12ms</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
