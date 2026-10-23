'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WinWindow from '@/components/WinWindow';
import QrCodeModal from '@/components/QrCodeModal';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { LinkItem } from '@/types/database';
import { getBaseUrl, formatRelativeTime, isValidUrl, normalizeUrl, sanitizeCustomAlias, generateShortCode } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [selectedQrLink, setSelectedQrLink] = useState<LinkItem | null>(null);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // New Link Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const [newError, setNewError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    checkUserAndLoadLinks();
  }, []);

  const checkUserAndLoadLinks = async () => {
    setCheckingAuth(true);
    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setCurrentUser({ id: user.id, email: user.email });
          // Strictly fetch ONLY links created by this logged in user
          const { data, error } = await supabase
            .from('links')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            setLinks(data as LinkItem[]);
          } else {
            setLinks([]);
          }
        } else {
          setCurrentUser(null);
          setLinks([]);
        }
      } else {
        // Local demo mode fallback
        if (typeof window !== 'undefined') {
          const demo = localStorage.getItem('gua_demo_user');
          if (demo) {
            const parsed = JSON.parse(demo);
            setCurrentUser({ id: parsed.id || 'demo-user', email: parsed.email });
            const raw = localStorage.getItem(`gua_links_${parsed.id || 'demo-user'}`);
            setLinks(raw ? JSON.parse(raw) : []);
          } else {
            setCurrentUser(null);
            setLinks([]);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setLinks([]);
    } finally {
      setCheckingAuth(false);
      setLoading(false);
    }
  };

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (link: LinkItem) => {
    if (!currentUser) return;
    const updatedStatus = !link.is_active;

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase
        .from('links')
        .update({ is_active: updatedStatus })
        .eq('id', link.id)
        .eq('user_id', currentUser.id);
    }

    setLinks((prev) =>
      prev.map((l) => (l.id === link.id ? { ...l, is_active: updatedStatus } : l))
    );
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) return;
    if (!confirm('Peringatan Windows:\nApakah Anda yakin ingin menghapus tautan ini? Tindakan ini permanen.')) {
      return;
    }

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase
        .from('links')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);
    }

    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const handleOpenEdit = (link: LinkItem) => {
    setEditingLink(link);
    setEditUrl(link.original_url);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingLink || !currentUser) return;
    const normalized = normalizeUrl(editUrl);
    if (!isValidUrl(normalized)) {
      setEditError('URL tujuan tidak valid.');
      return;
    }

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase
        .from('links')
        .update({ original_url: normalized })
        .eq('id', editingLink.id)
        .eq('user_id', currentUser.id);
    }

    setLinks((prev) =>
      prev.map((l) => (l.id === editingLink.id ? { ...l, original_url: normalized } : l))
    );
    setEditingLink(null);
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    setNewError(null);
    const cleanInput = newUrl.trim();
    if (!cleanInput) {
      setNewError('Masukkan URL asli');
      return;
    }

    const normalized = normalizeUrl(cleanInput);
    if (!isValidUrl(normalized)) {
      setNewError('URL tidak valid');
      return;
    }

    let code = '';
    if (newAlias.trim()) {
      code = sanitizeCustomAlias(newAlias);
      if (code.length < 3) {
        setNewError('Alias minimal 3 karakter');
        return;
      }
    } else {
      code = generateShortCode(6);
    }

    setCreating(true);

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();

        // Check unique
        const { data: existing } = await supabase
          .from('links')
          .select('id')
          .eq('short_code', code)
          .single();

        if (existing) {
          setNewError(`Alias "${code}" sudah terpakai.`);
          setCreating(false);
          return;
        }

        const payload = {
          user_id: currentUser.id, // Strictly bound to logged in user
          original_url: normalized,
          short_code: code,
          custom_alias: newAlias.trim() ? code : null,
          title: new URL(normalized).hostname,
          is_active: true,
          clicks_count: 0,
        };

        const { data, error } = await supabase.from('links').insert([payload]).select().single();
        if (error) throw error;

        setLinks([data as LinkItem, ...links]);
      }

      setNewUrl('');
      setNewAlias('');
      setShowNewModal(false);
    } catch (err: any) {
      setNewError(err?.message || 'Gagal membuat tautan baru');
    } finally {
      setCreating(false);
    }
  };

  // If checking authentication
  if (checkingAuth) {
    return (
      <div className="container" style={{ maxWidth: 500, marginTop: 40 }}>
        <WinWindow title="Link Manager - Memeriksa Sesi..." icon="⏳">
          <div className="win-well" style={{ textAlign: 'center', padding: 24 }}>
            Memeriksa akun yang sedang login...
          </div>
        </WinWindow>
      </div>
    );
  }

  // If NOT logged in: Show Access Denied Box
  if (!currentUser) {
    return (
      <div className="container" style={{ maxWidth: 500, marginTop: 40 }}>
        <WinWindow
          title="Akses Ditolak - [Link Manager]"
          icon="🔒"
          statusText="Silakan login untuk melihat tautan Anda"
          onClose={() => router.push('/')}
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: 10 }}>
            <div style={{ fontSize: '38px', lineHeight: 1 }}>
              🔒
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: 6, color: '#000' }}>
                Anda Belum Masuk ke Akun
              </p>
              <p style={{ fontSize: '12px', color: '#444', lineHeight: 1.4, marginBottom: 16 }}>
                Link Manager hanya menampilkan daftar tautan yang dibuat oleh akun Anda sendiri. Silakan masuk atau daftarkan akun baru untuk mulai mengelola tautan Anda.
              </p>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Link href="/auth/register" className="win-btn win-btn-default">
                  📝 Daftar Akun Baru
                </Link>
                <Link href="/auth/login" className="win-btn">
                  🔑 Masuk (Log On)
                </Link>
                <Link href="/" className="win-btn">
                  Batal
                </Link>
              </div>
            </div>
          </div>
        </WinWindow>
      </div>
    );
  }

  // Filter links for this user
  const filteredLinks = links.filter((l) => {
    const matchesSearch =
      l.short_code.toLowerCase().includes(search.toLowerCase()) ||
      l.original_url.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'active') return l.is_active;
    if (filterStatus === 'inactive') return !l.is_active;
    return true;
  });

  const totalClicks = links.reduce((sum, l) => sum + (l.clicks_count || 0), 0);
  const activeCount = links.filter((l) => l.is_active).length;

  return (
    <div className="container" style={{ maxWidth: 860 }}>
      <WinWindow
        title={`Link Manager - [${currentUser.email}]`}
        icon="📁"
        statusText={`${filteredLinks.length} tautan milik Anda | Total Klik: ${totalClicks}`}
      >
        {/* User Account Info Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          background: '#dedede',
          boxShadow: 'var(--win-inset)',
          marginBottom: 10,
          fontSize: '11px',
        }}>
          <span>
            👤 Akun Anda: <strong>{currentUser.email}</strong> (Hanya menampilkan link Anda)
          </span>
          <span style={{ color: '#008000', fontWeight: 'bold' }}>
            ● Supabase Connected
          </span>
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          padding: '6px',
          background: 'var(--win-gray)',
          boxShadow: 'var(--win-outset)',
          marginBottom: 12,
          flexWrap: 'wrap',
        }}>
          <button onClick={() => setShowNewModal(true)} className="win-btn win-btn-default">
            ➕ Tautan Baru...
          </button>
          <button onClick={() => checkUserAndLoadLinks()} className="win-btn">
            🔄 Segarkan (Refresh)
          </button>

          <div style={{ width: 1, height: 22, background: 'var(--win-dark)', margin: '0 4px' }} />

          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            <span style={{ fontSize: '11px' }}>🔍 Cari:</span>
            <input
              type="text"
              className="win-input"
              placeholder="alias atau domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 160 }}
            />
          </div>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="win-input"
            style={{ fontSize: '11px', padding: '2px 4px' }}
          >
            <option value="all">Semua ({links.length})</option>
            <option value="active">Aktif ({activeCount})</option>
            <option value="inactive">Nonaktif ({links.length - activeCount})</option>
          </select>
        </div>

        {/* System Properties Group Box */}
        <fieldset className="win-fieldset">
          <legend className="win-legend">Statistik Tautan Saya</legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: '12px' }}>
            <div className="win-well" style={{ padding: '6px 10px' }}>
              <div style={{ color: '#555', fontSize: '11px' }}>Total Tautan Saya:</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{links.length} Tautan</div>
            </div>
            <div className="win-well" style={{ padding: '6px 10px' }}>
              <div style={{ color: '#555', fontSize: '11px' }}>Total Klik Masuk:</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#000080' }}>{totalClicks} Klik</div>
            </div>
            <div className="win-well" style={{ padding: '6px 10px' }}>
              <div style={{ color: '#555', fontSize: '11px' }}>Privasi:</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#008000' }}>Hanya Saya (Terkunci)</div>
            </div>
          </div>
        </fieldset>

        {/* Table of Links */}
        <div className="win-table-container">
          <table className="win-table">
            <thead>
              <tr>
                <th>Tautan Pendek</th>
                <th>URL Tujuan Asli</th>
                <th>Status</th>
                <th>Klik</th>
                <th>Waktu Dibuat</th>
                <th style={{ textAlign: 'center' }}>Operasi</th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#666' }}>
                    {loading
                      ? 'Memuat data tautan Anda...'
                      : 'Anda belum memiliki tautan. Klik tombol "➕ Tautan Baru..." di atas untuk membuat tautan pertama Anda.'}
                  </td>
                </tr>
              ) : (
                filteredLinks.map((link) => {
                  const shortUrl = `${getBaseUrl()}/${link.short_code}`;
                  const isCopied = copiedId === link.id;

                  return (
                    <tr key={link.id}>
                      <td style={{ fontWeight: 'bold' }}>
                        🔗 /{link.short_code}
                      </td>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <a href={link.original_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
                          {link.original_url}
                        </a>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(link)}
                          className="win-btn"
                          style={{
                            padding: '1px 6px',
                            fontSize: '11px',
                            color: link.is_active ? '#006600' : '#888',
                          }}
                        >
                          {link.is_active ? '● Aktif' : '○ Pause'}
                        </button>
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#000080' }}>
                        {link.clicks_count}
                      </td>
                      <td style={{ fontSize: '11px', color: '#444' }}>
                        {formatRelativeTime(link.created_at)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => handleCopy(link.id, shortUrl)}
                            className="win-btn"
                            style={{ padding: '2px 6px', fontSize: '11px' }}
                            title="Salin Link"
                          >
                            {isCopied ? '✓' : '📋 Salin'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedQrLink(link)}
                            className="win-btn"
                            style={{ padding: '2px 6px', fontSize: '11px' }}
                            title="Tampilkan QR Code"
                          >
                            🖨️ QR
                          </button>

                          <Link
                            href={`/dashboard/analytics/${link.id}`}
                            className="win-btn"
                            style={{ padding: '2px 6px', fontSize: '11px' }}
                            title="Laporan Analitik"
                          >
                            📊 Analitik
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(link)}
                            className="win-btn"
                            style={{ padding: '2px 6px', fontSize: '11px' }}
                            title="Edit URL Tujuan"
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(link.id)}
                            className="win-btn"
                            style={{ padding: '2px 6px', fontSize: '11px', color: '#990000' }}
                            title="Hapus"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </WinWindow>

      {/* QR Code Modal */}
      {selectedQrLink && (
        <QrCodeModal
          isOpen={Boolean(selectedQrLink)}
          onClose={() => setSelectedQrLink(null)}
          url={`${getBaseUrl()}/${selectedQrLink.short_code}`}
          shortCode={selectedQrLink.short_code}
        />
      )}

      {/* Modal: New Link Dialog */}
      {showNewModal && (
        <div className="win-modal-overlay" onClick={() => setShowNewModal(false)}>
          <div
            className="win-window"
            style={{ width: 440, maxWidth: '95vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="win-titlebar">
              <div className="win-title-group">
                <span>➕</span>
                <span>Buat Tautan Pendek Baru</span>
              </div>
              <div className="win-controls">
                <button className="win-btn-control" onClick={() => setShowNewModal(false)}>✕</button>
              </div>
            </div>

            <div style={{ padding: 14 }}>
              {newError && (
                <div style={{ padding: 8, background: '#ffffcc', color: '#990000', marginBottom: 12, boxShadow: 'var(--win-inset)', fontSize: '11px' }}>
                  ⚠️ {newError}
                </div>
              )}

              <form onSubmit={handleCreateNew}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: 4 }}>
                    URL Target Lengkap:
                  </label>
                  <input
                    type="text"
                    required
                    className="win-input"
                    placeholder="https://contoh-link.com/promo"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: 4 }}>
                    Custom Alias (Opsional):
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#000080' }}>
                      gua.my.id/
                    </span>
                    <input
                      type="text"
                      className="win-input"
                      placeholder="promo-desember"
                      value={newAlias}
                      onChange={(e) => setNewAlias(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" onClick={() => setShowNewModal(false)} className="win-btn">
                    Batal
                  </button>
                  <button type="submit" className="win-btn win-btn-default" disabled={creating}>
                    {creating ? 'Menyimpan...' : 'OK (Simpan)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Link Dialog */}
      {editingLink && (
        <div className="win-modal-overlay" onClick={() => setEditingLink(null)}>
          <div
            className="win-window"
            style={{ width: 440, maxWidth: '95vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="win-titlebar">
              <div className="win-title-group">
                <span>✏️</span>
                <span>Properti Tautan - /{editingLink.short_code}</span>
              </div>
              <div className="win-controls">
                <button className="win-btn-control" onClick={() => setEditingLink(null)}>✕</button>
              </div>
            </div>

            <div style={{ padding: 14 }}>
              {editError && (
                <div style={{ padding: 8, background: '#ffffcc', color: '#990000', marginBottom: 12, boxShadow: 'var(--win-inset)', fontSize: '11px' }}>
                  ⚠️ {editError}
                </div>
              )}

              <p style={{ fontSize: '12px', marginBottom: 12 }}>
                Ubah alamat URL target tanpa merubah tautan pendek <strong>gua.my.id/{editingLink.short_code}</strong>.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: 4 }}>
                  URL Target Baru:
                </label>
                <input
                  type="text"
                  className="win-input"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setEditingLink(null)} className="win-btn">
                  Batal
                </button>
                <button type="button" onClick={handleSaveEdit} className="win-btn win-btn-default">
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
