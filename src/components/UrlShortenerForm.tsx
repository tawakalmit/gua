'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isValidUrl, normalizeUrl, generateShortCode, sanitizeCustomAlias, getBaseUrl } from '@/lib/utils';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { LinkItem } from '@/types/database';
import QrCodeModal from './QrCodeModal';

interface UrlShortenerFormProps {
  onLinkCreated?: (link: LinkItem) => void;
}

export default function UrlShortenerForm({ onLinkCreated }: UrlShortenerFormProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [url, setUrl] = useState('');
  const [useAlias, setUseAlias] = useState(false);
  const [customAlias, setCustomAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<LinkItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      setCheckingAuth(true);
      try {
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            setUser({ id: authUser.id, email: authUser.email });
          } else {
            setUser(null);
          }
        } else {
          // Check demo storage user
          if (typeof window !== 'undefined') {
            const demo = localStorage.getItem('gua_demo_user');
            if (demo) {
              const parsed = JSON.parse(demo);
              setUser({ id: parsed.id || 'demo-user', email: parsed.email });
            } else {
              setUser(null);
            }
          }
        }
      } catch {
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Rule: User must be registered/logged in to create short URL
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const cleanInput = url.trim();
    if (!cleanInput) {
      setError('Harap masukkan URL target panjang.');
      return;
    }

    const normalized = normalizeUrl(cleanInput);
    if (!isValidUrl(normalized)) {
      setError('Format URL tidak valid. Contoh: https://contoh.com/artikel');
      return;
    }

    let code = '';
    if (useAlias && customAlias.trim()) {
      code = sanitizeCustomAlias(customAlias);
      if (code.length < 3) {
        setError('Custom alias minimal 3 karakter.');
        return;
      }
    } else {
      code = generateShortCode(6);
    }

    setLoading(true);

    try {
      const configured = isSupabaseConfigured();

      if (configured) {
        const supabase = createClient();

        // Check if alias already taken
        const { data: existing } = await supabase
          .from('links')
          .select('id')
          .eq('short_code', code)
          .single();

        if (existing) {
          setError(`Alias "${code}" sudah digunakan. Silakan gunakan alias lain.`);
          setLoading(false);
          return;
        }

        const payload = {
          user_id: user.id, // Strictly bound to logged in user
          original_url: normalized,
          short_code: code,
          custom_alias: useAlias && customAlias.trim() ? code : null,
          title: new URL(normalized).hostname,
          is_active: true,
          clicks_count: 0,
        };

        const { data, error: insertError } = await supabase
          .from('links')
          .insert([payload])
          .select()
          .single();

        if (insertError) throw insertError;

        setCreatedLink(data as LinkItem);
        if (onLinkCreated) onLinkCreated(data as LinkItem);
      } else {
        setError('Koneksi Supabase belum aktif.');
      }

      setUrl('');
      setCustomAlias('');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Terjadi kesalahan saat memendekkan tautan.');
    } finally {
      setLoading(false);
    }
  };

  const fullShortUrl = createdLink ? `${getBaseUrl()}/${createdLink.short_code}` : '';

  const handleCopy = () => {
    if (!fullShortUrl) return;
    navigator.clipboard.writeText(fullShortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (checkingAuth) {
    return (
      <div className="win-well" style={{ textAlign: 'center', padding: '16px' }}>
        Memeriksa sesi login...
      </div>
    );
  }

  // If user is not logged in: display registration/login requirement notice
  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <fieldset className="win-fieldset">
          <legend className="win-legend">Autentikasi Diperlukan</legend>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '8px 4px' }}>
            <span style={{ fontSize: '32px' }}>🔒</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#000080', marginBottom: 4 }}>
                Pendaftaran Diperlukan untuk Membuat Tautan
              </div>
              <p style={{ fontSize: '12px', color: '#333', lineHeight: 1.4 }}>
                Sesuai kebijakan privasi, untuk membuat short URL Anda harus <strong>mendaftar atau masuk</strong> ke akun Anda terlebih dahulu. Seluruh tautan yang Anda buat hanya akan dapat dilihat dan dikelola oleh akun Anda sendiri.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
            <Link href="/auth/register" className="win-btn win-btn-default">
              📝 Daftar Pengguna Baru
            </Link>
            <Link href="/auth/login" className="win-btn">
              🔑 Masuk (Log On)
            </Link>
          </div>
        </fieldset>
      </div>
    );
  }

  return (
    <div>
      {/* User Login Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 8px',
        background: '#dedede',
        boxShadow: 'var(--win-inset)',
        marginBottom: 12,
        fontSize: '11px',
      }}>
        <span>
          👤 Pengguna Aktif: <strong>{user.email || 'Pengguna Terdaftar'}</strong>
        </span>
        <Link href="/dashboard" style={{ textDecoration: 'underline', color: '#000080', fontWeight: 'bold' }}>
          Lihat Link Saya di Dashboard &gt;&gt;
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <fieldset className="win-fieldset">
          <legend className="win-legend">Input Tautan Panjang</legend>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            <label style={{ fontSize: '12px' }}>
              Masukkan alamat web lengkap (URL):
            </label>
            <input
              type="text"
              className="win-input"
              placeholder="https://www.domain.com/halaman-sangat-panjang"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              disabled={loading}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '12px' }}>
              <input
                type="checkbox"
                checked={useAlias}
                onChange={(e) => setUseAlias(e.target.checked)}
              />
              <span>Gunakan Custom Alias (akhiran tautan kustom)</span>
            </label>

            {useAlias && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, paddingLeft: 20 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#000080' }}>
                  gua.my.id/
                </span>
                <input
                  type="text"
                  className="win-input"
                  placeholder="promo-desember"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                  style={{ width: 220 }}
                  maxLength={30}
                />
              </div>
            )}
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              background: '#ffffcc',
              boxShadow: 'var(--win-inset)',
              marginBottom: 12,
              fontSize: '12px',
              color: '#990000',
            }}>
              <span>⚠️</span>
              <span><strong>Error:</strong> {error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="win-btn"
              onClick={() => {
                setUrl('');
                setCustomAlias('');
                setError(null);
              }}
              disabled={loading}
            >
              Reset
            </button>
            <button
              type="submit"
              className="win-btn win-btn-default"
              disabled={loading}
            >
              {loading ? 'Menyimpan ke Akun...' : '▶ Perpendek Tautan'}
            </button>
          </div>
        </fieldset>
      </form>

      {/* Result Group Box */}
      {createdLink && (
        <fieldset className="win-fieldset" style={{ marginTop: 14 }}>
          <legend className="win-legend">Hasil Tautan Dipendekkan</legend>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: '11px', color: '#444' }}>Tautan Pendek Baru:</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <input
                  type="text"
                  readOnly
                  className="win-input"
                  value={fullShortUrl}
                  style={{ flex: 1, fontWeight: 'bold', color: '#000080' }}
                />
                <button type="button" onClick={handleCopy} className="win-btn win-btn-default">
                  {copied ? '✓ Tersalin!' : '📋 Salin'}
                </button>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#555' }}>
              Target Asli: <span style={{ textDecoration: 'underline' }}>{createdLink.original_url}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setIsQrOpen(true)}
                className="win-btn"
              >
                🖨️ Tampilkan QR Code...
              </button>

              <a
                href={fullShortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="win-btn"
              >
                🌐 Uji Buka Link (302)
              </a>

              <Link
                href={`/dashboard/analytics/${createdLink.id}`}
                className="win-btn"
              >
                📊 Laporan Analitik &gt;&gt;
              </Link>
            </div>
          </div>
        </fieldset>
      )}

      {/* QR Code Modal */}
      {createdLink && (
        <QrCodeModal
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
          url={fullShortUrl}
          shortCode={createdLink.short_code}
        />
      )}
    </div>
  );
}
