export interface LinkItem {
  id: string;
  user_id?: string | null;
  original_url: string;
  short_code: string;
  custom_alias?: string | null;
  title?: string | null;
  is_active: boolean;
  clicks_count: number;
  created_at: string;
  updated_at: string;
}

export interface ClickItem {
  id: string;
  link_id: string;
  created_at: string;
  ip?: string | null;
  country: string;
  city: string;
  referrer: string;
  device: string;
  browser: string;
  os: string;
  user_agent?: string | null;
}

export interface AnalyticsSummary {
  totalClicks: number;
  uniqueVisitors: number;
  todayClicks: number;
  topCountry: { name: string; count: number };
  topReferrer: { name: string; count: number };
  topDevice: { name: string; count: number };
  clicksOverTime: { date: string; clicks: number }[];
  countries: { country: string; count: number; percentage: number }[];
  referrers: { referrer: string; count: number; percentage: number }[];
  devices: { device: string; count: number; percentage: number }[];
  browsers: { browser: string; count: number; percentage: number }[];
  os: { os: string; count: number; percentage: number }[];
}
