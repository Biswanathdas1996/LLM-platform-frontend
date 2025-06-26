import { PlayCircle, Upload, RotateCcw, Plug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const activities = [
  {
    id: 1,
    type: 'generation',
    icon: PlayCircle,
    iconColor: 'text-blue-500',
    description: 'Text generation completed',
    model: 'Llama-3.2-3B',
    timestamp: '2 minutes ago',
  },
  {
    id: 2,
    type: 'upload',
    icon: Upload,
    iconColor: 'text-emerald-500',
    description: 'Model uploaded successfully',
    model: 'new-model.gguf',
    timestamp: '15 minutes ago',
  },
  {
    id: 3,
    type: 'sync',
    icon: RotateCcw,
    iconColor: 'text-blue-500',
    description: 'Models synchronized',
    model: '3 models found',
    timestamp: '1 hour ago',
  },
  {
    id: 4,
    type: 'api',
    icon: Plug,
    iconColor: 'text-purple-500',
    description: 'External API configured',
    model: 'GPT-4 Turbo',
    timestamp: '2 hours ago',
  },
];

export function RecentActivity() {
  return (
    <Card className="relative overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-purple-500/3 to-teal-500/3 opacity-50" />
      
      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
            <PlayCircle className="h-4 w-4 text-white" />
          </div>
          Recent Activity
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 relative z-10">
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            
            return (
              <div 
                key={activity.id} 
                className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-muted/20 to-muted/10 border border-border/30 hover:border-primary/20 transition-all duration-300 hover:shadow-md p-3"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-purple-500/3 to-teal-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-300">
                        {activity.description}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {activity.timestamp}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {activity.model}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                      <div className="flex items-center space-x-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          activity.type === 'generation' ? 'bg-blue-400' :
                          activity.type === 'upload' ? 'bg-emerald-400' :
                          activity.type === 'sync' ? 'bg-blue-400' :
                          'bg-purple-400'
                        } animate-pulse`} />
                        <span className="text-xs text-muted-foreground capitalize">
                          {activity.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Progress indicator */}
                <div className="mt-2 w-full bg-muted/30 rounded-full h-0.5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${100 - (index * 15)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
