create table public.agent_functions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  status text not null default 'active' check (status in ('active', 'draft', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.capability_agent_functions (
  capability_id uuid not null references public.capabilities(id) on delete cascade,
  agent_function_id uuid not null references public.agent_functions(id) on delete cascade,
  primary key (capability_id, agent_function_id)
);

alter table public.agent_functions enable row level security;
alter table public.capability_agent_functions enable row level security;

create policy "authenticated can read agent functions"
  on public.agent_functions for select to authenticated using (true);
create policy "Administrators can insert agent functions"
  on public.agent_functions for insert to authenticated with check (is_manager_admin());
create policy "Administrators can update agent functions"
  on public.agent_functions for update to authenticated using (is_manager_admin()) with check (is_manager_admin());
create policy "Administrators can delete agent functions"
  on public.agent_functions for delete to authenticated using (is_manager_admin());

create policy "authenticated can read capability agent functions"
  on public.capability_agent_functions for select to authenticated using (true);
create policy "Administrators can manage capability agent functions"
  on public.capability_agent_functions for all to authenticated using (is_manager_admin()) with check (is_manager_admin());

grant select, insert, update, delete on public.agent_functions to authenticated;
grant select, insert, update, delete on public.capability_agent_functions to authenticated;

insert into public.agent_functions (name, description) values
  ('navigate', 'Navigate a browser to a URL or application route.'),
  ('click', 'Click a visible browser control.'),
  ('fill', 'Enter text into a form field.'),
  ('select', 'Choose a value from a form control.'),
  ('inspect', 'Inspect rendered browser state.'),
  ('screenshot', 'Capture the current rendered browser state.'),
  ('console.read', 'Read browser console messages and errors.'),
  ('network.read', 'Inspect browser network requests and responses.'),
  ('assert', 'Verify an expected browser state or workflow result.')
on conflict (name) do nothing;
