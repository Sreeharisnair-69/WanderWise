import React, { useEffect, useState } from 'react';

function CarsSummary({ city }) {
  const [cars, setCars] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) return;
    let mounted = true;
    setLoading(true); setError('');
    fetch(`/api/cars/${encodeURIComponent(city)}`)
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || 'Failed'); return d; })
      .then((d) => { if (mounted) setCars(d.data || []); })
      .catch((e) => { if (mounted) setError(e.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [city]);

  if (!city) return null;

  return (
    <div className="summary-card">
      <div className="summary-title">🚗 Rental cars in {city}</div>
      {loading && <div className="summary-loading">Loading...</div>}
      {error && <div className="summary-error">{error}</div>}
      {!loading && !error && cars.length > 0 && (
        <div className="summary-list">
          {cars.map((c,i) => (
            <a key={i} className="summary-link" href={c.url} target="_blank" rel="noreferrer">{c.company} — {c.pricePerDay}</a>
          ))}
        </div>
      )}
    </div>
  );
}

export default CarsSummary;


