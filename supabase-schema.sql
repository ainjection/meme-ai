-- Run this in Supabase SQL Editor

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  credits_used integer default 0,
  subscription_status text default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

create table if not exists generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  meme_title text,
  meme_source_url text,
  output_url text,
  swap_type text check (swap_type in ('face', 'body')),
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  replicate_prediction_id text,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table generations enable row level security;

create policy "Users see own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

create policy "Users see own generations" on generations for select using (auth.uid() = user_id);
create policy "Users insert own generations" on generations for insert with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for generated memes
insert into storage.buckets (id, name, public) values ('generations', 'generations', true)
  on conflict do nothing;

create policy "Public read generations" on storage.objects for select using (bucket_id = 'generations');
create policy "Auth users upload" on storage.objects for insert with check (bucket_id = 'generations' and auth.role() = 'authenticated');
