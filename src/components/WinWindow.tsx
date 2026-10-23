'use client';

import React from 'react';

interface WinWindowProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  showControls?: boolean;
  onClose?: () => void;
  statusText?: string;
  style?: React.CSSProperties;
}

export default function WinWindow({
  title,
  icon = '🌐',
  children,
  showControls = true,
  onClose,
  statusText = 'Ready',
  style,
}: WinWindowProps) {
  return (
    <div className="win-window" style={style}>
      {/* Titlebar */}
      <div className="win-titlebar">
        <div className="win-title-group">
          <span>{icon}</span>
          <span>{title}</span>
        </div>
        {showControls && (
          <div className="win-controls">
            <button className="win-btn-control" title="Minimize" tabIndex={-1}>_</button>
            <button className="win-btn-control" title="Maximize" tabIndex={-1}>□</button>
            <button
              className="win-btn-control"
              title="Close"
              tabIndex={-1}
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Menu Bar */}
      <div className="win-menubar">
        <span className="win-menuitem"><u>F</u>ile</span>
        <span className="win-menuitem"><u>E</u>dit</span>
        <span className="win-menuitem"><u>V</u>iew</span>
        <span className="win-menuitem"><u>H</u>elp</span>
      </div>

      {/* Content Area */}
      <div style={{ padding: '12px' }}>
        {children}
      </div>

      {/* Status Bar */}
      <div className="win-statusbar">
        <div className="win-status-panel" style={{ flex: 1 }}>{statusText}</div>
        <div className="win-status-panel">gua.my.id</div>
      </div>
    </div>
  );
}
