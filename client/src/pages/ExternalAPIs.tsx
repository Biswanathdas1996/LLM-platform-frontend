import { ExternalAPIConfig } from '@/components/Dashboard/ExternalAPIConfig';

export default function ExternalAPIs() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          External APIs
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Configure external LLM API integrations
        </p>
      </div>

      <div className="max-w-2xl">
        <ExternalAPIConfig />
      </div>
    </div>
  );
}
