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
    <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700">
        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
          Recent Activity
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <Icon className={`h-4 w-4 ${activity.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-900 dark:text-white">
                    {activity.description}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activity.model}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
