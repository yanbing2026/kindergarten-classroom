# Supabase foundation

This directory contains the database foundation for Kindergarten Classroom.

## Setup
1. Create/open the Supabase project.
2. Open SQL Editor.
3. Run `migrations/001_initial_schema.sql`.
4. Do not put a Supabase service-role key in GitHub Pages.
5. The browser may use the public/publishable key only after RLS policies are finalized.

## Migration strategy
The existing JavaScript/data question banks remain the fallback source until each module is migrated and tested against Supabase.
