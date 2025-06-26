import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Notification } from '@/hooks/useNotifications';

interface NotificationProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
};

export function NotificationComponent({ notification, onRemove }: NotificationProps) {
  const Icon = iconMap[notification.type];
  const iconColor = colorMap[notification.type];

  return (
    <Card className="w-full max-w-sm p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {notification.title}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {notification.message}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-3 h-6 w-6 p-0"
          onClick={() => onRemove(notification.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

export function NotificationContainer({ notifications, onRemove }: {
  notifications: Notification[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {notifications.map((notification) => (
        <NotificationComponent
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
