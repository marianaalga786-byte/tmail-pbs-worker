"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import AdminMessageModal from './AdminMessageModal';
import AdminAppearanceSection from './components/AdminAppearanceSection';
import AdminAliasCreateForm from './components/AdminAliasCreateForm';
import AdminDomainsSection from './components/AdminDomainsSection';
import AdminOverviewSection from './components/AdminOverviewSection';
import AdminSecuritySection from './components/AdminSecuritySection';
import {
  ADMIN_THEMES,
  ADMIN_THEME_MAP,
  formatCompactDate,
  formatDateTime,
  hasActiveFilterConfig,
  hasAliasConfig,
  localizeErrorMessage,
  paginateRows,
  splitFilterInput
} from './admin-utils';

function useBootstrap() {
  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);
}

export default function AdminPage() {
  useBootstrap();
  const router = useRouter();

  const [accessToken, setAccessToken] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [sessionChecked, setSessionChecked] = useState(false);

  const [stats, setStats] = useState(null);
  const [aliases, setAliases] = useState([]);
  const [domains, setDomains] = useState([]);
  const [logs, setLogs] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [partnerApiEnabled, setPartnerApiEnabled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('disconnected');
  const [toast, setToast] = useState('');

  const [section, setSection] = useState('overview');
  const [newDomain, setNewDomain] = useState('');

  const [aliasQuery, setAliasQuery] = useState('');
  const [aliasSort, setAliasSort] = useState('activity');
  const [aliasFilterStatus, setAliasFilterStatus] = useState('all');
  const [aliasPage, setAliasPage] = useState(1);

  const [selectedAlias, setSelectedAlias] = useState('');
  const [logQuery, setLogQuery] = useState('');
  const [logSort, setLogSort] = useState('latest');
  const [logPage, setLogPage] = useState(1);
  const [aliasFormAddress, setAliasFormAddress] = useState('');
  const [aliasSubjectExact, setAliasSubjectExact] = useState('');
  const [aliasSubjectIncludes, setAliasSubjectIncludes] = useState('');
  const [aliasSubjectExcludes, setAliasSubjectExcludes] = useState('');
  const [aliasSenderIncludes, setAliasSenderIncludes] = useState('');
  const [aliasKeywordIncludes, setAliasKeywordIncludes] = useState('');
  const [aliasCustomRegex, setAliasCustomRegex] = useState('');
  const [aliasPin, setAliasPin] = useState('');
  const [aliasFilterMode, setAliasFilterMode] = useState('all');
  const [aliasListTab, setAliasListTab] = useState('all');
  const [inboxAlias, setInboxAlias] = useState('');
  const [inboxMessages, setInboxMessages] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxDetail, setInboxDetail] = useState(null);
  const [inboxQuery, setInboxQuery] = useState('');
  const [inboxSort, setInboxSort] = useState('latest');
  const [inboxPage, setInboxPage] = useState(1);

  const [domainQuery, setDomainQuery] = useState('');
  const [domainFilterStatus, setDomainFilterStatus] = useState('all');
  const [domainPage, setDomainPage] = useState(1);

  const [overviewAliasPage, setOverviewAliasPage] = useState(1);
  const [overviewLogPage, setOverviewLogPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState('blue');
  const [themeLoading, setThemeLoading] = useState(false);
  const [apiKeyName, setApiKeyName] = useState('');
  const [apiKeyScopes, setApiKeyScopes] = useState('alias:create, messages:read, otp:read');
  const [apiKeyRateLimit, setApiKeyRateLimit] = useState('60');
  const [apiKeyAllowedDomains, setApiKeyAllowedDomains] = useState('');
  const [apiKeyAllowedIps, setApiKeyAllowedIps] = useState('');
  const [apiKeyExpiresAt, setApiKeyExpiresAt] = useState('');
  const [issuedApiKeySecret, setIssuedApiKeySecret] = useState('');
  const [apiKeyQuery, setApiKeyQuery] = useState('');
  const [apiKeyPage, setApiKeyPage] = useState(1);

  useEffect(() => {
    const ensureSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/admin/login');
        return;
      }
      setAccessToken(data.session.access_token || '');
      setUserEmail(data.session.user?.email || '');
      setSessionChecked(true);
    };
    ensureSession();

    // Listen for token refresh events (auto-refresh before expiry)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        if (session?.access_token) {
          setAccessToken(session.access_token);
        }
      }
      if (event === 'SIGNED_OUT') {
        router.replace('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchWithAdmin = useCallback(async (path, options = {}) => {
    const authHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    const headers = { ...(options.headers || {}), ...authHeaders };
    if (options.body) headers['Content-Type'] = 'application/json';
    const res = await fetch(path, { cache: 'no-store', ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const suffix = body.code ? ` [${body.code}]` : '';
      throw new Error(`${body.error || `Request failed with ${res.status}`}${suffix}`);
    }
    return res.json();
  }, [accessToken]);

  const loadAll = useCallback(async () => {
    if (!sessionChecked || !accessToken) return;
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchWithAdmin('/api/admin/stats'),
        fetchWithAdmin('/api/admin/aliases'),
        fetchWithAdmin('/api/admin/domains'),
        fetchWithAdmin('/api/admin/logs?limit=5000'),
        fetchWithAdmin('/api/admin/keys')
      ]);

      const [statsRes, aliasesRes, domainsRes, logsRes, keysRes] = results;

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (aliasesRes.status === 'fulfilled') setAliases(aliasesRes.value.aliases || []);
      if (domainsRes.status === 'fulfilled') setDomains(domainsRes.value.domains || []);
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value.logs || []);
      if (keysRes.status === 'fulfilled') {
        setApiKeys(keysRes.value.keys || []);
        setPartnerApiEnabled(Boolean(keysRes.value.partnerApiEnabled));
      }

      const anyError = results.some((r) => r.status === 'rejected');
      setStatus('connected');
      setToast(anyError ? 'Sebagian data gagal dimuat' : 'Data berhasil dimuat');
    } catch (err) {
      console.error(err);
      setStatus('disconnected');
      setToast(localizeErrorMessage(err?.message) || 'Gagal memuat data admin');
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchWithAdmin, sessionChecked]);

  useEffect(() => {
    if (accessToken && sessionChecked) loadAll();
  }, [accessToken, loadAll, sessionChecked]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setAliasPage(1);
  }, [aliasQuery, aliasSort, aliasFilterStatus]);

  useEffect(() => {
    setLogPage(1);
  }, [logQuery, selectedAlias, logSort]);

  useEffect(() => {
    setInboxPage(1);
  }, [inboxAlias, inboxQuery, inboxSort]);

  useEffect(() => {
    setDomainPage(1);
  }, [domainQuery, domainFilterStatus]);

  useEffect(() => {
    setApiKeyPage(1);
  }, [apiKeyQuery]);

  useEffect(() => {
    if (!accessToken) return;
    fetchWithAdmin('/api/admin/theme')
      .then((d) => { if (d?.theme) setActiveTheme(d.theme); })
      .catch(() => {});
  }, [accessToken, fetchWithAdmin]);

  useEffect(() => {
    if (inboxAlias) return;
    const firstActive = aliases.find((row) => row.active !== false);
    if (firstActive) setInboxAlias(firstActive.address);
  }, [aliases, inboxAlias]);

  const aliasLogMap = useMemo(() => {
    const map = new Map();
    logs.forEach((logItem) => {
      const key = (logItem.alias || '').toLowerCase().trim();
      if (!key) return;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          totalEmails: 1,
          latestSeenAt: logItem.lastSeenAt || null,
          latestSubject: logItem.subject || '-',
          latestFrom: logItem.from || '-'
        });
        return;
      }
      existing.totalEmails += 1;
      const currentSeen = new Date(existing.latestSeenAt || 0).getTime();
      const nextSeen = new Date(logItem.lastSeenAt || 0).getTime();
      if (nextSeen > currentSeen) {
        existing.latestSeenAt = logItem.lastSeenAt || null;
        existing.latestSubject = logItem.subject || '-';
        existing.latestFrom = logItem.from || '-';
      }
    });
    return map;
  }, [logs]);

  const aliasRows = useMemo(() => {
    const merged = aliases.map((a) => {
      const key = (a.address || '').toLowerCase();
      const activity = aliasLogMap.get(key);
      return {
        address: a.address,
        createdAt: a.createdAt || null,
        lastUsedAt: a.lastUsedAt || null,
        hits: a.hits || 0,
        active: a.active !== false,
        filterConfig: a.filterConfig || {},
        pinHash: a.pinHash || null,
        totalEmails: activity?.totalEmails || 0,
        latestSeenAt: activity?.latestSeenAt || null,
        latestSubject: activity?.latestSubject || '-',
        latestFrom: activity?.latestFrom || '-'
      };
    });

    const existingSet = new Set(merged.map((m) => (m.address || '').toLowerCase()));
    aliasLogMap.forEach((value, key) => {
      if (existingSet.has(key)) return;
      merged.push({
        address: key,
        createdAt: null,
        lastUsedAt: null,
        hits: 0,
        active: true,
        filterConfig: {},
        totalEmails: value.totalEmails || 0,
        latestSeenAt: value.latestSeenAt || null,
        latestSubject: value.latestSubject || '-',
        latestFrom: value.latestFrom || '-'
      });
    });

    const q = aliasQuery.trim().toLowerCase();
    let rows = merged;
    if (q) {
      rows = rows.filter((row) => {
        const hay = [row.address, row.latestFrom, row.latestSubject].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }

    if (aliasFilterStatus === 'aktif') {
      rows = rows.filter((row) => row.active);
    } else if (aliasFilterStatus === 'arsip') {
      rows = rows.filter((row) => !row.active);
    } else if (aliasFilterStatus === 'dengan-filter') {
      rows = rows.filter((row) => hasActiveFilterConfig(row.filterConfig || {}));
    } else if (aliasFilterStatus === 'tanpa-filter') {
      rows = rows.filter((row) => !hasActiveFilterConfig(row.filterConfig || {}));
    }

    rows = [...rows].sort((a, b) => {
      if (aliasSort === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (aliasSort === 'address') {
        return String(a.address || '').localeCompare(String(b.address || ''));
      }
      const diff = (b.totalEmails || 0) - (a.totalEmails || 0);
      if (diff !== 0) return diff;
      return new Date(b.lastUsedAt || 0) - new Date(a.lastUsedAt || 0);
    });

    return rows;
  }, [aliases, aliasLogMap, aliasQuery, aliasSort, aliasFilterStatus]);

  const aliasPageSize = 25;
  const aliasTabRows = useMemo(() => {
    if (aliasListTab === 'configured') return aliasRows.filter((row) => hasAliasConfig(row));
    if (aliasListTab === 'plain') return aliasRows.filter((row) => !hasAliasConfig(row));
    return aliasRows;
  }, [aliasListTab, aliasRows]);
  const aliasPagination = useMemo(
    () => paginateRows(aliasTabRows, aliasPage, aliasPageSize),
    [aliasTabRows, aliasPage]
  );
  const pagedAliases = aliasPagination.rows;
  const aliasPageCount = aliasPagination.totalPages;

  const overviewAliasRows = useMemo(() => {
    const rows = [...aliasRows];
    rows.sort((a, b) => {
      const byTraffic = (b.totalEmails || 0) - (a.totalEmails || 0);
      if (byTraffic !== 0) return byTraffic;
      return new Date(b.lastUsedAt || 0) - new Date(a.lastUsedAt || 0);
    });
    return rows;
  }, [aliasRows]);

  const overviewAliasPagination = useMemo(
    () => paginateRows(overviewAliasRows, overviewAliasPage, 8),
    [overviewAliasRows, overviewAliasPage]
  );

  const logRows = useMemo(() => {
    let rows = [...logs];
    if (selectedAlias) {
      rows = rows.filter((l) => (l.alias || '').toLowerCase() === selectedAlias.toLowerCase());
    }
    const q = logQuery.trim().toLowerCase();
    if (q) {
      rows = rows.filter((l) => {
        const hay = [l.alias || '', l.subject || '', l.from || '', l.snippet || ''].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    rows.sort((a, b) => {
      if (logSort === 'lama') return new Date(a.lastSeenAt || 0) - new Date(b.lastSeenAt || 0);
      return new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0);
    });
    return rows;
  }, [logs, selectedAlias, logQuery, logSort]);

  const logPagination = useMemo(() => paginateRows(logRows, logPage, 20), [logRows, logPage]);

  const inboxRows = useMemo(() => {
    const q = inboxQuery.trim().toLowerCase();
    let rows = [...inboxMessages];
    if (q) {
      rows = rows.filter((msg) => {
        const hay = [msg.subject || '', msg.from || '', msg.snippet || ''].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    rows.sort((a, b) => {
      if (inboxSort === 'lama') return new Date(a.date || 0) - new Date(b.date || 0);
      return new Date(b.date || 0) - new Date(a.date || 0);
    });
    return rows;
  }, [inboxMessages, inboxQuery, inboxSort]);

  const inboxPagination = useMemo(() => paginateRows(inboxRows, inboxPage, 12), [inboxRows, inboxPage]);

  const domainRows = useMemo(() => {
    const q = domainQuery.trim().toLowerCase();
    let rows = [...domains];
    if (q) {
      rows = rows.filter((d) => String(d.name || '').toLowerCase().includes(q));
    }
    if (domainFilterStatus === 'aktif') rows = rows.filter((d) => d.active !== false);
    if (domainFilterStatus === 'nonaktif') rows = rows.filter((d) => d.active === false);
    rows.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    return rows;
  }, [domains, domainQuery, domainFilterStatus]);

  const domainPagination = useMemo(() => paginateRows(domainRows, domainPage, 15), [domainRows, domainPage]);

  const apiKeyRows = useMemo(() => {
    const q = apiKeyQuery.trim().toLowerCase();
    let rows = [...apiKeys];
    if (q) {
      rows = rows.filter((row) => {
        const haystack = [
          row.name || '',
          row.id || '',
          row.keyPrefix || '',
          ...(row.scopes || [])
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    rows.sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    return rows;
  }, [apiKeys, apiKeyQuery]);

  const apiKeyPagination = useMemo(
    () => paginateRows(apiKeyRows, apiKeyPage, 10),
    [apiKeyRows, apiKeyPage]
  );

  const overviewLatestRows = useMemo(() => {
    const rows = [...logs];
    rows.sort((a, b) => new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0));
    return rows;
  }, [logs]);

  const overviewLatestPagination = useMemo(
    () => paginateRows(overviewLatestRows, overviewLogPage, 8),
    [overviewLatestRows, overviewLogPage]
  );

  const activeDomains = domains.filter((d) => d.active !== false);
  const aliasesWithTraffic = aliasRows.filter((a) => (a.totalEmails || 0) > 0).length;
  const inactiveAliases = aliasRows.filter((a) => a.active === false).length;

  async function handleAddDomain() {
    const trimmed = newDomain.trim().toLowerCase();
    if (!trimmed) return;
    try {
      await fetchWithAdmin('/api/admin/domains', {
        method: 'POST',
        body: JSON.stringify({ name: trimmed })
      });
      setNewDomain('');
      await loadAll();
      setToast('Domain berhasil ditambahkan');
    } catch (err) {
      setToast(localizeErrorMessage(err?.message) || 'Gagal menambahkan domain');
    }
  }

  async function toggleDomain(name, active) {
    try {
      await fetchWithAdmin(`/api/admin/domains/${encodeURIComponent(name)}`, {
        method: 'PUT',
        body: JSON.stringify({ active })
      });
      await loadAll();
      setToast(active ? 'Domain berhasil diaktifkan' : 'Domain berhasil dinonaktifkan');
    } catch (err) {
      setToast(localizeErrorMessage(err?.message) || 'Gagal memperbarui domain');
    }
  }

  async function removeDomain(name) {
    if (!window.confirm(`Hapus domain ${name}?`)) return;
    try {
      await fetchWithAdmin(`/api/admin/domains/${encodeURIComponent(name)}`, { method: 'DELETE' });
      await loadAll();
      setToast('Domain berhasil dihapus');
    } catch (err) {
      setToast(localizeErrorMessage(err?.message) || 'Gagal menghapus domain');
    }
  }

  async function removeAlias(address) {
    if (!window.confirm(`Arsipkan alias ${address}?`)) return;
    try {
      await fetchWithAdmin(`/api/admin/aliases/${encodeURIComponent(address)}`, { method: 'DELETE' });
      await loadAll();
      setToast('Alias berhasil diarsipkan');
    } catch (err) {
      setToast(localizeErrorMessage(err?.message) || 'Gagal mengarsipkan alias');
    }
  }

  async function clearAllLogs() {
    if (!window.confirm('Hapus semua log email? Tindakan ini tidak bisa dibatalkan.')) return;
    try {
      await fetchWithAdmin('/api/admin/logs', { method: 'DELETE' });
      await loadAll();
      setToast('Log email berhasil dibersihkan');
    } catch (err) {
      setToast(localizeErrorMessage(err?.message) || 'Gagal membersihkan log email');
    }
  }

  async function revokeToken() {
    if (!window.confirm('Cabut token OAuth? Anda mungkin perlu login OAuth kembali.')) return;
    try {
      await fetchWithAdmin('/auth/revoke', { method: 'POST' });
      setToast('Token OAuth berhasil dicabut');
    } catch (err) {
      setToast(localizeErrorMessage(err?.message) || 'Gagal mencabut token OAuth');
    }
  }

  function resetApiKeyForm() {
    setApiKeyName('');
    setApiKeyScopes('alias:create, messages:read, otp:read');
    setApiKeyRateLimit('60');
    setApiKeyAllowedDomains('');
    setApiKeyAllowedIps('');
    setApiKeyExpiresAt('');
  }

  async function copyIssuedApiKey() {
    if (!issuedApiKeySecret) return;
    try {
      await navigator.clipboard.writeText(issuedApiKeySecret);
      setToast('API key berhasil disalin');
    } catch {
      setToast('Gagal menyalin API key');
    }
  }

  async function createApiKey() {
    const name = apiKeyName.trim();
    if (!name) {
      setToast('Nama API key wajib diisi');
      return;
    }

    try {
      const payload = {
        name,
        scopes: splitFilterInput(apiKeyScopes),
        rateLimitPerMin: parseInt(apiKeyRateLimit || '60', 10) || 60,
        allowedDomains: splitFilterInput(apiKeyAllowedDomains),
        allowedIps: splitFilterInput(apiKeyAllowedIps),
        expiresAt: apiKeyExpiresAt || null
      };

      const data = await fetchWithAdmin('/api/admin/keys', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setIssuedApiKeySecret(data?.secret || '');
      resetApiKeyForm();
      await loadAll();
      setToast('API key baru berhasil dibuat');
    } catch (err) {
      setToast(localizeErrorMessage(err?.message) || 'Gagal membuat API key');
    }
  }

  async function revokeApiKeyRecord(row) {
    if (!row?.id) return;
    if (!window.confirm(`Cabut API key ${row.name}?`)) return;
    try {
      await fetchWithAdmin(`/api/admin/keys/${encodeURIComponent(row.id)}`, {
        method: 'DELETE'
      });
      await loadAll();
      setToast('API key berhasil dicabut');
    } catch (err) {
      setToast(localizeErrorMessage(err?.message) || 'Gagal mencabut API key');
    }
  }

  async function rotateApiKeyRecord(row) {
    if (!row?.id) return;
    if (!window.confirm(`Rotate API key ${row.name}? Key lama akan langsung dicabut.`)) return;
    try {
      const data = await fetchWithAdmin(`/api/admin/keys/${encodeURIComponent(row.id)}/rotate`, {
        method: 'POST'
      });
      setIssuedApiKeySecret(data?.secret || '');
      await loadAll();
      setToast('API key berhasil di-rotate');
    } catch (err) {
      setToast(localizeErrorMessage(err?.message) || 'Gagal rotate API key');
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  function resetAliasForm() {
    setAliasFormAddress('');
    setAliasSubjectExact('');
    setAliasSubjectIncludes('');
    setAliasSubjectExcludes('');
    setAliasSenderIncludes('');
    setAliasKeywordIncludes('');
    setAliasCustomRegex('');
    setAliasPin('');
    setAliasFilterMode('all');
  }

  function editAliasFilter(row) {
    setAliasFormAddress(row.address || '');
    const cfg = row.filterConfig || {};
    setAliasSubjectExact((cfg.subjectExact || []).join(', '));
    setAliasSubjectIncludes((cfg.subjectIncludes || []).join(', '));
    setAliasSubjectExcludes((cfg.subjectExcludes || []).join(', '));
    setAliasSenderIncludes((cfg.senderIncludes || []).join(', '));
    setAliasKeywordIncludes((cfg.keywordIncludes || []).join(', '));
    setAliasCustomRegex(cfg.customRegex || '');
    const isNetflixPreset = (cfg.subjectExact || []).join(', ') === 'kode akses sementaramu, kode akses sementara netflix-mu' &&
      (cfg.senderIncludes || []).join(', ') === 'info@account.netflix.com, netflix' &&
      (cfg.keywordIncludes || []).join(', ') === 'kode akses sementara, netflix' &&
      !(cfg.subjectIncludes || []).length && !(cfg.subjectExcludes || []).length && !cfg.customRegex;
    setAliasFilterMode(isNetflixPreset ? 'netflix-household' : hasActiveFilterConfig(cfg) ? 'custom' : 'all');
  }

  async function saveAliasFilter() {
    const address = aliasFormAddress.trim().toLowerCase();
    if (!address) {
      setToast('Alamat alias wajib diisi');
      return;
    }

    const payload = {
      address,
      pin: aliasPin.trim() || null,
      filterConfig: {
        subjectExact: splitFilterInput(aliasSubjectExact),
        subjectIncludes: splitFilterInput(aliasSubjectIncludes),
        subjectExcludes: splitFilterInput(aliasSubjectExcludes),
        senderIncludes: splitFilterInput(aliasSenderIncludes),
        keywordIncludes: splitFilterInput(aliasKeywordIncludes),
        customRegex: aliasCustomRegex.trim()
      }
    };

    try {
      await fetchWithAdmin('/api/admin/aliases', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await loadAll();
      setToast('Filter alias berhasil disimpan' + (aliasPin.trim() ? ' (dengan PIN)' : ''));
      if (!inboxAlias) setInboxAlias(address);
    } catch (err) {
      setToast(localizeErrorMessage(err?.message) || 'Gagal menyimpan filter alias');
    }
  }

  function setAliasFilterPreset(mode) {
    setAliasFilterMode(mode);
    if (mode === 'all') {
      setAliasSubjectExact('');
      setAliasSubjectIncludes('');
      setAliasSubjectExcludes('');
      setAliasSenderIncludes('');
      setAliasKeywordIncludes('');
      setAliasCustomRegex('');
      return;
    }
    if (mode !== 'netflix-household') return;
    setAliasSubjectExact('kode akses sementaramu, kode akses sementara netflix-mu');
    setAliasSubjectIncludes('');
    setAliasSubjectExcludes('');
    setAliasSenderIncludes('info@account.netflix.com, netflix');
    setAliasKeywordIncludes('kode akses sementara, netflix');
    setAliasCustomRegex('');
  }

  function generateAliasAddress() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let rand = '';
    for (let i = 0; i < 10; i++) rand += chars[Math.floor(Math.random() * chars.length)];
    const domain = aliasFormAddress.includes('@') ? aliasFormAddress.split('@')[1] : (activeDomains[0]?.name || '');
    setAliasFormAddress(rand + (domain ? '@' + domain : ''));
  }

  async function loadAdminInbox(targetAlias = inboxAlias) {
    const alias = String(targetAlias || '').trim().toLowerCase();
    if (!alias) {
      setToast('Pilih alias terlebih dahulu');
      return;
    }
    setInboxLoading(true);
    try {
      const data = await fetchWithAdmin(`/api/admin/messages?alias=${encodeURIComponent(alias)}`);
      setInboxMessages(data.messages || []);
      setToast('Inbox admin berhasil dimuat');
      setSelectedAlias(alias);
    } catch (err) {
      setToast(localizeErrorMessage(err?.message) || 'Gagal memuat inbox admin');
    } finally {
      setInboxLoading(false);
    }
  }

  async function openAdminMessage(id) {
    if (!id) return;
    setInboxDetail({ loading: true });
    try {
      const data = await fetchWithAdmin(`/api/admin/messages/${encodeURIComponent(id)}`);
      setInboxDetail({ ...data, loading: false });
    } catch (err) {
      setInboxDetail({ loading: false, error: localizeErrorMessage(err?.message) || 'Gagal memuat isi pesan' });
    }
  }

  const adminTheme = ADMIN_THEME_MAP[activeTheme] || ADMIN_THEME_MAP.blue;

  async function handleSaveTheme(themeId) {
    setThemeLoading(true);
    try {
      await fetchWithAdmin('/api/admin/theme', {
        method: 'POST',
        body: JSON.stringify({ theme: themeId }),
      });
      setActiveTheme(themeId);
      setToast(`Tema "${ADMIN_THEMES.find((th) => th.id === themeId)?.name || themeId}" berhasil diterapkan`);
    } catch (err) {
      setToast(localizeErrorMessage(err?.message) || 'Gagal menyimpan tema');
    } finally {
      setThemeLoading(false);
    }
  }

  async function enableGmailPush() {
    try {
      const data = await fetchWithAdmin('/api/webhooks/gmail/watch', { method: 'POST' });
      if (data?.status === 'ok') {
        const expDate = data.expiration ? new Date(Number(data.expiration)).toLocaleDateString() : '~7 hari';
        setToast(`Gmail Push aktif! Expire: ${expDate}`);
      } else {
        setToast(data?.error || 'Gagal mengaktifkan push');
      }
    } catch (err) {
      setToast(localizeErrorMessage(err?.message) || 'Gagal mengaktifkan Gmail Push');
    }
  }

  const navItems = [
    { key: 'overview', icon: 'bi-speedometer2', label: 'Ringkasan' },
    { key: 'aliases', icon: 'bi-at', label: 'Alias' },
    { key: 'inbox', icon: 'bi-inboxes', label: 'Kotak Masuk' },
    { key: 'logs', icon: 'bi-envelope-paper', label: 'Log Email' },
    { key: 'domains', icon: 'bi-globe2', label: 'Domain' },
    { key: 'api-keys', icon: 'bi-key', label: 'API Key' },
    { key: 'security', icon: 'bi-shield-lock', label: 'Keamanan' },
    { key: 'tampilan', icon: 'bi-palette', label: 'Tampilan' },
  ];

  return (
    <main
      className="admin-shell"
      style={{
        '--admin-page-bg': adminTheme.pageBg,
        '--admin-card-bg': adminTheme.cardBg,
        '--admin-border': adminTheme.border,
        '--admin-text': adminTheme.text,
        '--admin-muted': adminTheme.muted,
        '--admin-primary': adminTheme.primary,
        '--admin-hero': adminTheme.gradient,
        '--admin-shadow': adminTheme.shadow
      }}
    >
      <style suppressHydrationWarning>{`
        .admin-shell { background: var(--admin-page-bg); color: var(--admin-text); }
        .admin-sidebar {
          background: var(--admin-card-bg);
          border-right: 1px solid var(--admin-border);
          box-shadow: var(--admin-shadow);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .admin-sidebar.open { box-shadow: var(--admin-shadow); }
        .admin-sidebar-overlay { transition: opacity 0.2s ease; }
        .admin-brand-icon {
          background: var(--admin-hero);
          color: #fff;
          border-radius: 14px;
        }
        .admin-status-card,
        .admin-panel,
        .admin-kpi-card,
        .admin-guide {
          background: var(--admin-card-bg);
          border: 1px solid var(--admin-border);
          box-shadow: var(--admin-shadow);
          border-radius: 16px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .admin-panel:hover,
        .admin-kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--admin-shadow);
        }
        .admin-topbar {
          background: var(--admin-hero);
          color: #fff;
          border-radius: 20px;
          padding: 1.25rem 1.5rem;
          margin: 1.25rem 0 1rem;
          box-shadow: var(--admin-shadow);
        }
        .admin-topbar-title,
        .admin-topbar-subtitle,
        .admin-mobile-toggle { color: #fff; }
        .admin-topbar-subtitle { opacity: 0.85; }
        .admin-topbar-actions .btn-outline-secondary,
        .admin-topbar-actions .btn-outline-danger {
          border-color: rgba(255,255,255,0.4);
          color: #fff;
        }
        .admin-topbar-actions .btn-outline-secondary:hover,
        .admin-topbar-actions .btn-outline-danger:hover {
          background: rgba(255,255,255,0.15);
        }
        .admin-nav-item {
          color: var(--admin-muted);
          display: flex;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          text-align: left;
          padding: 0.6rem 0.75rem;
          border-radius: 10px;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .admin-nav-item i { font-size: 0.95rem; width: 18px; text-align: center; }
        .admin-nav-item:hover { background: rgba(99, 102, 241, 0.12); color: var(--admin-text); }
        .admin-nav-item.active {
          background: var(--admin-primary);
          color: #fff;
        }
        .admin-shell .text-muted { color: var(--admin-muted) !important; }
        .admin-shell a { color: var(--admin-text); }
        .admin-shell a:hover { color: var(--admin-primary); }
        .admin-shell .bg-light { background: var(--admin-page-bg) !important; }
        .admin-shell .bg-white { background: var(--admin-card-bg) !important; }
        .admin-shell .list-group-item {
          background: var(--admin-card-bg);
          color: var(--admin-text);
          border-color: var(--admin-border);
        }
        .admin-shell .table {
          background: var(--admin-card-bg);
          color: var(--admin-text);
        }
        .admin-shell .table td,
        .admin-shell .table th {
          color: var(--admin-text) !important;
          border-color: var(--admin-border) !important;
        }
        .admin-shell .table > :not(caption) > * > * {
          background-color: var(--admin-card-bg) !important;
        }
        .admin-shell .table-hover > tbody > tr:hover > * {
          background-color: rgba(99, 102, 241, 0.14) !important;
        }
        .admin-shell .table-responsive {
          background: var(--admin-card-bg);
          border-radius: 12px;
        }
        .admin-shell .alert {
          background: var(--admin-page-bg);
          color: var(--admin-text);
          border-color: var(--admin-border);
        }
        .admin-shell .badge {
          color: var(--admin-text);
        }
        .admin-table tbody tr:hover { background: rgba(99, 102, 241, 0.14); }
        .admin-content {
          padding: 0.5rem 1.5rem 1.5rem;
        }
        .form-control,
        .form-select {
          background: var(--admin-card-bg);
          color: var(--admin-text);
          border: 1px solid var(--admin-border);
          border-radius: 10px;
          padding: 0.55rem 0.75rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .form-control:focus,
        .form-select:focus {
          border-color: var(--admin-primary);
          box-shadow: 0 0 0 0.2rem rgba(99, 102, 241, 0.2);
          outline: none;
        }
        .form-control::placeholder {
          color: var(--admin-muted);
          opacity: 0.8;
        }
        .btn {
          border-radius: 10px;
          transition: transform 0.15s ease, box-shadow 0.2s ease;
        }
        .btn:hover { transform: translateY(-1px); }
        .btn-primary {
          background: var(--admin-primary);
          border-color: var(--admin-primary);
        }
        .btn-outline-secondary,
        .btn-outline-danger {
          border-color: var(--admin-border);
          color: var(--admin-text);
        }
        .table {
          color: var(--admin-text);
        }
        .table th {
          background: var(--admin-page-bg);
          color: var(--admin-muted);
        }
        .admin-table {
          border-radius: 14px;
          overflow: hidden;
        }
        .admin-table tbody tr {
          border-top: 1px solid var(--admin-border);
        }
        .admin-table tbody tr:hover {
          background: rgba(99, 102, 241, 0.08);
        }
        .admin-pagination-bar {
          background: var(--admin-page-bg);
          border: 1px solid var(--admin-border);
          border-radius: 12px;
          padding: 0.45rem 0.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .admin-page-controls { display: flex; align-items: center; gap: 0.4rem; }
        .admin-page-btn {
          border: 1px solid var(--admin-border);
          background: var(--admin-card-bg);
          color: var(--admin-text);
          border-radius: 8px;
          padding: 0.25rem 0.5rem;
          transition: transform 0.15s ease, box-shadow 0.2s ease;
        }
        .admin-page-btn:hover { transform: translateY(-1px); }
        .admin-page-info { font-size: 0.8rem; color: var(--admin-muted); }
        .admin-skeleton {
          background: linear-gradient(90deg, rgba(148,163,184,0.2), rgba(148,163,184,0.35), rgba(148,163,184,0.2));
          background-size: 200% 100%;
          animation: adminShimmer 1.2s ease-in-out infinite;
          border-radius: 12px;
        }
        .admin-skeleton-line { height: 12px; margin-top: 10px; }
        .admin-skeleton-card { padding: 1rem; }
        @keyframes adminShimmer {
          0% { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      <div
        className={`admin-sidebar-overlay${sidebarOpen ? ' active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <i className="bi bi-gear-fill" />
          </div>
          <div>
            <h1 className="admin-brand-title">PBS Admin</h1>
            <p className="admin-brand-subtitle">Dashboard Operasional</p>
          </div>
          <button
            className="admin-sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup menu"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="admin-status-card">
          <p className="mb-1 text-muted small">Sesi</p>
          <p className="mb-2 fw-600 text-break" style={{ fontSize: '0.9rem' }}>{userEmail || '-'}</p>
          <span className={`badge ${status === 'connected' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
            <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.55rem' }} />
            {status === 'connected' ? 'Terhubung' : 'Terputus'}
          </span>
        </div>

        <nav className="admin-nav" aria-label="Navigasi admin">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`admin-nav-item ${section === item.key ? 'active' : ''}`}
              onClick={() => { setSection(item.key); setSidebarOpen(false); }}
            >
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-actions">
          <button className="btn btn-primary w-100" onClick={loadAll} disabled={loading || !accessToken}>
            <i className={`bi ${loading ? 'bi-hourglass-split' : 'bi-arrow-clockwise'} me-2`} />
            {loading ? 'Menyinkronkan...' : 'Sinkronkan Data'}
          </button>
          <Link href="/" className="btn btn-outline-secondary w-100">
            <i className="bi bi-arrow-left me-2" /> Kembali ke Aplikasi
          </Link>
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-mobile-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu navigasi"
            >
              <i className="bi bi-list" />
            </button>
            <div>
              <h2 className="admin-topbar-title">{navItems.find((n) => n.key === section)?.label || 'Ringkasan'}</h2>
              <p className="admin-topbar-subtitle">Kelola alias, pantau email masuk, dan atur keamanan sistem.</p>
            </div>
          </div>
          <div className="admin-topbar-actions">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={loadAll}
              disabled={loading || !accessToken}
              title="Sinkronkan data"
            >
              <i className={`bi ${loading ? 'bi-hourglass-split' : 'bi-arrow-clockwise'}`} />
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={handleLogout}
              title="Keluar dari admin"
            >
              <i className="bi bi-box-arrow-right" />
            </button>
          </div>
        </header>

        {section === 'overview' && (
          <AdminOverviewSection
            activeDomains={activeDomains}
            aliasRows={aliasRows}
            aliasesWithTraffic={aliasesWithTraffic}
            inactiveAliases={inactiveAliases}
            loading={loading}
            overviewAliasPagination={overviewAliasPagination}
            overviewLatestPagination={overviewLatestPagination}
            setOverviewAliasPage={setOverviewAliasPage}
            setOverviewLogPage={setOverviewLogPage}
            setSection={setSection}
            stats={stats}
          />
        )}
        {section === 'aliases' && (
          <div className="admin-section-stack">
            <AdminAliasCreateForm
              activeDomains={activeDomains}
              aliasFilterMode={aliasFilterMode}
              aliasFormAddress={aliasFormAddress}
              aliasKeywordIncludes={aliasKeywordIncludes}
              aliasCustomRegex={aliasCustomRegex}
              aliasPin={aliasPin}
              aliasSenderIncludes={aliasSenderIncludes}
              aliasSubjectExact={aliasSubjectExact}
              aliasSubjectExcludes={aliasSubjectExcludes}
              aliasSubjectIncludes={aliasSubjectIncludes}
              loading={loading}
              onGenerateAlias={generateAliasAddress}
              onReset={resetAliasForm}
              onSave={saveAliasFilter}
              setAliasFilterMode={setAliasFilterPreset}
              setAliasFormAddress={setAliasFormAddress}
              setAliasKeywordIncludes={setAliasKeywordIncludes}
              setAliasCustomRegex={setAliasCustomRegex}
              setAliasPin={setAliasPin}
              setAliasSenderIncludes={setAliasSenderIncludes}
              setAliasSubjectExact={setAliasSubjectExact}
              setAliasSubjectExcludes={setAliasSubjectExcludes}
              setAliasSubjectIncludes={setAliasSubjectIncludes}
            />

            {/* === Daftar Alias === */}
            <div className="admin-panel admin-table-card">
              <div className="admin-panel-header">
                <h5 className="mb-0"><i className="bi bi-list-ul me-2" />Daftar Alias</h5>
              </div>

              {/* Search + Sort - satu baris */}
              <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--bs-border-color)' }}>
                <div className="d-flex gap-2 align-items-center">
                  <div style={{ flex: 1, position: 'relative' }}>
                    <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--bs-secondary-color)', fontSize: '0.8rem' }} />
                    <input
                      className="form-control form-control-sm"
                      placeholder="Cari alias..."
                      value={aliasQuery}
                      onChange={(e) => setAliasQuery(e.target.value)}
                      style={{ paddingLeft: '2rem' }}
                    />
                  </div>
                  <select className="form-select form-select-sm" style={{ width: 'auto', minWidth: 120 }} value={aliasSort} onChange={(e) => setAliasSort(e.target.value)}>
                    <option value="activity">Aktivitas</option>
                    <option value="newest">Terbaru</option>
                    <option value="address">Alamat</option>
                  </select>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ borderBottom: '1px solid var(--bs-border-color)', padding: '0 1rem' }}>
                <div className="d-flex" style={{ gap: '0' }}>
                  {[
                    { key: 'all', label: 'Semua', icon: 'bi-collection', count: aliasRows.length },
                    { key: 'configured', label: 'Dikonfigurasi', icon: 'bi-gear-fill', count: aliasRows.filter((r) => hasAliasConfig(r)).length },
                    { key: 'plain', label: 'Tanpa Konfigurasi', icon: 'bi-envelope', count: aliasRows.filter((r) => !hasAliasConfig(r)).length },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setAliasListTab(tab.key)}
                      style={{
                        border: 'none', background: 'none',
                        borderBottom: aliasListTab === tab.key ? '2.5px solid var(--bs-primary)' : '2.5px solid transparent',
                        borderRadius: 0, fontSize: '0.82rem', fontWeight: 600,
                        padding: '0.65rem 1rem',
                        color: aliasListTab === tab.key ? 'var(--bs-primary)' : 'var(--bs-secondary-color)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <i className={`bi ${tab.icon} me-1`} />{tab.label}
                      <span className="ms-1" style={{ fontSize: '0.7rem', opacity: 0.7 }}>({tab.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-pagination-bar">
                <small className="text-muted">{aliasPagination.total} alias total</small>
                <div className="admin-page-controls">
                  <button className="admin-page-btn" onClick={() => setAliasPage((p) => Math.max(1, p - 1))} disabled={aliasPagination.page <= 1}>
                    <i className="bi bi-chevron-left" />
                  </button>
                  <span className="admin-page-info">{aliasPagination.page} / {aliasPageCount}</span>
                  <button className="admin-page-btn" onClick={() => setAliasPage((p) => Math.min(aliasPageCount, p + 1))} disabled={aliasPagination.page >= aliasPageCount}>
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
              </div>

              {/* Table */}
              {(() => {
                const rows = pagedAliases;

                if (rows.length === 0) return (
                  <div className="admin-empty p-4">
                    <i className="bi bi-at" />
                    <p>Tidak ada alias di tab ini.</p>
                  </div>
                );

                return (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 admin-table">
                      <thead><tr>
                        <th>Alias</th>
                        <th className="d-none d-lg-table-cell">Dibuat</th>
                        <th className="text-end">Email</th>
                        <th>Konfigurasi</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr></thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.address}>
                            <td><div className="fw-600 text-break">{row.address}</div></td>
                            <td className="text-nowrap d-none d-lg-table-cell">{formatCompactDate(row.createdAt)}</td>
                            <td className="text-end fw-600">{row.totalEmails}</td>
                            <td>
                              <div className="d-flex gap-1 flex-wrap">
                                {hasActiveFilterConfig(row.filterConfig || {}) && (
                                  <span className="badge bg-primary-subtle text-primary">Filter</span>
                                )}
                                {row.pinHash && (
                                  <span className="badge bg-warning-subtle text-warning">PIN</span>
                                )}
                                {!hasActiveFilterConfig(row.filterConfig || {}) && !row.pinHash && (
                                  <span className="badge bg-secondary-subtle text-secondary">-</span>
                                )}
                              </div>
                            </td>
                            <td><span className={`badge ${row.active ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>{row.active ? 'Aktif' : 'Arsip'}</span></td>
                            <td>
                              <div className="admin-row-actions">
                                <button className="btn btn-sm btn-icon btn-outline-secondary" title="Edit" onClick={() => editAliasFilter(row)}><i className="bi bi-pencil" /></button>
                                <button className="btn btn-sm btn-icon btn-outline-success" title="Inbox" onClick={() => { setInboxAlias(row.address); setSection('inbox'); }}><i className="bi bi-inbox" /></button>
                                <button className="btn btn-sm btn-icon btn-outline-danger" title="Arsipkan" onClick={() => removeAlias(row.address)} disabled={loading}><i className="bi bi-archive" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

                {section === 'inbox' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h5 className="mb-0"><i className="bi bi-inbox-fill me-2" />Kotak Masuk Admin</h5>
            </div>

            {/* Alias picker - searchable */}
            <div className="px-3 pt-3 pb-2">
              <label className="form-label small fw-bold mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--bs-secondary-color)', fontSize: '0.75rem' }}>
                Pilih Alias
              </label>
              <div className="d-flex gap-2 align-items-center mb-2">
                <div style={{ flex: 1, position: 'relative' }}>
                  <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--bs-secondary-color)', fontSize: '0.8rem' }} />
                  <input
                    className="form-control form-control-sm"
                    placeholder="Ketik untuk cari alias..."
                    value={inboxAlias}
                    onChange={(e) => setInboxAlias(e.target.value)}
                    style={{ paddingLeft: '2rem' }}
                    list="inbox-alias-list"
                  />
                  <datalist id="inbox-alias-list">
                    {aliasRows.map((row) => (
                      <option key={row.address} value={row.address} />
                    ))}
                  </datalist>
                </div>
                <button className="btn btn-sm btn-primary" style={{ borderRadius: '8px', padding: '0.45rem 1rem', fontWeight: 600 }} onClick={() => loadAdminInbox()} disabled={inboxLoading || !inboxAlias}>
                  {inboxLoading ? (<><span className="spinner-border spinner-border-sm me-1" />Memuat</>) : (<><i className="bi bi-arrow-right me-1" />Muat</>)}
                </button>
              </div>
              {inboxAlias && inboxAlias.includes('@') && (
                <div className="rounded-2 px-3 py-2 small" style={{ background: 'rgba(var(--bs-primary-rgb), 0.06)', border: '1px solid rgba(var(--bs-primary-rgb), 0.15)', fontFamily: 'monospace' }}>
                  <i className="bi bi-envelope-fill text-primary me-2" />{inboxAlias}
                </div>
              )}
            </div>

            {/* Toolbar - search + sort */}
            {inboxMessages.length > 0 && (
              <div className="px-3 py-2" style={{ borderTop: '1px solid var(--bs-border-color)', borderBottom: '1px solid var(--bs-border-color)' }}>
                <div className="d-flex gap-2 align-items-center">
                  <div style={{ flex: 1, position: 'relative' }}>
                    <i className="bi bi-funnel" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--bs-secondary-color)', fontSize: '0.8rem' }} />
                    <input
                      className="form-control form-control-sm"
                      placeholder="Filter subjek, pengirim..."
                      value={inboxQuery}
                      onChange={(e) => setInboxQuery(e.target.value)}
                      style={{ paddingLeft: '2rem' }}
                    />
                  </div>
                  <select className="form-select form-select-sm" style={{ width: 'auto', minWidth: 110 }} value={inboxSort} onChange={(e) => setInboxSort(e.target.value)}>
                    <option value="baru">Terbaru</option>
                    <option value="lama">Terlama</option>
                  </select>
                  <span className="badge bg-primary-subtle text-primary" style={{ whiteSpace: 'nowrap' }}>
                    {inboxPagination.total} email
                  </span>
                </div>
              </div>
            )}

            {/* Pagination */}
            {inboxMessages.length > 0 && (
              <div className="admin-pagination-bar">
                <small className="text-muted">{inboxPagination.total} email</small>
                <div className="admin-page-controls">
                  <button className="admin-page-btn" onClick={() => setInboxPage((p) => Math.max(1, p - 1))} disabled={inboxPagination.page <= 1}>
                    <i className="bi bi-chevron-left" />
                  </button>
                  <span className="admin-page-info">{inboxPagination.page} / {inboxPagination.totalPages}</span>
                  <button className="admin-page-btn" onClick={() => setInboxPage((p) => Math.min(inboxPagination.totalPages, p + 1))} disabled={inboxPagination.page >= inboxPagination.totalPages}>
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
              </div>
            )}

            {/* Email list - card style */}
            <div>
              {!inboxAlias && inboxMessages.length === 0 && (
                <div className="p-4 text-center">
                  <div style={{ width: 52, height: 52, borderRadius: '14px', margin: '0 auto 0.75rem', background: 'var(--bs-tertiary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '1.4rem', color: 'var(--bs-secondary-color)' }} />
                  </div>
                  <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Pilih alias untuk melihat email</p>
                  <p className="text-muted small mb-0">Ketik nama alias di kolom pencarian di atas, lalu klik Muat.</p>
                </div>
              )}
              {inboxAlias && inboxMessages.length === 0 && !inboxLoading && (
                <div className="admin-empty p-4">
                  <i className="bi bi-envelope-open" />
                  <p>Belum ada email untuk alias ini.</p>
                </div>
              )}
              {inboxPagination.rows.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => openAdminMessage(msg.id)}
                  style={{
                    padding: '0.85rem 1.25rem',
                    borderBottom: '1px solid var(--bs-border-color)',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  className="admin-log-item"
                  title="Klik untuk buka isi email"
                >
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.subject || '(tanpa subjek)'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--bs-secondary-color)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.from || '-'}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--bs-secondary-color)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {formatDateTime(msg.date)}
                    </div>
                  </div>
                  {msg.snippet && (
                    <p style={{
                      margin: 0, fontSize: '0.8rem', color: 'var(--bs-secondary-color)',
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                    }}>
                      {msg.snippet}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'logs' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h5 className="mb-0"><i className="bi bi-clock-history me-2" />Log Email</h5>
            </div>

            {/* Toolbar - satu baris */}
            <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--bs-border-color)' }}>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <select className="form-select form-select-sm" style={{ width: 'auto', minWidth: 140 }} value={selectedAlias} onChange={(e) => setSelectedAlias(e.target.value)}>
                  <option value="">Semua alias</option>
                  {aliasRows.map((row) => (
                    <option key={row.address} value={row.address}>{row.address}</option>
                  ))}
                </select>
                <div style={{ flex: 1, position: 'relative', minWidth: 150 }}>
                  <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--bs-secondary-color)', fontSize: '0.8rem' }} />
                  <input
                    className="form-control form-control-sm"
                    placeholder="Cari subjek, pengirim..."
                    value={logQuery}
                    onChange={(e) => setLogQuery(e.target.value)}
                    style={{ paddingLeft: '2rem' }}
                  />
                </div>
                <select className="form-select form-select-sm" style={{ width: 'auto', minWidth: 110 }} value={logSort} onChange={(e) => setLogSort(e.target.value)}>
                  <option value="latest">Terbaru</option>
                  <option value="lama">Terlama</option>
                </select>
                <button className="btn btn-sm btn-outline-danger" onClick={clearAllLogs} disabled={loading || logs.length === 0} title="Bersihkan semua log">
                  <i className="bi bi-trash3 me-1" />Hapus
                </button>
              </div>
            </div>

            {/* Pagination */}
            <div className="admin-pagination-bar">
              <small className="text-muted">{logPagination.total} email tercatat</small>
              <div className="admin-page-controls">
                <button className="admin-page-btn" onClick={() => setLogPage((p) => Math.max(1, p - 1))} disabled={logPagination.page <= 1}>
                  <i className="bi bi-chevron-left" />
                </button>
                <span className="admin-page-info">{logPagination.page} / {logPagination.totalPages}</span>
                <button className="admin-page-btn" onClick={() => setLogPage((p) => Math.min(logPagination.totalPages, p + 1))} disabled={logPagination.page >= logPagination.totalPages}>
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
            </div>

            {/* Log list - card style */}
            <div>
              {logPagination.rows.length === 0 && (
                <div className="admin-empty p-4">
                  <i className="bi bi-envelope-open" />
                  <p>Tidak ada log yang sesuai filter.</p>
                </div>
              )}
              {logPagination.rows.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => openAdminMessage(entry.id)}
                  style={{
                    padding: '0.85rem 1.25rem',
                    borderBottom: '1px solid var(--bs-border-color)',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  className="admin-log-item"
                  title="Klik untuk buka isi email"
                >
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.subject || '(tanpa subjek)'}
                      </div>
                      <div className="d-flex align-items-center gap-2 mt-1" style={{ fontSize: '0.78rem' }}>
                        <span className="text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                          {entry.from || '-'}
                        </span>
                        <span className="badge bg-primary-subtle text-primary" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                          {entry.alias || '?'}
                        </span>
                      </div>
                    </div>
                    <div className="text-end" style={{ flexShrink: 0 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--bs-secondary-color)', whiteSpace: 'nowrap' }}>
                        {formatDateTime(entry.date)}
                      </div>
                    </div>
                  </div>
                  {entry.snippet && (
                    <p style={{
                      margin: 0, fontSize: '0.8rem', color: 'var(--bs-secondary-color)',
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                    }}>
                      {entry.snippet}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <style>{`
              .admin-log-item:hover { background: var(--bs-tertiary-bg) !important; }
            `}</style>
          </div>
        )}

        {section === 'domains' && (
          <AdminDomainsSection
            domainFilterStatus={domainFilterStatus}
            domainPagination={domainPagination}
            domainQuery={domainQuery}
            domainRows={domainRows}
            loading={loading}
            newDomain={newDomain}
            onAddDomain={handleAddDomain}
            onRemoveDomain={removeDomain}
            onToggleDomain={toggleDomain}
            setDomainFilterStatus={setDomainFilterStatus}
            setDomainPage={setDomainPage}
            setDomainQuery={setDomainQuery}
            setNewDomain={setNewDomain}
          />
        )}
        {section === 'api-keys' && (
          <div className="row g-4">
            <div className="col-12 col-xl-5">
              <div className="admin-panel h-100">
                <h5 className="mb-1">Buat API Key Partner</h5>
                <p className="text-muted small mb-3">
                  Key digunakan pihak ketiga untuk generate alias email, baca inbox, dan ambil OTP.
                </p>

                <div className={`alert ${partnerApiEnabled ? 'alert-success' : 'alert-warning'} py-2 small`}>
                  <strong>Status Partner API:</strong> {partnerApiEnabled ? 'Aktif' : 'Nonaktif'}
                </div>

                {issuedApiKeySecret && (
                  <div className="alert alert-info">
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                      <strong>API Key Baru</strong>
                      <button className="btn btn-sm btn-outline-primary" onClick={copyIssuedApiKey}>
                        <i className="bi bi-clipboard me-1" /> Salin
                      </button>
                    </div>
                    <code className="d-block text-break">{issuedApiKeySecret}</code>
                    <small className="text-muted">Simpan key ini sekarang. Nilainya tidak akan ditampilkan ulang.</small>
                  </div>
                )}

                <div className="row g-2">
                  <div className="col-12">
                    <label className="form-label small mb-1">Nama Key</label>
                    <input
                      className="form-control form-control-sm"
                      placeholder="Partner A - Production"
                      value={apiKeyName}
                      onChange={(e) => setApiKeyName(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small mb-1">Scopes (pisahkan koma)</label>
                    <input
                      className="form-control form-control-sm"
                      placeholder="alias:create, messages:read, otp:read"
                      value={apiKeyScopes}
                      onChange={(e) => setApiKeyScopes(e.target.value)}
                    />
                  </div>

                  <div className="col-6">
                    <label className="form-label small mb-1">Rate Limit / Menit</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control form-control-sm"
                      value={apiKeyRateLimit}
                      onChange={(e) => setApiKeyRateLimit(e.target.value)}
                    />
                  </div>

                  <div className="col-6">
                    <label className="form-label small mb-1">Expires At (opsional)</label>
                    <input
                      type="datetime-local"
                      className="form-control form-control-sm"
                      value={apiKeyExpiresAt}
                      onChange={(e) => setApiKeyExpiresAt(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small mb-1">Allowed Domains (opsional)</label>
                    <input
                      className="form-control form-control-sm"
                      placeholder="example.com, example.org"
                      value={apiKeyAllowedDomains}
                      onChange={(e) => setApiKeyAllowedDomains(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small mb-1">Allowed IPs (opsional)</label>
                    <input
                      className="form-control form-control-sm"
                      placeholder="203.0.113.10, 198.51.100.7"
                      value={apiKeyAllowedIps}
                      onChange={(e) => setApiKeyAllowedIps(e.target.value)}
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-sm btn-primary" onClick={createApiKey}>
                    <i className="bi bi-key me-1" /> Buat Key
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={resetApiKeyForm}>
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-7">
              <div className="admin-panel h-100">
                <div className="admin-panel-header flex-wrap gap-2">
                  <h5 className="mb-0">Daftar API Key</h5>
                  <input
                    className="form-control form-control-sm admin-toolbar-field"
                    placeholder="Cari nama key / scope / prefix"
                    value={apiKeyQuery}
                    onChange={(e) => setApiKeyQuery(e.target.value)}
                  />
                </div>

                <div className="admin-pagination-bar">
                  <small className="text-muted">{apiKeyPagination.rows.length} / {apiKeyPagination.total} key</small>
                  <div className="admin-page-controls">
                    <button
                      className="admin-page-btn"
                      onClick={() => setApiKeyPage((p) => Math.max(1, p - 1))}
                      disabled={apiKeyPagination.page <= 1}
                    >
                      <i className="bi bi-chevron-left" />
                    </button>
                    <span className="admin-page-info">{apiKeyPagination.page} / {apiKeyPagination.totalPages}</span>
                    <button
                      className="admin-page-btn"
                      onClick={() => setApiKeyPage((p) => Math.min(apiKeyPagination.totalPages, p + 1))}
                      disabled={apiKeyPagination.page >= apiKeyPagination.totalPages}
                    >
                      <i className="bi bi-chevron-right" />
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 admin-table">
                    <thead>
                      <tr>
                        <th>Nama</th>
                        <th>Prefix</th>
                        <th>Scopes</th>
                        <th>Status</th>
                        <th>Dibuat</th>
                        <th className="text-end">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiKeyRows.length === 0 && (
                        <tr>
                          <td colSpan={6}>
                            <div className="admin-empty">
                              <i className="bi bi-key" />
                              <p>Belum ada API key partner.</p>
                            </div>
                          </td>
                        </tr>
                      )}

                      {apiKeyPagination.rows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <div className="fw-600 text-break">{row.name || '-'}</div>
                            <small className="text-muted text-break">{row.id}</small>
                          </td>
                          <td><code>{row.keyPrefix || '-'}</code></td>
                          <td>
                            <small className="text-break">{(row.scopes || []).join(', ') || '-'}</small>
                          </td>
                          <td>
                            <span className={`badge ${row.active ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                              {row.active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="text-nowrap">{formatCompactDate(row.createdAt)}</td>
                          <td>
                            <div className="admin-row-actions justify-content-end">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => rotateApiKeyRecord(row)}
                                disabled={!row.active}
                                title="Rotate key"
                              >
                                Rotate
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => revokeApiKeyRecord(row)}
                                disabled={!row.active}
                                title="Revoke key"
                              >
                                Revoke
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {section === 'tampilan' && <AdminAppearanceSection activeTheme={activeTheme} themeLoading={themeLoading} onSaveTheme={handleSaveTheme} />}

        {section === 'security' && (
          <AdminSecuritySection
            aliasRows={aliasRows}
            domains={domains}
            loading={loading}
            onEnableGmailPush={enableGmailPush}
            onRevokeToken={revokeToken}
            stats={stats}
          />
        )}
      </section>

      <AdminMessageModal detail={inboxDetail} onClose={() => setInboxDetail(null)} />

      {toast && (
        <div className="admin-toast">
          <i className="bi bi-check-circle-fill" style={{ color: '#4ade80' }} />
          {toast}
        </div>
      )}
    </main>
  );
}
