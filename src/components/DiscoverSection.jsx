import React, { useEffect, useRef, useState, useCallback } from 'react';
import './DiscoverSection.css';

function DiscoverSection({ externalCity }) {
  const [activeTab, setActiveTab] = useState('hotels');
  const [city, setCity] = useState('london');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedPrices, setSelectedPrices] = useState([]);
  const pageSize = 4;
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const id = ++requestIdRef.current;
    setLoading(true);
    setError('');
    try {
      const endpoint = activeTab === 'hotels' ? `/api/hotels/${encodeURIComponent(city)}` : `/api/restaurants/${encodeURIComponent(city)}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      if (id !== requestIdRef.current) return; // ignore stale response
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      const list = activeTab === 'hotels' ? (data.data || data.hotels || []) : (data.data || data.restaurants || []);
      setItems(list);
      setPage(1);
    } catch (e) {
      if (id !== requestIdRef.current) return; // ignore stale error
      setItems([]);
      setError(e.message);
    }
    setLoading(false);
  }, [activeTab, city]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync external city from parent search
  useEffect(() => {
    if (externalCity && externalCity.trim() && externalCity.toLowerCase() !== city.toLowerCase()) {
      setCity(externalCity.toLowerCase());
    }
  }, [externalCity, city]);

  const renderCard = (item, idx) => {
    const name = item.name || item.title;
    const rating = item.rating ? `${item.rating}⭐` : undefined;
    const price = item.price || item.priceLevel;
    const type = item.type || item.cuisine;
    const link = item.link || item.url;
    const image = item.image;
    const reviewCount = item.reviewCount;
    return (
      <a key={idx} className="discover-card" href={link} target="_blank" rel="noreferrer">
        {image && (
          <div className="discover-card-image">
            <img 
              src={image} 
              alt={name} 
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400?text=Image+unavailable'; }}
            />
          </div>
        )}
        <div className="discover-card-header">
          <div className="discover-card-title">{name}</div>
          <div className="discover-card-rating">
            {rating && <span className="rating-badge">{rating}</span>}
            {typeof reviewCount === 'number' && <span className="reviews">({reviewCount.toLocaleString()} reviews)</span>}
          </div>
        </div>
        <div className="discover-card-meta">
          {type && <span className="meta-pill">{type}</span>}
          {price && <span className="meta-pill price">{price}</span>}
        </div>
        <div className="discover-card-cta">View details →</div>
      </a>
    );
  };

  const cuisineOptions = ['Italian','Indian','Japanese','French','Fusion','Pizza','Steakhouse','Ramen','Sushi','Spanish','Grill','Food Court','Crêperie','Pakistani','Persian','Modern','Kebab','Deli'];
  const priceOptions = ['€','€€','€€€','$','$$','$$$','£','££','¥','¥¥','¥¥¥','AED'];

  const filtered = items.filter((it) => {
    const cuisine = (it.cuisine || it.type || '').toString();
    const price = (it.price || '').toString();
    const cuisinePass = selectedCuisines.length === 0 || selectedCuisines.some(c => cuisine.includes(c));
    const pricePass = selectedPrices.length === 0 || selectedPrices.some(p => price.includes(p));
    return cuisinePass && pricePass;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const changePage = (next) => {
    const p = Math.max(1, Math.min(totalPages, next));
    setPage(p);
    // Keep the discover section in view but avoid scrolling the whole page
    // No-op scroll to prevent page jump
  };

  return (
    <section className="discover">
      <div className="discover-header">
        <h2>Discover top places</h2>
        <p>Explore curated recommendations by city</p>
      </div>

      <div className="discover-controls">
        <div className="tabs">
          <button className={`tab ${activeTab === 'hotels' ? 'active' : ''}`} onClick={() => setActiveTab('hotels')}>Hotels</button>
          <button className={`tab ${activeTab === 'restaurants' ? 'active' : ''}`} onClick={() => setActiveTab('restaurants')}>Restaurants</button>
        </div>
        <input
          className="city-input"
          placeholder="Search city (e.g., Paris)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <div className="chip-row">
          {cuisineOptions.slice(0, 10).map((c) => (
            <button
              key={c}
              className={`chip ${selectedCuisines.includes(c) ? 'selected' : ''}`}
              onClick={() => setSelectedCuisines((prev) => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
            >{c}</button>
          ))}
        </div>
        <div className="chip-row">
          {priceOptions.map((p) => (
            <button
              key={p}
              className={`chip ${selectedPrices.includes(p) ? 'selected' : ''}`}
              onClick={() => setSelectedPrices((prev) => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
            >{p}</button>
          ))}
          {(selectedCuisines.length > 0 || selectedPrices.length > 0) && (
            <button className="chip clear" onClick={() => { setSelectedCuisines([]); setSelectedPrices([]); }}>Clear</button>
          )}
        </div>
      </div>

      {loading && <div className="discover-loading">Loading...</div>}
      {error && <div className="discover-error">{error}</div>}

      <div className="discover-grid">
        {paginated.map(renderCard)}
        {!loading && !error && filtered.length === 0 && (
          <div className="discover-empty">No results. Try another city.</div>
        )}
      </div>

      {!loading && items.length > 0 && (
        <div className="discover-pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => changePage(page - 1)}>Prev</button>
          <div className="page-dots">
            {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
              const idx = i + 1;
              return (
                <button key={idx} className={`dot ${page === idx ? 'active' : ''}`} onClick={() => changePage(idx)}>{idx}</button>
              );
            })}
            {totalPages > 7 && <span className="ellipsis">…</span>}
          </div>
          <button className="page-btn" disabled={page === totalPages} onClick={() => changePage(page + 1)}>Next</button>
        </div>
      )}
    </section>
  );
}

export default DiscoverSection;


