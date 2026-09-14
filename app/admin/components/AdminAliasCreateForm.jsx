"use client";

export default function AdminAliasCreateForm({
  activeDomains,
  aliasFilterMode,
  aliasFormAddress,
  aliasKeywordIncludes,
  aliasCustomRegex,
  aliasPin,
  aliasSenderIncludes,
  aliasSubjectExact,
  aliasSubjectExcludes,
  aliasSubjectIncludes,
  loading,
  onGenerateAlias,
  onReset,
  onSave,
  setAliasFilterMode,
  setAliasFormAddress,
  setAliasKeywordIncludes,
  setAliasCustomRegex,
  setAliasPin,
  setAliasSenderIncludes,
  setAliasSubjectExact,
  setAliasSubjectExcludes,
  setAliasSubjectIncludes
}) {
  const presets = [
    { key: 'all', icon: 'bi-envelope-check', title: 'Terima Semua Email', description: 'Tidak ada penyaringan. Semua email yang masuk akan diteruskan ke alias ini.' },
    { key: 'netflix-household', icon: 'bi-film', title: 'Netflix Household', description: 'Hanya email kode akses sementara dari Netflix yang disimpan di TMail.' },
    { key: 'custom', icon: 'bi-sliders', title: 'Atur Filter Sendiri', description: 'Tentukan pengirim, subjek, atau kata kunci yang ingin diterima.' }
  ];

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h5 className="mb-0"><i className="bi bi-plus-circle me-2" />Buat Alias Baru</h5>
      </div>
      <div className="p-4">
        <div className="d-flex align-items-center gap-2 mb-4" style={{ fontSize: '0.8rem', color: 'var(--bs-secondary-color)' }}>
          {['1. Alamat', '2. PIN (opsional)', '3. Aturan Email'].map((step, index) => (
            <span key={step} className="d-flex align-items-center gap-2">
              {index > 0 && <i className="bi bi-chevron-right" style={{ fontSize: '0.65rem' }} />}
              <span className={index === 2 ? 'text-primary fw-bold' : 'fw-semibold'}>{step}</span>
            </span>
          ))}
        </div>

        <section className="mb-4">
          <label className="form-label fw-bold mb-2" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--bs-secondary-color)' }}>1. Pilih Alamat Email</label>
          <div style={{ display: 'flex', alignItems: 'stretch', border: '1.5px solid var(--bs-border-color)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bs-tertiary-bg)', marginBottom: '0.75rem' }}>
            <input
              value={aliasFormAddress.split('@')[0] || ''}
              onChange={(e) => {
                const domain = aliasFormAddress.includes('@') ? aliasFormAddress.split('@')[1] : (activeDomains[0]?.name || '');
                setAliasFormAddress(e.target.value.replace(/\s+/g, '').toLowerCase() + (domain ? '@' + domain : ''));
              }}
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '0.875rem 1rem', fontSize: '1rem', fontWeight: 500, outline: 'none', minWidth: 0 }}
              placeholder="nama-anda"
              spellCheck="false"
            />
            <span style={{ padding: '0 0.5rem', display: 'flex', alignItems: 'center', fontSize: '1rem', color: 'var(--bs-secondary-color)', fontWeight: 600 }}>@</span>
            <select
              value={aliasFormAddress.includes('@') ? aliasFormAddress.split('@')[1] : ''}
              onChange={(e) => setAliasFormAddress((aliasFormAddress.split('@')[0] || '') + '@' + e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '0.875rem 0.75rem', fontSize: '0.95rem', fontWeight: 500, outline: 'none', cursor: 'pointer', maxWidth: 200, minWidth: 120, appearance: 'none', WebkitAppearance: 'none' }}
            >
              {activeDomains.length === 0 && <option value="">-</option>}
              {activeDomains.map((domain) => <option key={domain.name} value={domain.name}>{domain.name}</option>)}
            </select>
          </div>
          {aliasFormAddress.includes('@') && <div className="rounded-3 px-3 py-2" style={{ background: 'rgba(var(--bs-primary-rgb), 0.06)', border: '1px solid rgba(var(--bs-primary-rgb), 0.15)', fontFamily: 'monospace', fontSize: '0.9rem' }}><i className="bi bi-envelope-fill text-primary me-2" />{aliasFormAddress}</div>}
        </section>

        <section className="mb-4">
          <label className="form-label fw-bold mb-2" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--bs-secondary-color)' }}><i className="bi bi-shield-lock me-1" />2. PIN Proteksi (Opsional)</label>
          <input className="form-control" value={aliasPin} onChange={(e) => setAliasPin(e.target.value)} placeholder="Kosongkan jika tidak pakai" type="text" autoComplete="off" style={{ maxWidth: 360, letterSpacing: '0.1em' }} />
          <small className="text-muted d-block mt-1">User harus memasukkan PIN ini untuk membuka inbox alias.</small>
        </section>

        <section>
          <label className="form-label fw-bold mb-2" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--bs-secondary-color)' }}><i className="bi bi-funnel me-1" />3. Aturan Email</label>
          <p className="small text-muted mb-3">Pilih email mana yang boleh masuk ke alias ini.</p>
          <div className="row g-2 mb-3">
            {presets.map((preset) => {
              const selected = aliasFilterMode === preset.key;
              return <div className="col-12 col-lg-4" key={preset.key}><button type="button" className="w-100 text-start" onClick={() => setAliasFilterMode(preset.key)} style={{ border: selected ? '2px solid var(--bs-primary)' : '1px solid var(--bs-border-color)', background: selected ? 'rgba(var(--bs-primary-rgb), 0.08)' : 'var(--bs-tertiary-bg)', borderRadius: '12px', padding: '0.9rem', color: 'inherit' }}><div className="fw-bold mb-1"><i className={`bi ${preset.icon} me-2 text-primary`} />{preset.title}</div><div className="small text-muted">{preset.description}</div></button></div>;
            })}
          </div>
          {aliasFilterMode === 'netflix-household' && <div className="rounded-3 p-3 small" style={{ background: 'rgba(var(--bs-primary-rgb), 0.06)', border: '1px solid rgba(var(--bs-primary-rgb), 0.15)' }}><i className="bi bi-check-circle-fill text-primary me-2" />Menyimpan kode akses sementara Netflix dari `info@account.netflix.com`. Email lain tidak akan muncul di inbox TMail.</div>}
          {aliasFilterMode === 'custom' && <div className="p-3 rounded-3" style={{ background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)' }}><div className="row g-2"><div className="col-12 col-md-6"><label className="form-label small mb-1">Subjek Persis</label><input className="form-control form-control-sm" placeholder="kode akses sementaramu" value={aliasSubjectExact} onChange={(e) => setAliasSubjectExact(e.target.value)} /></div><div className="col-12 col-md-6"><label className="form-label small mb-1">Subjek Mengandung</label><input className="form-control form-control-sm" placeholder="kode akses, verifikasi" value={aliasSubjectIncludes} onChange={(e) => setAliasSubjectIncludes(e.target.value)} /></div><div className="col-12 col-md-6"><label className="form-label small mb-1">Subjek Dikecualikan</label><input className="form-control form-control-sm" placeholder="newsletter, promosi" value={aliasSubjectExcludes} onChange={(e) => setAliasSubjectExcludes(e.target.value)} /></div><div className="col-12 col-md-6"><label className="form-label small mb-1">Pengirim Mengandung</label><input className="form-control form-control-sm" placeholder="no-reply@x.com" value={aliasSenderIncludes} onChange={(e) => setAliasSenderIncludes(e.target.value)} /></div><div className="col-12 col-md-6"><label className="form-label small mb-1">Kata Kunci</label><input className="form-control form-control-sm" placeholder="kode verifikasi, akun" value={aliasKeywordIncludes} onChange={(e) => setAliasKeywordIncludes(e.target.value)} /></div><div className="col-12 col-md-6"><label className="form-label small mb-1">Regex Kustom</label><input className="form-control form-control-sm" placeholder="(otp|code)\\s*..." value={aliasCustomRegex} onChange={(e) => setAliasCustomRegex(e.target.value)} /></div></div></div>}
        </section>

        <div className="d-flex gap-2 mt-4" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ borderRadius: '10px', padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.9rem' }} onClick={onSave} disabled={loading || !aliasFormAddress.includes('@')}><i className="bi bi-floppy me-2" />Simpan Alias</button>
          <button className="btn btn-outline-primary" style={{ borderRadius: '10px', padding: '0.6rem 1rem', fontWeight: 600, fontSize: '0.9rem' }} type="button" onClick={onGenerateAlias}><i className="bi bi-shuffle me-1" />Acak</button>
          <button className="btn btn-outline-secondary" style={{ borderRadius: '10px', padding: '0.6rem 1rem', fontWeight: 600, fontSize: '0.9rem' }} onClick={onReset}><i className="bi bi-eraser me-1" />Reset</button>
        </div>
      </div>
    </div>
  );
}
