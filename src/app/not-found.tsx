'use client';

import React from 'react';
import Link from 'next/link';
import WinWindow from '@/components/WinWindow';

export default function NotFound() {
  return (
    <div className="container" style={{ maxWidth: 440, marginTop: 80 }}>
      <WinWindow
        title="404 - Tautan Tidak Ditemukan"
        icon="❌"
        statusText="HTTP 404 Not Found"
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: 10 }}>
          <div style={{ fontSize: '38px', lineHeight: 1 }}>
            ❌
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: 8, color: '#000' }}>
              Tautan pendek ini tidak ditemukan atau sudah dinonaktifkan.
            </p>
            <p style={{ fontSize: '11px', color: '#555', marginBottom: 16 }}>
              Pastikan ejaan kode URL pendek sudah benar, atau tautan telah dihapus oleh pemiliknya.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Link href="/" className="win-btn win-btn-default">
                OK (Kembali ke Beranda)
              </Link>
            </div>
          </div>
        </div>
      </WinWindow>
    </div>
  );
}
