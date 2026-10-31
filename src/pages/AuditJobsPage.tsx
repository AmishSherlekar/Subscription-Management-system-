import React, { useState } from 'react';
import { Clock, Play, CheckCircle2, AlertTriangle, FileText, ShieldCheck } from 'lucide-react';
import { useSystemStore } from '@/store';
import { formatDate } from '@/utils/date';
import type { BillingExecutionJob } from '@/types';

export const AuditJobsPage: React.FC = () => {
  const { billingJobs, runAutomatedRecurringBilling, currentUser } = useSystemStore();

  const [selectedJob, setSelectedJob] = useState<BillingExecutionJob | null>(billingJobs[0] || null);

  const handleRunNow = () => {
    const job = runAutomatedRecurringBilling();
    setSelectedJob(job);
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 m-0">
            Recurring Billing Scheduler & Execution Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cloud Function background task runs, idempotency enforcement, and batch invoice generation logs.
          </p>
        </div>

        {currentUser.role !== 'customer' && (
          <button
            onClick={handleRunNow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-2xs transition-colors self-start"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Trigger Billing Batch Now
          </button>
        )}
      </div>

      {/* Grid: Jobs List on Left, Log Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jobs List */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
            Audit Execution History ({billingJobs.length})
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {billingJobs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No billing jobs recorded yet. Click "Trigger Billing Batch Now" or the top bar button to execute.
              </div>
            ) : (
              billingJobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                return (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`w-full text-left p-3.5 text-xs transition-colors flex items-start justify-between ${
                      isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600 pl-2.5' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        {job.status === 'completed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : job.status === 'failed' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>{new Date(job.runAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(job.runAt).toLocaleDateString()} • {job.type.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-800">
                        +{job.invoicesCreated} Invoices
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {job.subscriptionsEvaluated} Evaluated
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Job Log Output */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800">
                Execution Log: {selectedJob?.id || 'No job selected'}
              </span>
              {selectedJob && (
                <span className="text-slate-500 block text-[11px]">
                  Timestamp: {new Date(selectedJob.runAt).toISOString()}
                </span>
              )}
            </div>
            {selectedJob && (
              <span className="px-2.5 py-0.5 rounded text-[11px] font-medium uppercase font-mono bg-white border border-slate-200 text-slate-700">
                Status: {selectedJob.status}
              </span>
            )}
          </div>

          <div className="p-4 flex-1 bg-slate-950 font-mono text-xs text-slate-200 overflow-y-auto max-h-[480px] space-y-1">
            {!selectedJob ? (
              <span className="text-slate-500">Select a billing job to view the execution log...</span>
            ) : (
              selectedJob.details.map((line, idx) => {
                let color = 'text-slate-300';
                if (line.includes('[SUCCESS]')) color = 'text-emerald-400';
                if (line.includes('[SKIP]')) color = 'text-amber-400';
                if (line.includes('[ERROR]')) color = 'text-rose-400';
                if (line.includes('[START]')) color = 'text-blue-400';

                return (
                  <div key={idx} className={color}>
                    {line}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Idempotency Key Pattern: <code>SUB_ID_PERIODSTART_PERIODEND</code>
            </span>
            <span className="text-slate-400 text-[11px]">Strict Duplicate Prevention Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
