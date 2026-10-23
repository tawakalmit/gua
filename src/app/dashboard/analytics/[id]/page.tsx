'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import WinWindow from '@/components/WinWindow';
import QrCodeModal from '@/components/QrCodeModal';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { getLocalLinks, getLocalClicks, computeAnalytics } from '@/lib/mockStore';
import { LinkItem, ClickItem, AnalyticsSummary } from '@/types/database';
import { getBaseUrl, getCountryFlag, getCountryName } from '@/lib/utils';

export default function AnalyticsPage() {
  const params = useParams();
  const linkId = params.id as string;

  const [link, setLink] = useState<LinkItem | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'geo' | 'referrers' | 'devices'>('overview');

  useEffect(() => {
    if (!linkId) return;
    loadAnalytics();
  }, [linkId]);

  const loadAnalytics = async () => {
    setLoading(true);
    const configured = isSupabaseConfigured();

    try {
      if (configured) {
        const res = await fetch(`/api/analytics/${linkId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.link) setLink(json.link as LinkItem);
          if (json.analytics) setAnalytics(json.analytics as AnalyticsSummary);
        } else {
          // Fallback to local store if not found in database
          const links = getLocalLinks();
          const found = links.find((l) => l.id === linkId) || links[0];
          setLink(found || null);
          const clicks = getLocalClicks(found ? found.id : linkId);
          setAnalytics(computeAnalytics(clicks));
        }
      } else {
        const links = getLocalLinks();
        const found = links.find((l) => l.id === linkId) || links[0];
        setLink(found || null);

        const clicks = getLocalClicks(found ? found.id : linkId);
        setAnalytics(computeAnalytics(clicks));
      }
    } catch (err) {
      console.error(err);
      const links = getLocalLinks();
      const found = links.find((l) => l.id === linkId) || links[0];
      setLink(found || null);
      const clicks = getLocalClicks(found ? found.id : linkId);
      setAnalytics(computeAnalytics(clicks));
    } finally {
      setLoading(false);
    }
  };

  const shortUrl = link ? `${getBaseUrl()}/${link.short_code}` : '';

  const handleCopy = () => {
    if (!shortUrl) return;
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: 760 }}>
        <WinWindow title="Performance Monitor - Loading..." statusText="Mengambil data analitik...">
          <div className="win-well" style={{ textAlign: 'center', padding: 30 }}>
            ⏳ Sedang mengumpulkan data statistik dari Supabase...
          </div>
        </WinWindow>
      </div>
    );
  }

  if (!link || !analytics) {
    return (
      <div className="container" style={{ maxWidth: 760 }}>
        <WinWindow title="Error" icon="⚠️">
          <div style={{ padding: 20, textAlign: 'center' }}>
            <p>Data tautan tidak ditemukan dalam sistem.</p>
            <Link href="/dashboard" className="win-btn win-btn-default" style={{ marginTop: 12 }}>
              Kembali ke Dashboard
            </Link>
          </div>
        </WinWindow>
      </div>
    );
  }

  const maxClickDay = Math.max(...analytics.clicksOverTime.map((d) => d.clicks), 1);

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <WinWindow
        title={`Performance Monitor - [gua.my.id/${link.short_code}]`}
        icon="📊"
        statusText={`Total Klik: ${analytics.totalClicks} | Pengunjung Unik: ${analytics.uniqueVisitors}`}
      >
        {/* Navigation & Header Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <Link href="/dashboard" className="win-btn">
            &lt;&lt; Kembali ke Dashboard
          </Link>

          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={handleCopy} className="win-btn">
              {copied ? '✓ Tersalin' : '📋 Salin Tautan'}
            </button>
            <button type="button" onClick={() => setIsQrOpen(true)} className="win-btn">
              🖨️ QR Code
            </button>
            <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="win-btn win-btn-default">
              🌐 Buka Tautan (302)
            </a>
          </div>
        </div>

        {/* Link Details Sunken Well */}
        <div className="win-well" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#000080' }}>
              {shortUrl}
            </span>
            <span style={{ fontSize: '11px', color: link.is_active ? '#008000' : '#888' }}>
              Status: <strong>{link.is_active ? 'AKTIF' : 'DINONAKTIFKAN'}</strong>
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#555', wordBreak: 'break-all' }}>
            Target Asli: {link.original_url}
          </div>
        </div>

        {/* Windows 95 Tabs System */}
        <div className="win-tabs-header">
          <button
            type="button"
            className={`win-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📈 Ringkasan &amp; Tren
          </button>
          <button
            type="button"
            className={`win-tab-btn ${activeTab === 'geo' ? 'active' : ''}`}
            onClick={() => setActiveTab('geo')}
          >
            🌐 Geolokasi ({analytics.countries.length})
          </button>
          <button
            type="button"
            className={`win-tab-btn ${activeTab === 'referrers' ? 'active' : ''}`}
            onClick={() => setActiveTab('referrers')}
          >
            🔗 Referrer ({analytics.referrers.length})
          </button>
          <button
            type="button"
            className={`win-tab-btn ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => setActiveTab('devices')}
          >
            💻 Perangkat &amp; Browser
          </button>
        </div>

        {/* Tab Content Box */}
        <div className="win-tab-content">
          {/* TAB 1: OVERVIEW & SYSTEM MONITOR */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 16 }}>
                <div className="win-well" style={{ textAlign: 'center', padding: '8px 4px' }}>
                  <div style={{ fontSize: '11px', color: '#555' }}>Total Klik:</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#000080' }}>
                    {analytics.totalClicks}
                  </div>
                </div>

                <div className="win-well" style={{ textAlign: 'center', padding: '8px 4px' }}>
                  <div style={{ fontSize: '11px', color: '#555' }}>Pengunjung Unik:</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {analytics.uniqueVisitors}
                  </div>
                </div>

                <div className="win-well" style={{ textAlign: 'center', padding: '8px 4px' }}>
                  <div style={{ fontSize: '11px', color: '#555' }}>Klik Hari Ini:</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#008000' }}>
                    {analytics.todayClicks}
                  </div>
                </div>

                <div className="win-well" style={{ textAlign: 'center', padding: '8px 4px' }}>
                  <div style={{ fontSize: '11px', color: '#555' }}>Top Referrer:</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: 4 }}>
                    {analytics.topReferrer.name}
                  </div>
                </div>
              </div>

              {/* Retro System Monitor Graphic Chart */}
              <fieldset className="win-fieldset">
                <legend className="win-legend">System Monitor - Aktivitas Klik 7 Hari Terakhir</legend>

                {/* CRT Screen Look */}
                <div style={{
                  background: '#000000',
                  boxShadow: 'var(--win-inset)',
                  padding: '16px 12px 10px 12px',
                  position: 'relative',
                  backgroundImage: 'linear-gradient(rgba(0, 255, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.05) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-around',
                    height: 140,
                    borderBottom: '1px solid #008000',
                    paddingBottom: 4,
                  }}>
                    {analytics.clicksOverTime.map((d, i) => {
                      const pct = Math.max((d.clicks / maxClickDay) * 100, 6);
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%',
                            justifyContent: 'flex-end',
                            width: 44,
                          }}
                        >
                          <span style={{ color: '#00ff00', fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                            {d.clicks}
                          </span>
                          <div
                            style={{
                              width: 28,
                              height: `${pct}%`,
                              background: 'repeating-linear-gradient(0deg, #008000, #008000 3px, #00ff00 3px, #00ff00 4px)',
                              border: '1px solid #00ff00',
                              boxShadow: '0 0 6px rgba(0, 255, 0, 0.4)',
                            }}
                          />
                          <span style={{ color: '#00bb00', fontSize: '10px', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                            {d.date.split(',')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </fieldset>
            </div>
          )}

          {/* TAB 2: GEOLOCATION */}
          {activeTab === 'geo' && (
            <div>
              <fieldset className="win-fieldset">
                <legend className="win-legend">Data Pelacakan Negara Pengunjung</legend>
                <div className="win-table-container">
                  <table className="win-table">
                    <thead>
                      <tr>
                        <th>Negara</th>
                        <th>Kode</th>
                        <th>Jumlah Klik</th>
                        <th>Persentase</th>
                        <th style={{ width: 160 }}>Grafik Batang</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.countries.map((c, i) => (
                        <tr key={i}>
                          <td>
                            <span style={{ marginRight: 6 }}>{getCountryFlag(c.country)}</span>
                            <strong>{getCountryName(c.country)}</strong>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{c.country}</td>
                          <td style={{ fontWeight: 'bold', color: '#000080' }}>{c.count}</td>
                          <td>{c.percentage}%</td>
                          <td>
                            <div style={{ background: '#fff', boxShadow: 'var(--win-inset)', height: 14, padding: 1 }}>
                              <div style={{ background: '#000080', height: '100%', width: `${c.percentage}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </fieldset>
            </div>
          )}

          {/* TAB 3: REFERRERS */}
          {activeTab === 'referrers' && (
            <div>
              <fieldset className="win-fieldset">
                <legend className="win-legend">Platform Asal Pengunjung (Referrer)</legend>
                <div className="win-table-container">
                  <table className="win-table">
                    <thead>
                      <tr>
                        <th>Platform / Domain</th>
                        <th>Jumlah Klik</th>
                        <th>Persentase</th>
                        <th style={{ width: 160 }}>Grafik Batang</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.referrers.map((r, i) => (
                        <tr key={i}>
                          <td>
                            <span style={{ marginRight: 6 }}>🔗</span>
                            <strong>{r.referrer}</strong>
                          </td>
                          <td style={{ fontWeight: 'bold', color: '#000080' }}>{r.count}</td>
                          <td>{r.percentage}%</td>
                          <td>
                            <div style={{ background: '#fff', boxShadow: 'var(--win-inset)', height: 14, padding: 1 }}>
                              <div style={{ background: '#008080', height: '100%', width: `${r.percentage}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </fieldset>
            </div>
          )}

          {/* TAB 4: DEVICES & BROWSERS */}
          {activeTab === 'devices' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <fieldset className="win-fieldset">
                  <legend className="win-legend">Jenis Perangkat</legend>
                  <div className="win-table-container">
                    <table className="win-table">
                      <thead>
                        <tr>
                          <th>Tipe</th>
                          <th>Klik</th>
                          <th>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.devices.map((d, i) => (
                          <tr key={i}>
                            <td style={{ textTransform: 'capitalize' }}>
                              {d.device === 'mobile' ? '📱 Mobile' : d.device === 'tablet' ? '📟 Tablet' : '🖥️ Desktop'}
                            </td>
                            <td><strong>{d.count}</strong></td>
                            <td>{d.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </fieldset>

                <fieldset className="win-fieldset">
                  <legend className="win-legend">Browser</legend>
                  <div className="win-table-container">
                    <table className="win-table">
                      <thead>
                        <tr>
                          <th>Browser</th>
                          <th>Klik</th>
                          <th>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.browsers.map((b, i) => (
                          <tr key={i}>
                            <td>🌐 {b.browser}</td>
                            <td><strong>{b.count}</strong></td>
                            <td>{b.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </fieldset>
              </div>
            </div>
          )}
        </div>
      </WinWindow>

      {/* QR Code Modal */}
      {isQrOpen && (
        <QrCodeModal
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
          url={shortUrl}
          shortCode={link.short_code}
        />
      )}
    </div>
  );
}
