'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WinWindow from '@/components/WinWindow';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const configured = isSupabaseConfigured();

      if (configured) {
        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        router.push('/dashboard');
        router.refresh();
      } else {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'gua_demo_user',
            JSON.stringify({ email: email || 'pengguna@gua.my.id', role: 'authenticated' })
          );
        }
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Login gagal. Periksa kembali email dan password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'gua_demo_user',
        JSON.stringify({ email: 'demo@gua.my.id', role: 'demo' })
      );
    }
    router.push('/dashboard');
  };

  const handleGoogleLogin = async () => {
    try {
      const configured = isSupabaseConfigured();
      if (configured) {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
      } else {
        handleDemoLogin();
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal login via Google');
    }
  };

  return (
    <div className="container" style={{ maxWidth: 460, marginTop: 40 }}>
      <WinWindow
        title="Log On to gua.my.id"
        icon="🔑"
        statusText="Masukkan kata sandi untuk mengakses akun"
        onClose={() => router.push('/')}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>
          {/* Key Icon */}
          <div style={{ fontSize: '42px', padding: '6px' }}>
            🔑
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', marginBottom: 12 }}>
              Ketikkan nama pengguna (email) dan kata sandi untuk masuk ke layanan pendekin URL <strong>gua.my.id</strong>.
            </p>

            {error && (
              <div style={{
                padding: '6px 10px',
                background: '#ffffcc',
                boxShadow: 'var(--win-inset)',
                color: '#990000',
                fontSize: '11px',
                marginBottom: 10,
              }}>
                ⚠️ <strong>Error:</strong> {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: 110, fontSize: '12px' }}><u>U</u>ser name:</label>
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  className="win-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: 110, fontSize: '12px' }}><u>P</u>assword:</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="win-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: 110, fontSize: '12px' }}>Log on to:</label>
                <select className="win-input" style={{ flex: 1 }} disabled>
                  <option>gua.my.id (Supabase PostgreSQL)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="submit" className="win-btn win-btn-default" disabled={loading}>
                  {loading ? 'Memeriksa...' : 'OK'}
                </button>
                <Link href="/" className="win-btn">
                  Cancel
                </Link>
                <button
                  type="button"
                  className="win-btn"
                  onClick={() => alert('Bantuan Login:\nMasukkan email dan kata sandi yang terdaftar di Supabase.\nAtau klik tombol Mode Demo untuk langsung mencoba.')}
                >
                  <u>H</u>elp
                </button>
              </div>
            </form>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--win-dark)', borderBottom: '1px solid var(--win-light)', margin: '10px 0' }} />

        {/* Quick alternative login options */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={handleGoogleLogin} className="win-btn" style={{ fontSize: '11px' }}>
              🌐 Masuk Google
            </button>
            <button type="button" onClick={handleDemoLogin} className="win-btn" style={{ fontSize: '11px' }}>
              ⚡ Mode Tamu / Demo
            </button>
          </div>

          <div style={{ fontSize: '11px' }}>
            Belum punya akun?{' '}
            <Link href="/auth/register" style={{ textDecoration: 'underline', color: '#000080', fontWeight: 'bold' }}>
              Daftar Baru
            </Link>
          </div>
        </div>
      </WinWindow>
    </div>
  );
}
