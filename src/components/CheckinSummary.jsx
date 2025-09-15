import React, { useEffect, useState } from 'react';

function CheckinSummary({ airlineHint }) {
  const [links, setLinks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!airlineHint) return;
    let mounted = true;
    setLoading(true); setError('');
    fetch(`/api/checkin/${encodeURIComponent(airlineHint)}`)
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || 'Failed'); return d; })
      .then((d) => { if (mounted) setLinks(d.data || []); })
      .catch((e) => { if (mounted) setError(e.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [airlineHint]);

  if (!airlineHint) return null;

  return (
    <div className="summary-card">
      <div className="summary-title">🛫 Airline check-in</div>
      {loading && <div className="summary-loading">Loading...</div>}
      {error && <div className="summary-error">{error}</div>}
      {!loading && !error && links.length > 0 && (
        <div className="summary-list">
          {links.map((l,i) => (
            <a key={i} className="summary-link" href={l.href} target="_blank" rel="noreferrer">{l.type}</a>
          ))}
        </div>
      )}
    </div>
  );
}

export default CheckinSummary;


