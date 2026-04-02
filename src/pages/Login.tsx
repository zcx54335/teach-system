import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Lock, LogIn, AlertCircle, Users } from 'lucide-react';

const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'parent' ? 'parent' : 'admin';
  const redirectUrl = searchParams.get('redirect') || '';

  const [loginType, setLoginType] = useState<'admin' | 'parent'>(initialType);
  const [identifier, setIdentifier] = useState(''); // 邮箱 或 手机号
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 检查是否已经登录
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (session.user.email?.endsWith('@student.aalon.com')) {
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
      // 如果是家长，将手机号伪装成内部邮箱进行验证
      const email = loginType === 'parent' ? `${identifier}@student.aalon.com` : identifier;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(loginType === 'parent' ? '登录失败：手机号或密码错误' : '登录失败：邮箱或密码错误');
      } else if (data.session) {
        if (loginType === 'parent') {
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
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,211,238,0.5)] mb-6 transition-transform hover:scale-105 duration-300">
            {loginType === 'admin' ? <Lock className="w-10 h-10 text-white" /> : <Users className="w-10 h-10 text-white" />}
          </div>
          <h1 className="text-4xl font-black tracking-widest mb-2 drop-shadow-md">AALON</h1>
          <p className="text-xs font-mono tracking-[0.3em] text-cyan-400 uppercase">
            {loginType === 'admin' ? 'Exclusive System Access' : 'Parent Portal'}
          </p>
        </div>

        {/* 角色切换 - 仅作为彩蛋保留，或者直接隐藏家长登录 */}
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl mb-8 backdrop-blur-md hidden">
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

        <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          {/* 装饰光效 */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px]"></div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-6 relative z-10">
            <div>
              <label className="block text-xs font-mono text-gray-400 tracking-widest mb-2 uppercase">
                {loginType === 'admin' ? 'Admin Email' : 'Registered Phone'}
              </label>
              <input
                type={loginType === 'admin' ? 'email' : 'tel'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                placeholder={loginType === 'admin' ? 'aalon@example.com' : '13800138000'}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 tracking-widest mb-2 uppercase">
                Security Key
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-bold py-4 rounded-xl tracking-widest transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6 relative overflow-hidden group ${
                loginType === 'admin' 
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] animate-pulse-glow'
                  : 'bg-gradient-to-r from-stem-orange to-red-500 hover:from-orange-500 hover:to-red-400 shadow-[0_0_20px_rgba(255,107,0,0.3)] hover:shadow-[0_0_30px_rgba(255,107,0,0.5)]'
              }`}
            >
              {/* 光效扫过动画 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              
              <div className="relative z-10 flex items-center">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    AUTHENTICATE
                  </>
                )}
              </div>
            </button>
          </div>
        </form>

        <div className="text-center mt-8">
          <button 
            onClick={() => navigate('/')}
            className="text-xs font-mono text-gray-500 hover:text-cyan-400 transition-colors tracking-widest"
          >
            ← RETURN TO BRAND PAGE
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;