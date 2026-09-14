"use client";

import { ADMIN_THEMES } from '../admin-utils';

export default function AdminAppearanceSection({ activeTheme, themeLoading, onSaveTheme }) {
  const activeThemeDetails = ADMIN_THEMES.find((theme) => theme.id === activeTheme) || ADMIN_THEMES[0];

  return (
    <div className="row g-4">
      <div className="col-12 col-lg-8">
        <div className="admin-panel">
          <h5 className="mb-1">Tema Halaman Utama</h5>
          <p className="text-muted small mb-4">
            Pilih tema warna yang akan ditampilkan kepada pengguna di halaman utama PBS Mail.
            Perubahan langsung tersimpan dan berlaku untuk semua pengguna.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
            {ADMIN_THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => onSaveTheme(theme.id)}
                disabled={themeLoading}
                style={{
                  border: `2px solid ${activeTheme === theme.id ? theme.swatches[0] : 'transparent'}`,
                  borderRadius: '16px',
                  padding: '1rem',
                  background: activeTheme === theme.id ? `${theme.swatches[0]}12` : 'var(--bs-body-bg, #ffffff)',
                  cursor: themeLoading ? 'wait' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  boxShadow: activeTheme === theme.id ? `0 0 0 1px ${theme.swatches[0]}40, 0 4px 12px ${theme.swatches[0]}25` : '0 1px 4px rgba(0,0,0,0.08)',
                }}
              >
                <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.75rem' }}>
                  {theme.swatches.map((color, index) => (
                    <div key={index} style={{ flex: 1, height: 28, borderRadius: '6px', background: color }} />
                  ))}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{theme.name}</div>
                {activeTheme === theme.id && (
                  <div style={{ fontSize: '0.75rem', color: theme.swatches[0], marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <i className="bi bi-check-circle-fill" /> Aktif
                  </div>
                )}
              </button>
            ))}
          </div>
          {themeLoading && (
            <div className="d-flex align-items-center gap-2 mt-3 text-muted">
              <div className="spinner-border spinner-border-sm" role="status" />
              <span className="small">Menyimpan tema...</span>
            </div>
          )}
        </div>
      </div>
      <div className="col-12 col-lg-4">
        <div className="admin-panel h-100">
          <h5 className="mb-3">Pratinjau Warna</h5>
          <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ background: `linear-gradient(135deg, ${activeThemeDetails.swatches[0]}, ${activeThemeDetails.swatches[1]})`, padding: '1.25rem 1rem', color: '#fff' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>PBS Mail</div>
              <div style={{ opacity: 0.8, fontSize: '0.78rem' }}>Email Sementara, Tanpa Ribet</div>
            </div>
            <div style={{ padding: '1rem', background: '#fff' }}>
              <div style={{ border: `1.5px solid ${activeThemeDetails.swatches[0]}40`, borderRadius: '8px', padding: '0.7rem 1rem', fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace', marginBottom: '0.75rem', background: '#f8fafc' }}>
                alias@domain.com
              </div>
              <div style={{ background: activeThemeDetails.swatches[0], color: '#fff', borderRadius: '8px', padding: '0.6rem 1rem', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center' }}>
                Salin Alamat
              </div>
            </div>
          </div>
          <p className="small text-muted mt-3 mb-0">
            Tema <strong>{activeThemeDetails.name}</strong> saat ini aktif.
          </p>
        </div>
      </div>
    </div>
  );
}
