import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Lock, LogIn, AlertCircle, Users, CheckCircle2 } from 'lucide-react';

const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'parent' ? 'parent' : 'admin';
  const redirectUrl = searchParams.get('redirect') || '';

  const [loginType, setLoginType] = useState<'admin' | 'parent'>(initialType);
  const [identifier, setIdentifier] = useState(''); // 邮箱 或 手机号
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 初始化记住账号
  useEffect(() => {
    const savedIdentifier = localStorage.getItem('rememberedIdentifier');
    if (savedIdentifier) {
      setIdentifier(savedIdentifier);
      setRememberMe(true);
    }
  }, []);

  // 检查是否已经登录
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // 从 profiles 表获取角色
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'parent') {
          navigate(redirectUrl || '/parent');
        } else {
          navigate('/admin');
        }
      }
    };
    checkSession();
  }, [navigate, redirectUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: identifier,
        password,
      });

      if (error) {
        setError('账号或密码错误，请重试');
      } else if (data.session) {
        // 处理记住账号
        if (rememberMe) {
          localStorage.setItem('rememberedIdentifier', identifier);
        } else {
          localStorage.removeItem('rememberedIdentifier');
        }

        // 登录成功后，根据 profiles 表中的角色进行跳转
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();

        if (profile?.role === 'parent') {
          navigate(redirectUrl || '/parent');
        } else {
          navigate('/admin');
        }
      }
    } catch (err: any) {
      setError(err.message || '发生未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 relative overflow-hidden font-inter selection:bg-cyan-500/30">
      {/* 动态深邃背景 */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-cyan-900/20 blur-[120px] mix-blend-screen animate-blob"></div>
        <div className="absolute bottom-[10%] right-[20%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[150px] mix-blend-screen animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(255,255,255,0.05)] mb-6 transition-transform hover:scale-105 duration-300">
            <Lock className="w-10 h-10 text-white/80" />
          </div>
          <h1 className="text-4xl font-light tracking-[0.3em] mb-2 drop-shadow-md">
            小鱼思维
          </h1>
          <p className="text-[10px] font-mono tracking-[0.4em] text-gray-500 uppercase">
            系统入口
          </p>
        </div>

        {/* 角色切换 - 已经全部采用手机号登录，隐藏此部分以统一界面 */}
        <div className="hidden flex p-1 bg-white/5 border border-white/10 rounded-xl mb-8 backdrop-blur-md">
          <button
            onClick={() => setLoginType('admin')}
            className={`flex-1 py-2.5 text-xs font-mono tracking-widest rounded-lg transition-all duration-300 ${loginType === 'admin' ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            导师登录
          </button>
          <button
            onClick={() => setLoginType('parent')}
            className={`flex-1 py-2.5 text-xs font-mono tracking-widest rounded-lg transition-all duration-300 ${loginType === 'parent' ? 'bg-stem-orange/20 text-stem-orange shadow-[0_0_15px_rgba(255,107,0,0.2)]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            家长登录
          </button>
        </div>

        <form onSubmit={handleLogin} className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* 装饰光效 */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-[50px] pointer-events-none"></div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-6 relative z-10">
            <div>
              <label className="block text-xs font-mono text-gray-400 tracking-widest mb-2 uppercase">
                账号/手机号
              </label>
              <input
                type="tel"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-black/80 transition-all font-mono"
                placeholder="请输入手机号"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 tracking-widest mb-2 uppercase">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-black/80 transition-all font-mono"
                placeholder="••••••••"
                required
              />
            </div>

            {/* 记住我 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <div className="relative w-4 h-4">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer absolute opacity-0 w-0 h-0"
                  />
                  <div className="w-4 h-4 border border-white/20 rounded bg-white/5 flex items-center justify-center peer-checked:bg-cyan-500 peer-checked:border-cyan-500 transition-colors group-hover:border-white/40">
                    {rememberMe && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-gray-400 group-hover:text-gray-300 transition-colors tracking-widest">
                  记住账号
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-medium py-4 rounded-xl tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6 relative overflow-hidden group bg-white/10 hover:bg-white/20 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]`}
            >
              {/* 光效扫过动画 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              
              <div className="relative z-10 flex items-center">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    登录
                  </>
                )}
              </div>
            </button>
          </div>
        </form>

        <div className="text-center mt-8">
          <button 
            onClick={() => navigate('/')}
            className="text-[10px] font-mono text-gray-500 hover:text-white transition-colors tracking-[0.3em] uppercase"
          >
            ← 返回首页
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;