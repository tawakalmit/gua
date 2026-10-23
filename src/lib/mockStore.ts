import { LinkItem, ClickItem, AnalyticsSummary } from '@/types/database';

const STORAGE_KEY_LINKS = 'gua_shortened_links';
const STORAGE_KEY_CLICKS = 'gua_tracked_clicks';

const INITIAL_DEMO_LINKS: LinkItem[] = [
  {
    id: 'demo-1',
    user_id: 'guest',
    original_url: 'https://github.com/supabase/supabase',
    short_code: 'supa',
    custom_alias: 'supa',
    title: 'Supabase GitHub Repository',
    is_active: true,
    clicks_count: 142,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo-2',
    user_id: 'guest',
    original_url: 'https://nextjs.org/docs/app/building-your-application/routing/redirecting',
    short_code: 'next-docs',
    custom_alias: 'next-docs',
    title: 'Next.js App Router Documentation',
    is_active: true,
    clicks_count: 89,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'demo-3',
    user_id: 'guest',
    original_url: 'https://instagram.com/gua_shortener',
    short_code: 'ig-bio',
    custom_alias: 'ig-bio',
    title: 'Profil Instagram Gua Shortener',
    is_active: true,
    clicks_count: 320,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Generate sample realistic clicks for demo links
function generateDemoClicks(linkId: string, count: number): ClickItem[] {
  const referrers = ['WhatsApp', 'Instagram', 'Twitter / X', 'Direct', 'Google', 'Telegram', 'Facebook'];
  const countries = ['ID', 'ID', 'ID', 'SG', 'MY', 'US', 'JP'];
  const devices = ['mobile', 'mobile', 'desktop', 'mobile', 'tablet', 'desktop'];
  const browsers = ['Chrome', 'Safari', 'Chrome', 'Firefox', 'Edge'];
  const oss = ['Android', 'iOS', 'Windows', 'macOS'];

  const clicks: ClickItem[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const timeOffset = Math.floor(Math.random() * 7 * 86400000);
    const date = new Date(now - timeOffset).toISOString();
    clicks.push({
      id: `click-${linkId}-${i}`,
      link_id: linkId,
      created_at: date,
      ip: `180.252.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      country: countries[Math.floor(Math.random() * countries.length)],
      city: 'Jakarta',
      referrer: referrers[Math.floor(Math.random() * referrers.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      os: oss[Math.floor(Math.random() * oss.length)],
    });
  }
  return clicks;
}

export function getLocalLinks(): LinkItem[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_LINKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LINKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(INITIAL_DEMO_LINKS));
      return INITIAL_DEMO_LINKS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_LINKS;
  }
}

export function saveLocalLink(newLink: LinkItem): LinkItem {
  const current = getLocalLinks();
  const updated = [newLink, ...current.filter((l) => l.id !== newLink.id)];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(updated));
  }
  return newLink;
}

export function updateLocalLink(id: string, updates: Partial<LinkItem>): LinkItem | null {
  const current = getLocalLinks();
  const index = current.findIndex((l) => l.id === id);
  if (index === -1) return null;

  current[index] = {
    ...current[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(current));
  }
  return current[index];
}

export function deleteLocalLink(id: string): boolean {
  const current = getLocalLinks();
  const filtered = current.filter((l) => l.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(filtered));
  }
  return true;
}

export function getLocalClicks(linkId: string): ClickItem[] {
  if (typeof window === 'undefined') return generateDemoClicks(linkId, 50);
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_CLICKS}_${linkId}`);
    if (!raw) {
      const demoClicks = generateDemoClicks(linkId, 45);
      localStorage.setItem(`${STORAGE_KEY_CLICKS}_${linkId}`, JSON.stringify(demoClicks));
      return demoClicks;
    }
    return JSON.parse(raw);
  } catch {
    return generateDemoClicks(linkId, 30);
  }
}

export function recordLocalClick(linkId: string, clickData: Partial<ClickItem>): void {
  if (typeof window === 'undefined') return;
  const current = getLocalClicks(linkId);
  const newClick: ClickItem = {
    id: `click-${Date.now()}`,
    link_id: linkId,
    created_at: new Date().toISOString(),
    country: clickData.country || 'ID',
    city: clickData.city || 'Jakarta',
    referrer: clickData.referrer || 'Direct',
    device: clickData.device || 'mobile',
    browser: clickData.browser || 'Chrome',
    os: clickData.os || 'Android',
    ip: clickData.ip || '127.0.0.1',
  };
  const updated = [newClick, ...current];
  localStorage.setItem(`${STORAGE_KEY_CLICKS}_${linkId}`, JSON.stringify(updated));

  // update click count on link
  const links = getLocalLinks();
  const link = links.find((l) => l.id === linkId);
  if (link) {
    updateLocalLink(linkId, { clicks_count: (link.clicks_count || 0) + 1 });
  }
}

export function computeAnalytics(clicks: ClickItem[]): AnalyticsSummary {
  const totalClicks = clicks.length;

  // unique IPs
  const uniqueIps = new Set(clicks.map((c) => c.ip || c.id));
  const uniqueVisitors = uniqueIps.size;

  // Today's clicks
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayClicks = clicks.filter((c) => c.created_at.startsWith(todayStr)).length;

  // Aggregate Helper
  const aggregate = (key: keyof ClickItem) => {
    const map: Record<string, number> = {};
    clicks.forEach((c) => {
      const val = (c[key] as string) || 'Unknown';
      map[val] = (map[val] || 0) + 1;
    });

    const entries = Object.entries(map).map(([name, count]) => ({
      name,
      count,
      percentage: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0,
    }));
    entries.sort((a, b) => b.count - a.count);
    return entries;
  };

  const countriesAgg = aggregate('country').map((e) => ({
    country: e.name,
    count: e.count,
    percentage: e.percentage,
  }));

  const referrersAgg = aggregate('referrer').map((e) => ({
    referrer: e.name,
    count: e.count,
    percentage: e.percentage,
  }));

  const devicesAgg = aggregate('device').map((e) => ({
    device: e.name,
    count: e.count,
    percentage: e.percentage,
  }));

  const browsersAgg = aggregate('browser').map((e) => ({
    browser: e.name,
    count: e.count,
    percentage: e.percentage,
  }));

  const osAgg = aggregate('os').map((e) => ({
    os: e.name,
    count: e.count,
    percentage: e.percentage,
  }));

  // Timeline: last 7 days
  const clicksOverTime: { date: string; clicks: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayClicks = clicks.filter((c) => c.created_at.startsWith(dateStr)).length;
    clicksOverTime.push({
      date: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'numeric' }),
      clicks: dayClicks,
    });
  }

  return {
    totalClicks,
    uniqueVisitors,
    todayClicks,
    topCountry: countriesAgg[0] ? { name: countriesAgg[0].country, count: countriesAgg[0].count } : { name: '-', count: 0 },
    topReferrer: referrersAgg[0] ? { name: referrersAgg[0].referrer, count: referrersAgg[0].count } : { name: '-', count: 0 },
    topDevice: devicesAgg[0] ? { name: devicesAgg[0].device, count: devicesAgg[0].count } : { name: '-', count: 0 },
    clicksOverTime,
    countries: countriesAgg,
    referrers: referrersAgg,
    devices: devicesAgg,
    browsers: browsersAgg,
    os: osAgg,
  };
}
