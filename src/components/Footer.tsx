import React from 'react';
import Link from 'next/link';
import { Link2, Shield, Zap, Database } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      background: 'rgba(7, 9, 14, 0.85)',
      marginTop: 'auto',
      padding: '48px 0 28px 0',
      position: 'relative',
      zIndex: 1,
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 36,
          marginBottom: 40,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Link2 size={18} color="#ffffff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>
                gua<span className="brand-badge">.my.id</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: 300 }}>
              Layanan pendekin URL modern, aman, dan berkecepatan tinggi dengan integrasi Supabase, analitik geolokasi, dan QR Code dinamis.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-main)', marginBottom: 14 }}>
              Fitur Unggulan
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              <li>✓ HTTP 302 Redirection Berkecepatan Tinggi</li>
              <li>✓ Custom Alias URL Sesuai Keinginan</li>
              <li>✓ QR Code Generator Otomatis & Download</li>
              <li>✓ Analitik Klik, Perangkat, & Referrer Real-time</li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-main)', marginBottom: 14 }}>
              Teknologi
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Database size={16} color="#38bdf8" />
                <span>Supabase PostgreSQL & Auth</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} color="#f59e0b" />
                <span>Next.js App Router & SSR Redirect</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={16} color="#10b981" />
                <span>Row Level Security (RLS) Protection</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: '0.82rem',
          color: 'var(--text-dim)',
        }}>
          <div>
            © {new Date().getFullYear()} gua.my.id — Hak cipta dilindungi.
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/" style={{ color: 'var(--text-muted)' }}>Beranda</Link>
            <Link href="/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
