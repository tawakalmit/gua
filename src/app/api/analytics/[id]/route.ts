import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { computeAnalytics } from '@/lib/mockStore';
import { ClickItem } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Missing link id' }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // 1. Get current logged in user
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Fetch Link
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('*')
      .eq('id', id)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'Link tidak ditemukan' }, { status: 404 });
    }

    // 3. Strict privacy rule: user must be logged in and can ONLY view their own link
    if (!user || (link.user_id && link.user_id !== user.id)) {
      return NextResponse.json(
        { error: 'Akses Ditolak: Anda hanya dapat melihat data analitik tautan yang Anda buat sendiri.' },
        { status: 403 }
      );
    }

    // 4. Fetch Clicks for this link
    const { data: clicks, error: clicksError } = await supabase
      .from('clicks')
      .select('*')
      .eq('link_id', id)
      .order('created_at', { ascending: false });

    if (clicksError) {
      return NextResponse.json({ error: clicksError.message }, { status: 500 });
    }

    const summary = computeAnalytics((clicks || []) as ClickItem[]);

    return NextResponse.json({
      link,
      analytics: summary,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
