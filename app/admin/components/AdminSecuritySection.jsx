"use client";

import Link from 'next/link';
import { formatCompactDate } from '../admin-utils';

export default function AdminSecuritySection({ aliasRows, domains, loading, onEnableGmailPush, onRevokeToken, stats }) {
  return (
    <div className="row g-4">
      <div className="col-12 col-lg-6">
        <div className="admin-panel h-100">
          <h5 className="mb-3">Kontrol OAuth</h5>
          <p className="text-muted small">Kelola siklus token Gmail dengan aman dari satu tempat.</p>
          <div className="d-grid gap-2">
            <Link href="/login" target="_blank" className="btn btn-primary">
              <i className="bi bi-google me-2" /> Mulai OAuth
            </Link>
            <button className="btn btn-outline-danger" onClick={onRevokeToken} disabled={loading}>
              <i className="bi bi-shield-x me-2" /> Cabut Token
            </button>
          </div>
        </div>
      </div>
      <div className="col-12 col-lg-6">
        <div className="admin-panel h-100">
          <h5 className="mb-3">Gmail Push Notification</h5>
          <p className="text-muted small">Aktifkan push agar email masuk real-time tanpa polling. Perlu diperbarui setiap 7 hari.</p>
          <div className="d-grid gap-2">
            <button className="btn btn-success" disabled={loading} onClick={onEnableGmailPush}>
              <i className="bi bi-bell-fill me-2" /> Aktifkan Gmail Push
            </button>
          </div>
        </div>
      </div>
      <div className="col-12 col-lg-6">
        <div className="admin-panel h-100">
          <h5 className="mb-3">Ringkasan Penyimpanan & Kesehatan</h5>
          <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="text-muted">Mode Penyimpanan</span>
              <strong>{stats?.storage?.mode || '-'}</strong>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="text-muted">Total Domain</span>
              <strong>{domains.length}</strong>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="text-muted">Total Akses Alias</span>
              <strong>{stats?.totalHits ?? aliasRows.reduce((sum, row) => sum + (row.hits || 0), 0)}</strong>
            </li>
            <li className="list-group-item d-flex justify-content-between px-0">
              <span className="text-muted">Alias Terbaru</span>
              <strong>{formatCompactDate(stats?.lastAliasCreatedAt)}</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
