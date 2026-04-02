import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!rawSupabaseUrl || !supabaseAnonKey) {
  console.warn("未找到 Supabase 配置！请检查 .env.local 文件。");
}

// 生产环境走 Vercel Rewrite 代理加速，开发环境直连
const isProd = import.meta.env.PROD;
const origin = window.location.origin || 'https://xiongxiong.top';

// 在使用 Vercel Proxy 时，我们将所有 Supabase 请求交给 /supabase-proxy
// Vercel 会将 /supabase-proxy 完整转发给原厂域名。
const supabaseUrl = isProd ? `${origin}/supabase-proxy` : rawSupabaseUrl;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  }
});

