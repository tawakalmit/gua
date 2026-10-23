'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function Taskbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [startOpen, setStartOpen] = useState(false);
  const [time, setTime] = useState('');
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    // Live Clock
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Auth check
    const configured = isSupabaseConfigured();
    if (configured) {
      try {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user) setUser({ email: data.user.email });
        });
      } catch {}
    } else {
      if (typeof window !== 'undefined') {
        const demo = localStorage.getItem('gua_demo_user');
        if (demo) {
          try {
            setUser(JSON.parse(demo));
          } catch {}
        }
      }
    }

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setStartOpen(false);
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('gua_demo_user');
    }
    setUser(null);
    router.push('/');
  };

  return (
    <>
      {/* Start Menu Drop-up */}
      {startOpen && (
        <div className="win-start-menu">
          <div className="win-start-banner">
            <span>Windows</span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#f59e0b' }}>95</span>
          </div>

          <div className="win-start-list">
            <Link
              href="/"
              className="win-start-item"
              onClick={() => setStartOpen(false)}
            >
              <span style={{ fontSize: '18px' }}>🌐</span>
              <strong>Pendekin URL gua.my.id</strong>
            </Link>

            <Link
              href="/dashboard"
              className="win-start-item"
              onClick={() => setStartOpen(false)}
            >
              <span style={{ fontSize: '18px' }}>📁</span>
              <span>Dashboard Tautan</span>
            </Link>

            <div className="win-start-divider" />

            {user ? (
              <div className="win-start-item" onClick={handleLogout}>
                <span style={{ fontSize: '18px' }}>🚪</span>
                <span>Log Off ({user.email})</span>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="win-start-item"
                  onClick={() => setStartOpen(false)}
                >
                  <span style={{ fontSize: '18px' }}>🔑</span>
                  <span>Log In...</span>
                </Link>
                <Link
                  href="/auth/register"
                  className="win-start-item"
                  onClick={() => setStartOpen(false)}
                >
                  <span style={{ fontSize: '18px' }}>📝</span>
                  <span>Daftar Pengguna Baru...</span>
                </Link>
              </>
            )}

            <div className="win-start-divider" />

            <div
              className="win-start-item"
              onClick={() => {
                setStartOpen(false);
                alert('gua.my.id - Windows 95 Edition\nSupabase Database Connected\nPowered by Next.js App Router');
              }}
            >
              <span style={{ fontSize: '18px' }}>ℹ️</span>
              <span>Tentang gua.my.id...</span>
            </div>

            <div
              className="win-start-item"
              onClick={() => {
                setStartOpen(false);
                if (confirm('Restart sesi aplikasi gua.my.id?')) {
                  window.location.reload();
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>🔌</span>
              <span>Matikan Komputer (Shut Down)...</span>
            </div>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="win-taskbar">
        {/* Start Button */}
        <button
          className={`win-start-btn ${startOpen ? 'open' : ''}`}
          onClick={() => setStartOpen(!startOpen)}
        >
          {/* Windows 4-color flag */}
          <div style={{ display: 'grid', gridTemplateColumns: '7px 7px', gap: 1, marginRight: 2 }}>
            <div style={{ width: 7, height: 7, background: '#f43f5e' }}></div>
            <div style={{ width: 7, height: 7, background: '#10b981' }}></div>
            <div style={{ width: 7, height: 7, background: '#3b82f6' }}></div>
            <div style={{ width: 7, height: 7, background: '#f59e0b' }}></div>
          </div>
          <span>Start</span>
        </button>

        {/* Running Tasks */}
        <div className="win-task-items">
          <Link
            href="/"
            className={`win-task-tab ${pathname === '/' ? 'active' : ''}`}
          >
            <span>🌐</span>
            <span>gua.my.id - Shortener</span>
          </Link>

          <Link
            href="/dashboard"
            className={`win-task-tab ${pathname.startsWith('/dashboard') ? 'active' : ''}`}
          >
            <span>📁</span>
            <span>Link Manager</span>
          </Link>

          {pathname.includes('/auth') && (
            <div className="win-task-tab active">
              <span>🔑</span>
              <span>Log In</span>
            </div>
          )}
        </div>

        {/* System Tray */}
        <div className="win-tray">
          <span title="Supabase DB Online" style={{ cursor: 'pointer' }}>🗄️</span>
          <span title="Audio On">🔊</span>
          <span style={{ fontWeight: 'bold' }}>{time || '12:00'}</span>
        </div>
      </div>
    </>
  );
}
