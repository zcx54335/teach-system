import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!rawSupabaseUrl || !supabaseAnonKey) {
  console.warn("未找到 Supabase 配置！请检查 .env.local 文件。");
}

// 生产环境走 Vercel Rewrite 代理加速，开发环境直连
const isProd = import.meta.env.PROD;
const supabaseUrl = isProd && typeof window !== 'undefined' 
  ? `${window.location.origin}/supabase-api` 
  : rawSupabaseUrl;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    }
  }
});
