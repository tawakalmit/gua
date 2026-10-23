'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeModalProps {
  url: string;
  shortCode: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function QrCodeModal({ url, shortCode, isOpen, onClose }: QrCodeModalProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [theme, setTheme] = useState<'bw' | 'blue' | 'teal'>('bw');

  const getColorConfig = () => {
    if (theme === 'blue') return { dark: '#000080', light: '#ffffff' };
    if (theme === 'teal') return { dark: '#008080', light: '#ffffff' };
    return { dark: '#000000', light: '#ffffff' };
  };

  useEffect(() => {
    if (!isOpen || !url) return;
    const colors = getColorConfig();

    QRCode.toDataURL(url, {
      width: 256,
      margin: 1,
      color: colors,
    })
      .then((res) => setDataUrl(res))
      .catch((err) => console.error(err));
  }, [url, isOpen, theme]);

  if (!isOpen) return null;

  const handleDownloadPng = () => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qrcode-${shortCode}.png`;
    a.click();
  };

  const handleDownloadSvg = async () => {
    try {
      const colors = getColorConfig();
      const svgString = await QRCode.toString(url, {
        type: 'svg',
        color: colors,
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `qrcode-${shortCode}.svg`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="win-modal-overlay" onClick={onClose}>
      <div
        className="win-window"
        style={{ width: 380, maxWidth: '95vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="win-titlebar">
          <div className="win-title-group">
            <span>🖨️</span>
            <span>QR Code Viewer - /{shortCode}</span>
          </div>
          <div className="win-controls">
            <button className="win-btn-control" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 14 }}>
          {/* Sunken display box */}
          <div className="win-well" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12, padding: 16 }}>
            {dataUrl ? (
              <img
                src={dataUrl}
                alt="QR Code"
                style={{ width: 180, height: 180, display: 'block', imageRendering: 'pixelated' }}
              />
            ) : (
              <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Generating...
              </div>
            )}
            <div style={{ marginTop: 8, fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#000080', fontWeight: 'bold' }}>
              {url}
            </div>
          </div>

          {/* Color radio options */}
          <fieldset className="win-fieldset" style={{ marginBottom: 14 }}>
            <legend className="win-legend">Skema Warna</legend>
            <div style={{ display: 'flex', gap: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="qrTheme"
                  checked={theme === 'bw'}
                  onChange={() => setTheme('bw')}
                />
                <span>Hitam-Putih</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="qrTheme"
                  checked={theme === 'blue'}
                  onChange={() => setTheme('blue')}
                />
                <span>Navy 95</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="qrTheme"
                  checked={theme === 'teal'}
                  onChange={() => setTheme('teal')}
                />
                <span>Teal Desktop</span>
              </label>
            </div>
          </fieldset>

          {/* Dialog Action Buttons */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" onClick={handleDownloadPng} className="win-btn">
              💾 Unduh PNG
            </button>
            <button type="button" onClick={handleDownloadSvg} className="win-btn">
              💾 Unduh SVG
            </button>
            <button type="button" onClick={handleCopyLink} className="win-btn">
              {copied ? '✓ Tersalin!' : '📋 Salin Link'}
            </button>
            <button type="button" onClick={onClose} className="win-btn win-btn-default">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
