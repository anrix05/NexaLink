-- ============================================================================
-- Migration: 20261006000001_global_network_map_stats.sql
-- Function to retrieve public aggregated alumni distribution and totals
-- for the landing page hero Global Alumni Network Map.
-- SECURITY DEFINER with locked search_path ensures anon users can only query
-- pre-aggregated statistics without exposing individual personal records or RLS bypass.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_global_network_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_result JSONB;
    v_total_alumni INT;
    v_total_countries INT;
    v_total_cities INT;
    v_cities JSONB;
BEGIN
    -- 1. Calculate verified alumni total (matching public stats count: role = 'alumni' and verified)
    SELECT COUNT(*)
    INTO v_total_alumni
    FROM public.users u
    WHERE u.role = 'alumni'
      AND (u.is_verified = TRUE OR u.verification_status = 'Verified');

    -- 2. Aggregate cities and countries for verified alumni with non-null location/city
    WITH parsed_locations AS (
        SELECT 
            TRIM(SPLIT_PART(ap.location, ',', 1)) AS city_name,
            COALESCE(NULLIF(TRIM(ap.country), ''), 'India') AS country_name
        FROM public.alumni_profiles ap
        JOIN public.users u ON u.id = ap.user_id
        WHERE u.role = 'alumni'
          AND (u.is_verified = TRUE OR u.verification_status = 'Verified')
          AND ap.location IS NOT NULL
          AND TRIM(ap.location) <> ''
    ),
    city_aggregates AS (
        SELECT 
            city_name AS city,
            country_name AS country,
            COUNT(*)::INT AS alumni_count
        FROM parsed_locations
        WHERE city_name <> ''
        GROUP BY city_name, country_name
        ORDER BY alumni_count DESC, city_name ASC
    )
    SELECT 
        COALESCE(COUNT(DISTINCT city), 0),
        COALESCE(COUNT(DISTINCT country), 0),
        COALESCE(jsonb_agg(jsonb_build_object(
            'city', city,
            'country', country,
            'alumni_count', alumni_count
        )), '[]'::jsonb)
    INTO 
        v_total_cities,
        v_total_countries,
        v_cities
    FROM city_aggregates;

    -- If no cities are found, ensure valid default numbers
    v_total_cities := COALESCE(v_total_cities, 0);
    v_total_countries := COALESCE(v_total_countries, 0);
    v_cities := COALESCE(v_cities, '[]'::jsonb);

    v_result := jsonb_build_object(
        'totals', jsonb_build_object(
            'verified_alumni', COALESCE(v_total_alumni, 0),
            'countries', v_total_countries,
            'cities', v_total_cities
        ),
        'cities', v_cities
    );

    RETURN v_result;
END;
$$;

-- Grant execution to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_global_network_stats() TO anon, authenticated;
