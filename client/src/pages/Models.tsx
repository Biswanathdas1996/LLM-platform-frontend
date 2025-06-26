import { ModelsList } from '@/components/Dashboard/ModelsList';
import { ModelUpload } from '@/components/Dashboard/ModelUpload';

export default function Models() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Models
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Manage your local model files
        </p>
      </div>

      <div className="space-y-8">
        <ModelUpload />
        <ModelsList />
      </div>
    </div>
  );
}
