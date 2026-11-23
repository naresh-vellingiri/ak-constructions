-- Portfolio gallery: categories (Modular Kitchen, Pooja Room...) that each hold
-- any number of photos, managed from /admin/portfolio.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to run twice.

-- 1. PUBLIC bucket. Unlike project-files, these are marketing photos meant for
--    every visitor, so they are served straight from the CDN (fast, cacheable).
--    Visitors can fetch a photo by its address but cannot list the bucket, and
--    nobody can write to it except through the app's one-time signed uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio',
  'portfolio',
  true,
  8388608,  -- 8 MB (the app shrinks photos to a few hundred KB first)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. Categories (the tiles on the homepage).
create table if not exists public.portfolio_categories (
  id             uuid        primary key default gen_random_uuid(),
  title          text        not null,
  subtitle       text        not null default '',
  "coverImage"   text,       -- a picture shipped with the site, for the original tiles
  "coverAlt"     text,
  "sortOrder"    integer     not null default 0,
  "createdAt"    timestamptz not null default now()
);

-- 3. Photos inside a category. Deleting a category deletes its photo rows.
create table if not exists public.portfolio_photos (
  id            uuid        primary key default gen_random_uuid(),
  "categoryId"  uuid        not null references public.portfolio_categories(id) on delete cascade,
  "storagePath" text        not null unique,
  caption       text,
  "mimeType"    text        not null,
  "sizeBytes"   bigint      not null,
  "createdAt"   timestamptz not null default now()
);

create index if not exists portfolio_photos_category_idx
  on public.portfolio_photos ("categoryId", "createdAt");

-- 4. The cover the admin picked ("Make cover"). Added after the photos table
--    exists because the two tables point at each other.
alter table public.portfolio_categories
  add column if not exists "coverPhotoId" uuid
  references public.portfolio_photos(id) on delete set null;

-- Same stance as the other tables: RLS on, no policies; only the server's
-- service-role key can read or write the rows.
alter table public.portfolio_categories enable row level security;
alter table public.portfolio_photos enable row level security;
revoke all on public.portfolio_categories from anon, authenticated;
revoke all on public.portfolio_photos from anon, authenticated;

-- 5. Start with the tiles the homepage already shows, so nothing changes until
--    you edit it. Only runs when the table is empty.
insert into public.portfolio_categories (title, subtitle, "coverImage", "coverAlt", "sortOrder")
select * from (
  values
    ('Modular Kitchen', 'Custom cabinetry & counters', '/images/gallery/kitchen.webp', 'Modular kitchen with teal cabinetry and stone counters', 0),
    ('Living Room', 'False ceiling & feature lighting', '/images/gallery/living-room.webp', 'Living room with leather sofas and pendant lighting', 1),
    ('Master Bedroom', 'Wardrobes & designer ceiling', '/images/gallery/bedroom.webp', 'Bedroom with fitted wardrobes and a gold accent ceiling', 2),
    ('Home Theatre', 'Acoustic panels & LED lighting', '/images/gallery/home-theatre.webp', 'Home theatre room with recliners and blue LED cove lighting', 3),
    ('Pooja Room', 'Custom mandir & backlit detailing', '/images/gallery/pooja-room.webp', 'Pooja room with a custom mandir and backlit wall detailing', 4),
    ('Staircase & Interiors', 'Feature wall, glass railing & lighting', '/images/gallery/staircase.webp', 'Staircase with sculpted feature wall and glass railing', 5),
    ('Completed Home', 'Exterior cladding & finishing', '/images/gallery/home-exterior-1.webp', 'Completed independent house with textured exterior cladding', 6),
    ('Full Home Build', 'Ground + 2 floors, handed over', '/images/gallery/home-exterior-2.webp', 'Completed multi-storey residential building by AK Constructions', 7),
    ('Our Design Studio', 'Visit us to plan your build', '/images/gallery/office-1.webp', 'AK Constructions design studio and reception', 8)
) as v(title, subtitle, "coverImage", "coverAlt", "sortOrder")
where not exists (select 1 from public.portfolio_categories);
