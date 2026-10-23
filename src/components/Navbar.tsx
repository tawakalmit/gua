'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Link2, LayoutDashboard, LogIn, LogOut, Sparkles, ShieldCheck } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);

    if (configured) {
      try {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user) {
            setUser({ email: data.user.email });
          }
          setLoading(false);
        }).catch(() => setLoading(false));

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ? { email: session.user.email } : null);
        });

        return () => {
          authListener?.subscription.unsubscribe();
        };
      } catch {
        setLoading(false);
      }
    } else {
      // Check local demo user
      if (typeof window !== 'undefined') {
        const demoUser = localStorage.getItem('gua_demo_user');
        if (demoUser) {
          try {
            setUser(JSON.parse(demoUser));
          } catch {
            // ignore
          }
        }
      }
      setLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    if (isConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('gua_demo_user');
    }
    setUser(null);
    window.location.href = '/';
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link href="/" className="brand-logo">
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)'
          }}>
            <Link2 size={20} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <span style={{ fontWeight: 800, letterSpacing: '-0.03em' }}>gua</span>
            <span className="brand-badge">.my.id</span>
          </div>
          <span className="domain-pill">Shortener</span>
        </Link>

        <nav className="nav-links">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            Beranda
          </Link>
          <Link href="/dashboard" className={`nav-link ${pathname.startsWith('/dashboard') ? 'active' : ''}`}>
            <LayoutDashboard size={16} />
            Dashboard
          </Link>

          {!loading && (
            <>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
                    <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email || 'Pengguna'}
                    </span>
                  </div>
                  <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                    <LogOut size={14} />
                    Keluar
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Link href="/auth/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    <LogIn size={15} />
                    Masuk
                  </Link>
                  <Link href="/auth/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    <Sparkles size={15} />
                    Daftar
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
