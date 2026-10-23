'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import UrlShortenerForm from '@/components/UrlShortenerForm';
import WinWindow from '@/components/WinWindow';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function HomePage() {
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) setUser({ email: data.user.email });
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ? { email: session.user.email } : null);
      });

      return () => {
        authListener?.subscription.unsubscribe();
      };
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
  }, []);

  const handleLogOff = async () => {
    if (confirm('Apakah Anda yakin ingin Log Off dari akun Anda?')) {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gua_demo_user');
      }
      setUser(null);
      window.location.reload();
    }
  };

  return (
    <div className="container">
      {/* Desktop Icons Row/Column */}
      <div className="desktop-icon-grid">
        <Link href="/" className="desktop-icon">
          <span style={{ fontSize: '32px' }}>🌐</span>
          <span className="desktop-icon-label">gua.my.id</span>
        </Link>

        <Link href="/dashboard" className="desktop-icon">
          <span style={{ fontSize: '32px' }}>📁</span>
          <span className="desktop-icon-label">Link Manager</span>
        </Link>

        {/* Dynamic Log In / Log Off Icon */}
        {user ? (
          <div
            className="desktop-icon"
            onClick={handleLogOff}
            title={`Klik untuk Log Off (${user.email})`}
          >
            <span style={{ fontSize: '32px' }}>🚪</span>
            <span className="desktop-icon-label">Log Off</span>
          </div>
        ) : (
          <Link href="/auth/login" className="desktop-icon" title="Klik untuk Log In">
            <span style={{ fontSize: '32px' }}>🔑</span>
            <span className="desktop-icon-label">Log In</span>
          </Link>
        )}
      </div>

      {/* Main Window 1: Shortener Engine */}
      <div style={{ maxWidth: 720, margin: '0 auto 24px auto' }}>
        <WinWindow
          title="gua.my.id - Pendekin URL Klasik [v1.0]"
          icon="🌐"
          statusText="Siap menerima tautan panjang"
        >
          {/* Retro Greeting Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            background: 'var(--win-blue)',
            color: '#fff',
            marginBottom: 14,
            boxShadow: 'var(--win-inset)',
          }}>
            <span style={{ fontSize: '28px' }}>🚀</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                Selamat Datang di Pendekin URL gua.my.id
              </div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                Ubah URL panjang menjadi tautan cepat &amp; pantau analitik pengunjung dengan database Supabase.
              </div>
            </div>
          </div>

          <UrlShortenerForm />
        </WinWindow>
      </div>

      {/* Main Window 2: README / Help.txt */}
      <div style={{ maxWidth: 720, margin: '0 auto 24px auto' }}>
        <WinWindow
          title="FITUR_APLIKASI.TXT - Notepad"
          icon="📝"
          statusText="Ln 1, Col 1"
        >
          <div className="win-well" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.5, maxHeight: 180, overflowY: 'auto' }}>
            =============================================================<br />
            DOKUMENTASI SISTEM URL SHORTENER gua.my.id (WINDOWS 95 EDITION)<br />
            =============================================================<br /><br />
            [1] KEAMANAN &amp; PRIVASI<br />
            - Pembuatan tautan WAJIB mendaftar / masuk akun terlebih dahulu.<br />
            - Setiap tautan terikat dengan akun pembuatnya (user_id).<br />
            - Hanya pemilik akun yang dapat melihat riwayat dan analitik tautan miliknya.<br /><br />
            [2] FITUR DASAR (MVP)<br />
            - Input &amp; validasi otomatis protokol link (http / https)<br />
            - Algoritma auto-generator 6-karakter acak unik Base62<br />
            - Tombol sekali klik Copy to Clipboard<br />
            - Mekanisme pengalihan HTTP 302 berkecepatan tinggi di Next.js App Router<br /><br />
            [3] KUSTOMISASI &amp; AKUN (DASHBOARD)<br />
            - Custom Alias: gua.my.id/promo-anda<br />
            - Autentikasi Supabase: Login, Register, Google OAuth<br />
            - Manajemen Link: Edit URL tujuan, pause/aktifkan status, hapus tautan<br />
            - QR Code Generator: Otomatis dibuat &amp; dapat diunduh (PNG/SVG)<br /><br />
            [4] FITUR ANALITIK (TRACKING)<br />
            - Click Counter: Menghitung total klik dan pengunjung unik<br />
            - Geolokasi: Melacak negara dan kota pengunjung<br />
            - Referrer Tracking: Melacak sumber klik (Direct, WA, X, Google, dll)<br />
            - Data Perangkat &amp; Browser: HP, Desktop, Chrome, Safari, dll.<br />
            =============================================================
          </div>
        </WinWindow>
      </div>
    </div>
  );
}
