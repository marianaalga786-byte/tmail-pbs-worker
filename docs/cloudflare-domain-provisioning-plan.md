# Rencana Provisioning Domain Cloudflare

Dokumen ini menyimpan rencana implementasi fitur admin untuk menambahkan domain TMail dan melakukan provisioning Cloudflare otomatis. Dokumen ini adalah rencana, bukan fitur yang sudah diaktifkan.

## Tujuan

Admin menambahkan domain dari dashboard TMail, lalu aplikasi menyiapkan kebutuhan Cloudflare Email Routing secara aman:

```text
Admin tambah domain
  -> app cek Cloudflare zone
  -> app cek status zone
  -> app cek/buat DNS Email Routing
  -> app aktifkan Email Routing
  -> app buat catch-all ke Email Worker
  -> app menyimpan status provisioning
  -> domain aktif di TMail
```

## Batasan

Otomatisasi penuh hanya dapat dilakukan jika domain sudah berada dalam akun Cloudflare yang sama dan zone berstatus `active`.

Tindakan yang tetap manual:

- Mengubah nameserver domain di registrar saat domain baru pertama kali ditambahkan ke Cloudflare.
- Memverifikasi Gmail destination address untuk `BACKUP_EMAIL`.
- Menunggu DNS propagation jika DNS tidak dikelola sepenuhnya oleh Cloudflare.
- Deploy Worker pertama kali. Setelah Worker tersedia, domain berikutnya dapat dibuatkan rule ke Worker yang sama.

## Arsitektur Target

```text
Admin TMail
  -> Next.js admin API
  -> Cloudflare API
     -> Zone lookup/status
     -> DNS records
     -> Email Routing configuration
     -> Catch-all route ke Worker
  -> Supabase app_domains dan provisioning status
```

Setelah siap, alur email tetap:

```text
email ke alias@domain.com
  -> Cloudflare Email Routing catch-all
  -> tmail-email-worker
  -> app webhook
  -> Supabase app_messages
  -> UI TMail
```

## Environment Yang Diperlukan

Semua nilai hanya tersedia di server. Jangan pernah expose ke browser dengan prefix `NEXT_PUBLIC_`.

```env
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_EMAIL_WORKER_NAME=tmail-email-worker
```

Rekomendasi izin minimum API token:

```text
Zone -> Zone -> Read
Zone -> DNS -> Edit
Email Routing -> Edit
Workers -> Read/Edit sesuai endpoint Cloudflare yang dipakai untuk route Worker
```

Token harus dibatasi hanya untuk account dan zone TMail. Jangan gunakan Global API Key atau token dengan akses penuh.

## Data Provisioning

Tambahkan data provisioning ke domain storage. Implementasi dapat memakai kolom baru di `app_domains` atau tabel terpisah `app_domain_provisioning`.

Data minimal:

```text
domain
cloudflare_zone_id
cloudflare_zone_status
email_routing_ready
worker_route_ready
provision_status
last_provisioned_at
last_provision_error
dns_snapshot
```

Status yang direkomendasikan:

```text
pending_zone
pending_nameserver
provisioning
ready
warning_existing_mail_records
failed
```

## Alur Admin

Tambahkan aksi baru pada halaman Domains:

```text
Tambah & Provision Cloudflare
```

Tahapan UI:

```text
1. Admin memasukkan domain.
2. App mencari Cloudflare zone.
3. App memeriksa zone status.
4. App memeriksa MX/TXT SPF existing.
5. Admin menyetujui perubahan yang berisiko.
6. App menjalankan provisioning.
7. UI menampilkan status dan detail hasil.
```

Pesan status yang direkomendasikan:

```text
Memeriksa zone Cloudflare
Zone belum aktif, tunggu nameserver
Memeriksa MX dan SPF
Mengaktifkan Email Routing
Membuat catch-all ke Worker
Domain siap menerima email
```

## DNS Email Routing

Record standar Cloudflare Email Routing:

```text
MX  @  route1.mx.cloudflare.net  priority 49
MX  @  route2.mx.cloudflare.net  priority 50
MX  @  route3.mx.cloudflare.net  priority 50
TXT @  v=spf1 include:_spf.mx.cloudflare.net ~all
```

Aturan aman:

- Jangan hapus atau replace MX record existing secara otomatis.
- Jika ada MX non-Cloudflare, tampilkan warning dan minta konfirmasi eksplisit sebelum replace.
- Jangan membuat dua SPF TXT record.
- Jika SPF sudah ada, jangan overwrite tanpa pemeriksaan dan konfirmasi.
- Simpan snapshot record sebelum perubahan agar dapat ditampilkan untuk audit/recovery.

## Catch-All Worker

Route target:

```text
*@domain.com -> tmail-email-worker
```

Worker yang dipakai:

```text
cloudflare/email-worker.js
```

Worker menyimpan email ke aplikasi dan opsional forward ke Gmail melalui `BACKUP_EMAIL`.

## API Yang Direncanakan

Contoh endpoint admin:

```text
POST /api/admin/domains/provision
GET  /api/admin/domains/:name/provisioning
POST /api/admin/domains/:name/provisioning/retry
```

Contoh request:

```json
{
  "domain": "example.com",
  "replaceExistingMailRecords": false
}
```

Contoh response sukses:

```json
{
  "ok": true,
  "domain": "example.com",
  "status": "ready",
  "zoneId": "...",
  "emailRoutingReady": true,
  "workerRouteReady": true
}
```

## Error Yang Harus Spesifik

```text
CLOUDFLARE_TOKEN_NOT_CONFIGURED
CLOUDFLARE_ZONE_NOT_FOUND
CLOUDFLARE_ZONE_PENDING
CLOUDFLARE_DNS_CONFLICT
CLOUDFLARE_SPF_CONFLICT
CLOUDFLARE_EMAIL_ROUTING_FAILED
CLOUDFLARE_WORKER_ROUTE_FAILED
```

Contoh pesan user:

```text
Domain tidak ditemukan di akun Cloudflare. Tambahkan domain ke Cloudflare terlebih dahulu.
```

```text
Zone Cloudflare belum aktif. Ubah nameserver domain di registrar dan tunggu status Active.
```

```text
Domain sudah memakai MX record lain. Provisioning tidak dilakukan agar layanan email lama tidak terganggu.
```

## Keamanan dan Audit

- Validasi admin pada semua endpoint provisioning.
- Jangan return Cloudflare API token ke client/log.
- Catat semua percobaan provisioning ke audit log.
- Jangan tampilkan secret Worker di UI.
- Rate limit endpoint provisioning untuk mencegah perubahan DNS berulang.
- Gunakan idempotent checks: record/rule yang sudah benar tidak dibuat ulang.

## Test Plan Saat Implementasi

1. Zone tidak ditemukan.
2. Zone pending nameserver.
3. Zone aktif tanpa MX/SPF.
4. Zone aktif dengan MX Cloudflare yang valid.
5. Zone aktif dengan MX pihak ketiga.
6. Domain dengan SPF existing.
7. Worker route berhasil dibuat.
8. Retry provisioning setelah kegagalan API.
9. Email test masuk ke `app_messages`.
10. Gmail backup tetap menerima salinan jika `BACKUP_EMAIL` diisi.

## Keputusan Implementasi

Saat fitur dikerjakan nanti, gunakan pendekatan konservatif:

```text
Default: cek dan tampilkan perubahan
MX/SPF existing: perlu konfirmasi admin
Zone belum active: jangan ubah DNS routing
Provisioning berhasil: baru aktifkan domain di TMail
```
