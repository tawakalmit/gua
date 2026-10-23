import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { parseUserAgent, cleanReferrer } from '@/lib/utils';
import { getLocalLinks, recordLocalClick } from '@/lib/mockStore';

// We exclude system routes from catching
const SYSTEM_ROUTES = ['dashboard', 'auth', 'api', 'favicon.ico', '_next'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code || SYSTEM_ROUTES.includes(code.toLowerCase())) {
    return NextResponse.next();
  }

  // 1. Gather tracking metadata from incoming request headers
  const userAgent = request.headers.get('user-agent') || '';
  const rawReferrer = request.headers.get('referer') || '';
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const country =
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-vercel-ip-country') ||
    'ID'; // Default to ID for local or Indonesian traffic

  const city =
    request.headers.get('x-vercel-ip-city') ||
    'Jakarta';

  const { device, browser, os } = parseUserAgent(userAgent);
  const referrer = cleanReferrer(rawReferrer);

  try {
    const configured = isSupabaseConfigured();

    if (configured) {
      const supabase = await createServerSupabaseClient();

      // Find active link
      const { data: link, error } = await supabase
        .from('links')
        .select('id, original_url, is_active, clicks_count')
        .eq('short_code', code)
        .single();

      if (error || !link || !link.is_active) {
        // Link not found or deactivated
        return NextResponse.redirect(new URL('/not-found', request.url));
      }

      // Record tracking click asynchronously via RPC or direct insert
      const recordTracking = async () => {
        try {
          // Attempt RPC first for atomic increment
          const { error: rpcError } = await supabase.rpc('record_click', {
            p_link_id: link.id,
            p_ip: ip,
            p_country: country,
            p_city: city,
            p_referrer: referrer,
            p_device: device,
            p_browser: browser,
            p_os: os,
            p_user_agent: userAgent.slice(0, 500),
          });

          if (rpcError) {
            // Fallback direct insert
            await supabase.from('clicks').insert({
              link_id: link.id,
              ip,
              country,
              city,
              referrer,
              device,
              browser,
              os,
              user_agent: userAgent.slice(0, 500),
            });

            await supabase
              .from('links')
              .update({ clicks_count: (link.clicks_count || 0) + 1 })
              .eq('id', link.id);
          }
        } catch (trackErr) {
          console.error('Failed to log click tracking:', trackErr);
        }
      };

      // Execute logging
      await recordTracking();

      // Fast HTTP 302 Redirection
      return NextResponse.redirect(link.original_url, { status: 302 });
    } else {
      // Local/Demo fallback mode
      const localLinks = getLocalLinks();
      const link = localLinks.find((l) => l.short_code === code && l.is_active);

      if (!link) {
        return NextResponse.redirect(new URL('/not-found', request.url));
      }

      // Record local click tracking
      recordLocalClick(link.id, {
        ip,
        country,
        city,
        referrer,
        device,
        browser,
        os,
      });

      return NextResponse.redirect(link.original_url, { status: 302 });
    }
  } catch (err) {
    console.error('Redirect handler error:', err);
    return NextResponse.redirect(new URL('/not-found', request.url));
  }
}
