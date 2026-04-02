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
    // 覆盖默认的请求 fetch，以便在请求 Storage 等其他非 /rest 路径时也能正确映射
    // 注意：这里的简单替换适用于 /rest/v1 的默认请求。如果是 storage，Vercel Rewrite 已配置 /supabase-storage
    fetch: (url, options) => {
      let finalUrl = url.toString();
      if (isProd && typeof window !== 'undefined') {
        // 如果是 Storage 请求
        if (finalUrl.includes('/storage/v1')) {
          finalUrl = finalUrl.replace(`${rawSupabaseUrl}/storage/v1`, `${window.location.origin}/supabase-storage`);
        }
      }
      return fetch(finalUrl, options);
    }
  }
});
