import { 
  LayoutDashboard, 
  Box, 
  PlayCircle, 
  Plug, 
  HardDrive, 
  RotateCcw, 
  Trash2,
  FileText,
  Server
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
    <aside className="w-72 glass-effect border-r border-border/50 min-h-screen backdrop-blur-xl">
      <nav className="mt-6 px-6">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div className={`
                  group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer relative overflow-hidden
                  ${isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent hover:border-border/50'
                  }
                `}>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
                  )}
                  <Icon className={`mr-3 h-5 w-5 transition-all duration-200 ${
                    isActive ? 'text-primary' : 'group-hover:scale-110'
                  }`} />
                  <span className="relative z-10 flex-1">{item.name}</span>
                  {item.name === 'Models' && modelsData && (
                    <Badge 
                      variant={isActive ? "default" : "secondary"} 
                      className="ml-auto relative z-10 px-2 py-1 text-xs"
                    >
                      {modelsData.count}
                    </Badge>
                  )}
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        
        <div className="mt-8 pt-6 border-t border-border/50">
          <div className="px-4 mb-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Quick Actions
            </h3>
          </div>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-xl px-4 py-3 transition-all duration-200 border border-transparent hover:border-border/50"
              onClick={handleSync}
              disabled={syncMutation.isPending}
            >
              <RotateCcw className={`mr-3 h-5 w-5 transition-all duration-200 ${
                syncMutation.isPending ? 'animate-spin' : 'group-hover:rotate-180'
              }`} />
              <span>Sync Models</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-xl px-4 py-3 transition-all duration-200 border border-transparent hover:border-border/50"
              onClick={handleClearCache}
              disabled={clearCacheMutation.isPending}
            >
              <Trash2 className="mr-3 h-5 w-5 transition-all duration-200 group-hover:scale-110" />
              <span>Clear Cache</span>
            </Button>
          </div>
        </div>
      </nav>
    </aside>
  );
}
