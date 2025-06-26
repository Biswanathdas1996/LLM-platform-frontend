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
    <aside className="w-64 border-r bg-card/95 backdrop-blur-sm h-screen hidden lg:block relative border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5" />
      <nav className="p-4 space-y-6 relative z-10 h-full flex flex-col overflow-hidden">
        {/* Primary Navigation */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer
                    ${isActive 
                      ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg border border-primary/20' 
                      : 'text-muted-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:text-foreground hover:shadow-sm'
                    }
                  `}>
                    <Icon className="h-4 w-4 mr-3" />
                    <span className="flex-1">{item.name}</span>
                    
                    {item.name === 'Models' && modelsData && (
                      <Badge 
                        variant={isActive ? "secondary" : "outline"} 
                        className={`ml-2 text-xs ${isActive ? 'bg-white/20 text-white border-white/30' : ''}`}
                      >
                        {modelsData.count}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="space-y-2 pt-4 border-t border-border/50 flex-shrink-0">
          <h3 className="text-xs font-medium text-muted-foreground px-3 mb-2 uppercase tracking-wider">Quick Actions</h3>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 hover:from-emerald-500/20 hover:to-cyan-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
            onClick={handleSync}
            disabled={syncMutation.isPending}
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync Models
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start bg-gradient-to-r from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20 border-orange-500/30 text-orange-600 dark:text-orange-400"
            onClick={handleClearCache}
            disabled={clearCacheMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </nav>
    </aside>
  );
}
