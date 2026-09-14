"use client";

import { formatDateTime } from '../admin-utils';

export default function AdminOverviewSection({
  activeDomains,
  aliasRows,
  aliasesWithTraffic,
  inactiveAliases,
  loading,
  overviewAliasPagination,
  overviewLatestPagination,
  setOverviewAliasPage,
  setOverviewLogPage,
  setSection,
  stats
}) {
  return (
    <>
      <div className="admin-guide mb-3">
        <h6 className="mb-2">Panduan Cepat (Untuk Pengguna Baru)</h6>
        <div className="admin-guide-grid">
          <div className="admin-guide-item">
            <strong>1. Atur Domain</strong>
            <p className="mb-0">Masuk ke menu Domain, lalu tambahkan domain aktif yang boleh dipakai alias.</p>
          </div>
          <div className="admin-guide-item">
            <strong>2. Buat Alias + Filter</strong>
            <p className="mb-0">Di menu Alias, isi alamat alias lalu atur filter email agar sesuai kebutuhan.</p>
          </div>
          <div className="admin-guide-item">
            <strong>3. Cek Kotak Masuk</strong>
            <p className="mb-0">Di menu Kotak Masuk, admin bisa melihat semua email alias tanpa dibatasi filter.</p>
          </div>
          <div className="admin-guide-item">
            <strong>4. Pantau Log</strong>
            <p className="mb-0">Gunakan menu Log Email untuk audit aktivitas per alias secara cepat.</p>
          </div>
        </div>
      </div>

      {loading && !stats ? (
        <div className="admin-kpi-grid">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div key={idx} className="admin-kpi-card admin-skeleton-card">
              <div className="admin-skeleton" style={{ width: 36, height: 36, borderRadius: 12 }} />
              <div className="admin-skeleton admin-skeleton-line" style={{ width: '60%' }} />
              <div className="admin-skeleton" style={{ width: '40%', height: 22, marginTop: 12 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-kpi-grid">
          <article className="admin-kpi-card">
            <div className="admin-kpi-icon bg-primary-subtle text-primary"><i className="bi bi-at" /></div>
            <p className="admin-kpi-label">Total Alias</p>
            <h3 className="admin-kpi-value">{stats?.totalAliases ?? aliasRows.length}</h3>
          </article>
          <article className="admin-kpi-card">
            <div className="admin-kpi-icon bg-success-subtle text-success"><i className="bi bi-envelope-check" /></div>
            <p className="admin-kpi-label">Log Email Tersimpan</p>
            <h3 className="admin-kpi-value">{overviewLatestPagination.total}</h3>
          </article>
          <article className="admin-kpi-card">
            <div className="admin-kpi-icon bg-warning-subtle text-warning"><i className="bi bi-globe2" /></div>
            <p className="admin-kpi-label">Domain Aktif</p>
            <h3 className="admin-kpi-value">{activeDomains.length}</h3>
          </article>
          <article className="admin-kpi-card">
            <div className="admin-kpi-icon bg-info-subtle text-info"><i className="bi bi-graph-up-arrow" /></div>
            <p className="admin-kpi-label">Alias Dengan Trafik</p>
            <h3 className="admin-kpi-value">{aliasesWithTraffic}</h3>
          </article>
          <article className="admin-kpi-card">
            <div className="admin-kpi-icon bg-danger-subtle text-danger"><i className="bi bi-archive" /></div>
            <p className="admin-kpi-label">Alias Diarsipkan</p>
            <h3 className="admin-kpi-value">{inactiveAliases}</h3>
          </article>
        </div>
      )}

      <div className="row g-4 mt-1">
        <div className="col-12 col-xl-6">
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h5 className="mb-0">Alias Paling Aktif</h5>
              <button className="btn btn-sm btn-outline-primary" onClick={() => setSection('aliases')}>Kelola Alias</button>
            </div>
            {aliasRows.length === 0 ? (
              <p className="text-muted small mb-0">Belum ada data alias.</p>
            ) : (
              <>
                {overviewAliasPagination.total > 0 && (
                  <div className="admin-pagination-bar">
                    <small className="text-muted">{overviewAliasPagination.rows.length} / {overviewAliasPagination.total} alias</small>
                    <div className="admin-page-controls">
                      <button className="admin-page-btn" onClick={() => setOverviewAliasPage((p) => Math.max(1, p - 1))} disabled={overviewAliasPagination.page <= 1}>
                        <i className="bi bi-chevron-left" />
                      </button>
                      <span className="admin-page-info">{overviewAliasPagination.page} / {overviewAliasPagination.totalPages}</span>
                      <button className="admin-page-btn" onClick={() => setOverviewAliasPage((p) => Math.min(overviewAliasPagination.totalPages, p + 1))} disabled={overviewAliasPagination.page >= overviewAliasPagination.totalPages}>
                        <i className="bi bi-chevron-right" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 admin-table">
                    <thead><tr><th>Alias</th><th className="text-end">Email</th><th className="text-end">Akses</th></tr></thead>
                    <tbody>
                      {overviewAliasPagination.rows.map((row) => (
                        <tr key={row.address}>
                          <td><div className="fw-600 text-break">{row.address}</div><small className="text-muted">Email terakhir: {formatDateTime(row.latestSeenAt)}</small></td>
                          <td className="text-end fw-600">{row.totalEmails}</td>
                          <td className="text-end">{row.hits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="col-12 col-xl-6">
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h5 className="mb-0">Email Masuk Terbaru</h5>
              <button className="btn btn-sm btn-outline-primary" onClick={() => setSection('logs')}>Lihat Semua Log</button>
            </div>
            {overviewLatestPagination.total === 0 ? (
              <p className="text-muted small mb-0">Belum ada log email.</p>
            ) : (
              <>
                {overviewLatestPagination.total > 0 && (
                  <div className="admin-pagination-bar">
                    <small className="text-muted">{overviewLatestPagination.rows.length} / {overviewLatestPagination.total} log</small>
                    <div className="admin-page-controls">
                      <button className="admin-page-btn" onClick={() => setOverviewLogPage((p) => Math.max(1, p - 1))} disabled={overviewLatestPagination.page <= 1}>
                        <i className="bi bi-chevron-left" />
                      </button>
                      <span className="admin-page-info">{overviewLatestPagination.page} / {overviewLatestPagination.totalPages}</span>
                      <button className="admin-page-btn" onClick={() => setOverviewLogPage((p) => Math.min(overviewLatestPagination.totalPages, p + 1))} disabled={overviewLatestPagination.page >= overviewLatestPagination.totalPages}>
                        <i className="bi bi-chevron-right" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="admin-timeline">
                  {overviewLatestPagination.rows.map((entry) => (
                    <div key={entry.id} className="admin-timeline-item">
                      <div className="admin-timeline-dot" />
                      <div className="admin-timeline-content">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <strong className="text-break">{entry.alias || 'alias-tidak-dikenal'}</strong>
                          <small className="text-muted text-nowrap">{formatDateTime(entry.lastSeenAt)}</small>
                        </div>
                        <div className="small fw-500 text-break">{entry.subject || '(tanpa subjek)'}</div>
                        <div className="small text-muted text-break">{entry.from || '-'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
