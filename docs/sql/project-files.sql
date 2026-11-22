-- Site photos and documents (FMB sketch, sketch map, patta...) per project.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to run twice.

-- 1. The private bucket the files live in. "public = false" means nobody can
--    open a file by guessing its address; the app hands out short-lived links.
--    The limits below are enforced by Supabase itself, whatever the browser says.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files',
  'project-files',
  false,
  15728640,  -- 15 MB
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. One row per uploaded file.
create table if not exists public.project_files (
  id              uuid        primary key default gen_random_uuid(),
  "projectId"     uuid        not null references public.projects(id) on delete cascade,
  kind            text        not null check (kind in ('photo', 'document')),
  category        text        check (category in ('fmb', 'sketch', 'patta', 'plan', 'agreement', 'other')),
  title           text,
  "storagePath"   text        not null unique,
  "mimeType"      text        not null,
  "sizeBytes"     bigint      not null,
  "clientVisible" boolean     not null default true,
  "createdAt"     timestamptz not null default now()
);

create index if not exists project_files_project_idx
  on public.project_files ("projectId", "createdAt" desc);

-- Same stance as the other tables: RLS on, no policies. Only the server's
-- service-role key can read or write.
alter table public.project_files enable row level security;
revoke all on public.project_files from anon, authenticated;
