import React, { useState } from 'react';
import './Header.css';

function Header() {
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState('signin');
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` }})
      .then(async (r) => {
        if (!r.ok) {
          localStorage.removeItem('token');
          return null;
        }
        return r.json();
      })
      .then(u => { if (u) setUser(u); })
      .catch(() => { localStorage.removeItem('token'); });
  }, []);
  return (
    <header className="app-header glass">
      <div className="header-content">
        <div className="logo-section">
          <h1 className="logo">🌍 WanderWise</h1>
          <p className="tagline">Your personal travel and weather guide</p>
        </div>
        <div className="header-features">
          <div className="feature-badge">
            <span className="feature-icon">🌤️</span>
            <span>Weather</span>
          </div>
          <div className="feature-badge">
            <span className="feature-icon">✈️</span>
            <span>Travel</span>
          </div>
          <div className="feature-badge">
            <span className="feature-icon">🚗</span>
            <span>Rental cars</span>
          </div>
          <div className="feature-badge">
            <span className="feature-icon">🏨</span>
            <span>Hotels</span>
          </div>
          <div className="feature-badge">
            <span className="feature-icon">🍽️</span>
            <span>Restaurants</span>
          </div>
          <div className="feature-badge">
            <span className="feature-icon">🛫</span>
            <span>Check-in</span>
          </div>
        </div>
      </div>

      {showAuth && (
        <div className="auth-modal" role="dialog" aria-modal="true">
          <div className="auth-panel">
            <div className="auth-header">
              <div className="auth-tabs">
                <button className={`auth-tab ${mode==='signin'?'active':''}`} onClick={() => setMode('signin')}>Sign in</button>
                <button className={`auth-tab ${mode==='signup'?'active':''}`} onClick={() => setMode('signup')}>Create account</button>
              </div>
              <button className="auth-close" onClick={() => setShowAuth(false)}>✕</button>
            </div>
            <form className="auth-body" onSubmit={async (e)=>{
              e.preventDefault();
              const form = e.currentTarget;
              const email = form.querySelector('input[name="email"]').value;
              const password = form.querySelector('input[name="password"]').value;
              const name = form.querySelector('input[name="name"]')?.value;
              const endpoint = mode==='signin' ? '/api/auth/signin' : '/api/auth/signup';
              try {
                const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password, name }) });
                const data = await res.json();
                if(!res.ok) throw new Error(data?.error || 'Auth failed');
                localStorage.setItem('token', data.token);
                setUser(data.user);
                setShowAuth(false);
              } catch(err) { alert(err.message); }
            }}>
              <input type="email" name="email" placeholder="Email" required />
              <input type="password" name="password" placeholder="Password" required />
              {mode==='signup' && <input type="text" name="name" placeholder="Display name" required />}
              <button type="submit" className="auth-submit">{mode==='signin' ? 'Sign in' : 'Create account'}</button>
              <div className="oauth-row">
                <button type="button" className="oauth-btn">Continue with Google</button>
                <button type="button" className="oauth-btn dark">Continue with GitHub</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
