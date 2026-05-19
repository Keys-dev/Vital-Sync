import { useState }          from 'react';
import { useAccessRequests } from '@/hooks/useDoctorData';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_CFG = {
  pending:  { label: 'Pending',  cls: 'bg-status-warning/10 border-status-warning/30 text-status-warning' },
  approved: { label: 'Approved', cls: 'bg-status-stable/10 border-status-stable/30 text-status-stable'   },
  rejected: { label: 'Rejected', cls: 'bg-status-critical/10 border-status-critical/30 text-status-critical' },
};

export default function AccessRequests() {
  const {
    requests, loading, error,
    updating, pendingCount, updateRequestStatus,
  } = useAccessRequests();

  const [filter, setFilter] = useState<Filter>('pending');

  const filtered = filter === 'all'
    ? requests
    : requests.filter((r) => r.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-700 text-text-primary tracking-tight">
            Access Requests
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Approve or reject family members requesting access to your patients' vitals.
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-status-warning/10 border border-status-warning/30
            rounded-xl px-4 py-2 text-sm font-mono font-semibold text-status-warning">
            <Clock size={14} />
            {pendingCount} awaiting review
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as Filter[]).map((f) => {
          const count = f === 'all'
            ? requests.length
            : requests.filter((r) => r.status === f).length;
          return (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold
                border transition-all duration-150
                ${filter === f
                  ? 'bg-accent-cyan/10 border-accent-cyan/25 text-accent-cyan'
                  : 'bg-bg-surface border-border text-text-muted hover:text-text-secondary'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px]
                ${filter === f ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-bg-elevated text-text-muted'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      {loading && (
        <div className="bg-bg-surface border border-border rounded-xl p-10 text-center">
          <p className="text-sm font-mono text-text-muted">Loading requests…</p>
        </div>
      )}

      {error && (
        <div className="bg-status-critical/5 border border-status-critical/20 rounded-xl p-4">
          <p className="text-sm font-mono text-status-critical">Error: {error}</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="bg-bg-surface border border-dashed border-border rounded-xl p-10 text-center">
          <Users size={28} className="text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm font-mono text-text-muted">
            No {filter === 'all' ? '' : filter} requests.
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  {['Family Member', 'Patient', 'Date', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-[11px] font-mono font-semibold
                      text-text-muted uppercase tracking-widest px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => {
                  const cfg        = STATUS_CFG[req.status];
                  const isUpdating = updating === req.id;
                  const initials   = req.requester_name
                    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
                  const date = new Date(req.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  });

                  return (
                    <tr key={req.id} className="border-b border-border/50 hover:bg-bg-elevated/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-teal/10 border border-accent-teal/20
                            flex items-center justify-center text-[11px] font-bold font-mono text-accent-teal flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{req.requester_name}</p>
                            <p className="text-[11px] font-mono text-text-muted">{req.requester_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-text-primary">{req.patient_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[11px] font-mono text-text-muted">{date}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center border rounded-full px-2.5 py-0.5
                          text-[11px] font-mono font-semibold ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {req.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateRequestStatus(req.id, 'approved')}
                              disabled={isUpdating}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold
                                bg-status-stable/10 border border-status-stable/30 text-status-stable
                                hover:bg-status-stable/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <CheckCircle size={12} />
                              {isUpdating ? '…' : 'Approve'}
                            </button>
                            <button
                              onClick={() => updateRequestStatus(req.id, 'rejected')}
                              disabled={isUpdating}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold
                                bg-status-critical/10 border border-status-critical/25 text-status-critical
                                hover:bg-status-critical/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <XCircle size={12} />
                              {isUpdating ? '…' : 'Reject'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}