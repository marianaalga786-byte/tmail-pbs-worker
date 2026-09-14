"use client";

import { formatCompactDate } from '../admin-utils';

export default function AdminDomainsSection({
  domainFilterStatus,
  domainPagination,
  domainQuery,
  domainRows,
  loading,
  newDomain,
  onAddDomain,
  onRemoveDomain,
  onToggleDomain,
  setDomainFilterStatus,
  setDomainPage,
  setDomainQuery,
  setNewDomain
}) {
  return (
    <div className="admin-panel">
      <div className="admin-panel-header flex-wrap gap-2">
        <h5 className="mb-0">Manajemen Domain</h5>
        <div className="admin-toolbar-group">
          <input
            className="form-control form-control-sm admin-toolbar-field"
            placeholder="Cari domain..."
            value={domainQuery}
            onChange={(e) => setDomainQuery(e.target.value)}
          />
          <select className="form-select form-select-sm admin-toolbar-field" value={domainFilterStatus} onChange={(e) => setDomainFilterStatus(e.target.value)}>
            <option value="all">Status: Semua</option>
            <option value="aktif">Status: Aktif</option>
            <option value="nonaktif">Status: Nonaktif</option>
          </select>
        </div>
      </div>

      <div className="admin-add-row">
        <label className="form-label mb-0">Domain baru:</label>
        <input
          className="form-control form-control-sm"
          placeholder="example.com"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAddDomain()}
        />
        <button className="btn btn-sm btn-primary" onClick={onAddDomain} disabled={!newDomain.trim()}>
          <i className="bi bi-plus-lg me-1" />Tambah Domain
        </button>
      </div>

      <div className="admin-pagination-bar">
        <small className="text-muted">{domainPagination.rows.length} / {domainPagination.total} domain</small>
        <div className="admin-page-controls">
          <button
            className="admin-page-btn"
            onClick={() => setDomainPage((p) => Math.max(1, p - 1))}
            disabled={domainPagination.page <= 1}
          >
            <i className="bi bi-chevron-left" />
          </button>
          <span className="admin-page-info">{domainPagination.page} / {domainPagination.totalPages}</span>
          <button
            className="admin-page-btn"
            onClick={() => setDomainPage((p) => Math.min(domainPagination.totalPages, p + 1))}
            disabled={domainPagination.page >= domainPagination.totalPages}
          >
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0 admin-table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Dibuat</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {domainRows.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="admin-empty">
                    <i className="bi bi-globe2" />
                    <p>Belum ada domain yang dikonfigurasi.</p>
                  </div>
                </td>
              </tr>
            )}
            {domainPagination.rows.map((domain) => (
              <tr key={domain.name}>
                <td className="fw-600">{domain.name}</td>
                <td className="text-nowrap">{formatCompactDate(domain.createdAt)}</td>
                <td>
                  <span className={`badge ${domain.active !== false ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                    {domain.active !== false ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td>
                  <div className="admin-row-actions">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onToggleDomain(domain.name, domain.active === false)}
                      disabled={loading}
                    >
                      {domain.active !== false ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button className="btn btn-sm btn-icon btn-outline-danger" title="Hapus domain" onClick={() => onRemoveDomain(domain.name)} disabled={loading}>
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
