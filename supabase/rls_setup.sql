-- =============================================================================
-- RestaurantOS — Row Level Security (RLS) Setup for Supabase
-- =============================================================================
-- Strategy:
--   • Enable RLS on ALL 23 public tables
--   • Grant FULL access to `service_role` (our NestJS backend — bypasses RLS)
--   • Block direct access from `anon` and `authenticated` Supabase roles
--     (all app traffic flows through the NestJS API, never directly to Supabase Data API)
--
-- HOW TO RUN:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Paste this entire file and click "Run"
-- =============================================================================

-- ─── 1. Enable RLS on all 23 tables ─────────────────────────────────────────

ALTER TABLE public.restaurants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs          ENABLE ROW LEVEL SECURITY;

-- ─── 2. Grant service_role full access (bypasses RLS automatically) ──────────
-- Note: service_role already bypasses RLS in Supabase by default.
-- The GRANT below is just explicit documentation of intent.

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ─── 3. Revoke direct anon / authenticated access ────────────────────────────
-- All API access must go through the NestJS backend (which uses service_role key).
-- Direct PostgREST/Data API calls from browsers are blocked.

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- ─── 4. RLS Policies — Block all direct client access ────────────────────────
-- These deny-by-default policies ensure that even if a grant slips through,
-- no row is exposed without going through the backend.

-- Example: deny anon reads on every table (already enforced by REVOKE above,
-- but policies add a defense-in-depth layer)

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'restaurants','users','roles','permissions','role_permissions',
    'user_roles','branches','branch_users','categories','products',
    'product_images','tables','customers','orders','order_items',
    'payments','inventory','inventory_movements','suppliers',
    'purchases','purchase_items','notifications','audit_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Drop any existing permissive policies first
    EXECUTE format(
      'DROP POLICY IF EXISTS "anon_deny_all" ON public.%I', tbl
    );
    -- Create a deny-all policy for anon (SELECT returns 0 rows)
    EXECUTE format(
      'CREATE POLICY "anon_deny_all" ON public.%I
       AS RESTRICTIVE FOR ALL TO anon
       USING (false)', tbl
    );
  END LOOP;
END;
$$;

-- ─── 5. Verification query ────────────────────────────────────────────────────
-- Run this after applying to confirm RLS is enabled on all tables:
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
