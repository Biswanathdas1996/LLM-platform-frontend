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
  { name: 'Live Logs', href: '/logs', icon: FileText },
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
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-h-screen">
      <nav className="mt-8 px-4">
        <div className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer
                  ${isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                  }
                `}>
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                  {item.name === 'Models' && modelsData && (
                    <Badge variant="secondary" className="ml-auto">
                      {modelsData.count}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="px-3 mb-4">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Quick Actions
            </h3>
          </div>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
              onClick={handleSync}
              disabled={syncMutation.isPending}
            >
              <RotateCcw className="mr-3 h-5 w-5" />
              Sync Models
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
              onClick={handleClearCache}
              disabled={clearCacheMutation.isPending}
            >
              <Trash2 className="mr-3 h-5 w-5" />
              Clear Cache
            </Button>
          </div>
        </div>
      </nav>
    </aside>
  );
}
