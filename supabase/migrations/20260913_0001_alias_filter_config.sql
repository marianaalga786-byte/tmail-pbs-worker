-- Keep alias filter rules with the alias itself so the admin list and inbound
-- Cloudflare webhook always read the same source of truth.
alter table public.app_aliases
add column if not exists filter_config jsonb not null default '{}'::jsonb;

-- Migrate legacy app_kv alias_filters entries when present.
update public.app_aliases as alias
set filter_config = filters.value -> lower(alias.address)
from public.app_kv as filters
where filters.key = 'alias_filters'
  and filters.value ? lower(alias.address)
  and alias.filter_config = '{}'::jsonb;

alter table public.app_aliases disable row level security;
