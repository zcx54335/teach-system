import Taro from '@tarojs/taro'

// ==========================================
// 🔑 真实配置区
// ==========================================
const SUPABASE_URL = 'https://xnvqqddrnaynucvatvoq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudnFxZGRybmF5bnVjdmF0dm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMjYxNjYsImV4cCI6MjA5MDYwMjE2Nn0.gKqSoE5uVQ1wGrSFr9DFHPsQhjTQmBfFjnnSVJlLYIs' 

/**
 * 这是一个手动封装的请求工具
 * 绕过所有第三方库，直接通过 REST API 访问数据库
 */
export const supabase = {
  // 手动模拟 select 查询逻辑
  from: (tableName: string) => {
    return {
      select: (columns: string = '*') => {
        return {
          eq: (columnName: string, value: any) => {
            return {
              single: async () => {
                try {
                  const res = await Taro.request({
                    url: `${SUPABASE_URL}/rest/v1/${tableName}?${columnName}=eq.${value}&select=${columns}`,
                    method: 'GET',
                    header: {
                      'apikey': SUPABASE_ANON_KEY,
                      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                      'Content-Type': 'application/json',
                      'Prefer': 'return=representation'
                    }
                  })
                  
                  // 如果返回的是数组，取第一个；否则直接返回
                  const data = Array.isArray(res.data) ? res.data[0] : res.data
                  return { data, error: res.statusCode >= 400 ? res.data : null }
                } catch (err) {
                  return { data: null, error: err }
                }
              }
            }
          }
        }
      }
    }
  }
}