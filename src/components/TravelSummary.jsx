import React, { useEffect, useState } from 'react';

function TravelSummary({ city }) {
  const [destinations, setDestinations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) return;
    let mounted = true;
    setLoading(true); setError('');
    fetch(`/api/travel/${encodeURIComponent(city)}`)
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || 'Failed'); return d; })
      .then((d) => { if (mounted) setDestinations((d.data || []).map(x => x.destination).slice(0, 10)); })
      .catch((e) => { if (mounted) setError(e.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [city]);

  if (!city) return null;

  return (
    <div className="summary-card">
      <div className="summary-title">✈️ Popular destinations from {city}</div>
      {loading && <div className="summary-loading">Loading...</div>}
      {error && <div className="summary-error">{error}</div>}
      {!loading && !error && destinations.length > 0 && (
        <div className="summary-list">
          {destinations.map((d,i) => (<span key={i} className="summary-pill">{d}</span>))}
        </div>
      )}
    </div>
  );
}

export default TravelSummary;


