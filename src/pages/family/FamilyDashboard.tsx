import { useState }      from 'react';
import { useNavigate }   from 'react-router-dom';
import { useFamilyData } from '@/hooks/useFamilyData';
import { useProfile }    from '@/hooks/useProfile';
import { Search, Send, Clock, CheckCircle, XCircle, Activity } from 'lucide-react';

const STATUS_CFG = {
  pending:  { label: 'Pending approval', cls: 'bg-status-warning/10 border-status-warning/30 text-status-warning', Icon: Clock         },
  approved: { label: 'Access approved',  cls: 'bg-status-stable/10 border-status-stable/30 text-status-stable',   Icon: CheckCircle   },
  rejected: { label: 'Request rejected', cls: 'bg-status-critical/10 border-status-critical/25 text-status-critical', Icon: XCircle   },
};

export default function FamilyDashboard() {
  const { profile }       = useProfile();
  const navigate          = useNavigate();
  const {
    myRequests, approvedPatients, allPatients,
    loading, submitting, submitRequest,
  } = useFamilyData();

  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState('');
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const requestedIds = new Set(myRequests.map((r) => r.patient_id));
  const filtered     = allPatients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) && !requestedIds.has(p.id)
  );

  const handleRequest = async () => {
    if (!selected) return;
    const result = await submitRequest(selected);
    if (result === 'ok') {
      setFeedback({ msg: 'Request submitted! Your doctor will review it shortly.', ok: true });
      setSelected(''); setShowForm(false); setSearch('');
    } else if (result === 'duplicate') {
      setFeedback({ msg: 'You already have a request for this patient.', ok: false });
    } else {
      setFeedback({ msg: 'Something went wrong. Please try again.', ok: false });
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-mono text-text-muted">{greeting},</p>
          <h1 className="font-display text-2xl font-700 text-text-primary tracking-tight mt-0.5">
            {profile?.full_name?.split(' ')[0]}
          </h1>
        </div>
        <button
          onClick={() => setShowForm((f) => !f)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold font-mono
            bg-accent-teal/10 border border-accent-teal/30 text-accent-teal
            hover:bg-accent-teal/15 transition-all"
        >
          {showForm ? '✕ Cancel' : '+ Request Patient Access'}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-mono font-semibold border
          ${feedback.ok
            ? 'bg-status-stable/10 border-status-stable/30 text-status-stable'
            : 'bg-status-warning/10 border-status-warning/30 text-status-warning'}`}>
          {feedback.msg}
        </div>
      )}

      {/* Request form */}
      {showForm && (
        <div className="bg-bg-surface border border-border rounded-xl p-5 space-y-4">
          <div>
            <h2 className="font-display text-base font-700 text-text-primary">Find Your Relative</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Search by name and submit a request. Their doctor will approve it.
            </p>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search patient name…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelected(''); }}
              className="w-full bg-bg-elevated border border-border rounded-xl pl-9 pr-4 py-2.5
                text-sm text-text-primary font-mono placeholder:text-text-muted
                outline-none focus:ring-2 focus:ring-accent-teal/30 focus:border-accent-teal/60 transition-all"
            />
          </div>

          {search.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden">
              {filtered.length === 0 ? (
                <p className="text-xs font-mono text-text-muted p-3">No matching patients found.</p>
              ) : (
                filtered.map((p) => (
                  <button key={p.id}
                    onClick={() => setSelected(p.id)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors
                      border-b border-border/50 last:border-0
                      ${selected === p.id
                        ? 'bg-accent-teal/10 border-l-2 border-l-accent-teal'
                        : 'hover:bg-bg-elevated'}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-accent-teal/10 flex items-center justify-center
                      text-[10px] font-bold font-mono text-accent-teal flex-shrink-0">
                      {p.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <span className="text-sm text-text-primary">{p.full_name}</span>
                    {selected === p.id && (
                      <CheckCircle size={14} className="ml-auto text-accent-teal flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          <button
            onClick={handleRequest}
            disabled={!selected || submitting}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
              text-sm font-semibold font-mono bg-accent-teal text-white
              hover:bg-accent-teal-dim active:scale-[0.98]
              disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send size={14} />
            {submitting ? 'Submitting…' : 'Submit Access Request'}
          </button>
        </div>
      )}

      {/* Approved patients */}
      {!loading && approvedPatients.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
            Your Patients
            <span className="bg-bg-elevated border border-border rounded-full px-2 py-0.5
              text-[10px] font-mono text-text-muted">
              {approvedPatients.length}
            </span>
          </h2>
          {approvedPatients.map((r) => (
            <div key={r.id}
              className="flex items-center gap-4 bg-bg-surface border border-status-stable/20
                rounded-xl p-4 hover:border-status-stable/35 transition-all">
              <div className="w-10 h-10 rounded-full bg-accent-teal/10 border border-accent-teal/20
                flex items-center justify-center text-sm font-bold font-mono text-accent-teal flex-shrink-0">
                {r.patient_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{r.patient_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-stable vital-pulse" />
                  <span className="text-[11px] font-mono text-status-stable">Access granted</span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/family/patient/${r.patient_id}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold
                  bg-accent-teal/10 border border-accent-teal/30 text-accent-teal
                  hover:bg-accent-teal/15 transition-all flex-shrink-0"
              >
                <Activity size={12} />
                Monitor
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Request history */}
      {!loading && myRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
            Request History
            <span className="bg-bg-elevated border border-border rounded-full px-2 py-0.5
              text-[10px] font-mono text-text-muted">
              {myRequests.length}
            </span>
          </h2>
          <div className="bg-bg-surface border border-border rounded-xl overflow-hidden">
            {myRequests.map((r) => {
              const cfg = STATUS_CFG[r.status];
              return (
                <div key={r.id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center
                    text-[10px] font-bold font-mono text-text-muted flex-shrink-0">
                    {r.patient_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <p className="flex-1 text-sm text-text-primary font-medium">{r.patient_name}</p>
                  <span className={`inline-flex items-center gap-1 border rounded-full px-2.5 py-0.5
                    text-[10px] font-mono font-semibold ${cfg.cls}`}>
                    <cfg.Icon size={10} />
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && myRequests.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center gap-3
          bg-bg-surface border border-dashed border-border rounded-xl py-16 text-center">
          <Activity size={32} className="text-text-muted opacity-30" />
          <p className="font-display text-base font-700 text-text-muted">No patient access yet</p>
          <p className="text-xs text-text-muted max-w-xs leading-relaxed">
            Click "Request Patient Access" to find your relative and submit a request.
          </p>
        </div>
      )}
    </div>
  );
}