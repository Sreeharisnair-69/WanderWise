import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.js';
import { ClerkProvider } from '@clerk/clerk-react';
const PUBLISHABLE_KEY = (
  (process.env as any)?.VITE_CLERK_PUBLISHABLE_KEY ||
  process.env.REACT_APP_CLERK_PUBLISHABLE_KEY
) as string | undefined;
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Set REACT_APP_CLERK_PUBLISHABLE_KEY (or VITE_CLERK_PUBLISHABLE_KEY) in .env');
}

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </React.StrictMode>
);


