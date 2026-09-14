"use client";

import { formatDateTime } from './admin-utils';

export default function AdminMessageModal({ detail, onClose }) {
  if (!detail) return null;

  return (
    <div className="modal fade show d-block" style={{ background: 'rgba(15,23,42,0.45)' }} onClick={onClose}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable" onClick={(event) => event.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header border-0 bg-light">
            <div className="w-100 d-flex align-items-start justify-content-between gap-2">
              <div>
                <h5 className="modal-title mb-1">{detail.loading ? 'Memuat pesan...' : detail.subject || '(tanpa subjek)'}</h5>
                {!detail.loading && !detail.error && <small className="text-muted">{detail.from || '-'} | {formatDateTime(detail.date)}</small>}
              </div>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
          </div>
          <div className="modal-body">
            {detail.loading && <div className="text-center text-muted py-5"><div className="spinner-border spinner-border-sm mb-2" role="status" /><div className="small">Memuat detail pesan...</div></div>}
            {detail.error && <div className="alert alert-danger mb-0">{detail.error}</div>}
            {!detail.loading && !detail.error && (
              <div className="admin-message-view">
                {detail.bodyHtml ? <div dangerouslySetInnerHTML={{ __html: detail.bodyHtml }} /> : detail.bodyText ? <pre className="admin-message-pre">{detail.bodyText}</pre> : <p className="text-muted small mb-0">Tidak ada konten</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
