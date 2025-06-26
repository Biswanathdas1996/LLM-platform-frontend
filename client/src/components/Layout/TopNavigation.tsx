import { Brain, Moon, Sun, Settings, Activity, Cpu, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useHealth } from '@/hooks/useLocalAPI';

export function TopNavigation() {
  const { theme, toggleTheme } = useTheme();
  const { data: health, isLoading: healthLoading } = useHealth();

  const isHealthy = health?.status === 'healthy';

  return (
    <nav className="glass-effect border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center group">
              <div className="relative">
                <Brain className="text-primary h-8 w-8 mr-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" />
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold mono bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  LLM.PLATFORM
                </h1>
                <p className="text-xs text-muted-foreground mono hidden sm:block tracking-wider">
                  v2.1.0 • NEURAL INTERFACE
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* System Metrics */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-muted/30 border border-border/30">
                <Activity className="h-3 w-3 text-emerald-400" />
                <span className="text-xs mono text-muted-foreground">CPU 23%</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-muted/30 border border-border/30">
                <HardDrive className="h-3 w-3 text-blue-400" />
                <span className="text-xs mono text-muted-foreground">RAM 2.1GB</span>
              </div>
            </div>
            
            {/* API Status */}
            <div className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-muted/50 border border-border/50 shadow-tech">
              <div className="flex items-center space-x-2">
                <div className={`status-indicator transition-all duration-300 ${
                  healthLoading 
                    ? 'bg-amber-400 animate-pulse' 
                    : isHealthy 
                      ? 'bg-emerald-400' 
                      : 'bg-red-400'
                }`} />
                <span className="text-sm font-medium mono text-foreground">
                  {healthLoading 
                    ? 'SYS_CHECK' 
                    : isHealthy 
                      ? 'ONLINE' 
                      : 'OFFLINE'
                  }
                </span>
              </div>
              {isHealthy && (
                <div className="h-4 w-px bg-border" />
              )}
              {isHealthy && (
                <span className="text-xs mono text-muted-foreground">
                  127.0.0.1:5000
                </span>
              )}
            </div>
            
            {/* Control Panel */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-9 w-9 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/50 transition-all duration-200 hover:scale-105 hover:shadow-glow"
              >
                {theme === 'dark' ? 
                  <Sun className="h-4 w-4 text-amber-500" /> : 
                  <Moon className="h-4 w-4 text-blue-600" />
                }
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/50 transition-all duration-200 hover:scale-105 hover:shadow-glow"
              >
                <Settings className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animated border line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
    </nav>
  );
}
