'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WinWindow from '@/components/WinWindow';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      const configured = isSupabaseConfigured();

      if (configured) {
        const supabase = createClient();
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        setSuccess('Pendaftaran berhasil! Akun telah terdaftar di database Supabase.');
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'gua_demo_user',
            JSON.stringify({ email: email || 'user@gua.my.id', role: 'authenticated' })
          );
        }
        setSuccess('Akun demo berhasil dibuat!');
        setTimeout(() => router.push('/dashboard'), 1000);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal mendaftar pengguna baru.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 460, marginTop: 40 }}>
      <WinWindow
        title="Registrasi Pengguna Baru - gua.my.id"
        icon="📝"
        statusText="Buat kredensial akun baru untuk menyimpan tautan"
        onClose={() => router.push('/')}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ fontSize: '42px', padding: '6px' }}>
            💾
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', marginBottom: 12 }}>
              Daftarkan akun baru Anda untuk mengelola tautan kustom, melihat analitik, dan membuat QR Code.
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

            {success && (
              <div style={{
                padding: '6px 10px',
                background: '#e6ffe6',
                boxShadow: 'var(--win-inset)',
                color: '#006600',
                fontSize: '11px',
                marginBottom: 10,
              }}>
                ✓ <strong>Sukses:</strong> {success}
              </div>
            )}

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: 130, fontSize: '12px' }}>Alamat Email:</label>
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
                <label style={{ width: 130, fontSize: '12px' }}>Kata Sandi:</label>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 karakter"
                  className="win-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ width: 130, fontSize: '12px' }}>Ulangi Sandi:</label>
                <input
                  type="password"
                  required
                  placeholder="Konfirmasi kata sandi"
                  className="win-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="submit" className="win-btn win-btn-default" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Daftar Sekarang'}
                </button>
                <Link href="/auth/login" className="win-btn">
                  Batal
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--win-dark)', borderBottom: '1px solid var(--win-light)', margin: '10px 0' }} />

        <div style={{ textAlign: 'center', fontSize: '11px' }}>
          Sudah memiliki akun?{' '}
          <Link href="/auth/login" style={{ textDecoration: 'underline', color: '#000080', fontWeight: 'bold' }}>
            Masuk di sini
          </Link>
        </div>
      </WinWindow>
    </div>
  );
}
