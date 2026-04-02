import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, Brain, Zap, Target } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-inter selection:bg-cyan-500/30 overflow-hidden relative flex flex-col">
      {/* 动态星空深邃背景 (优化性能) */}
      <div className="fixed inset-0 z-0 pointer-events-none transform-gpu">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[100px] mix-blend-screen animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[80px] mix-blend-screen animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-20 z-0 pointer-events-none"></div>

      {/* 导航栏 */}
      <header className="relative z-10 w-full py-6 px-8 flex justify-between items-center max-w-5xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            <Hexagon className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-widest text-white drop-shadow-md">
            {isLoggedIn ? '小鱼 · 杨老师控制台' : '小鱼理科逻辑'}
          </span>
        </div>
      </header>

      {/* 核心展示区 */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto w-full">
        <div className="inline-block px-4 py-1.5 mb-8 rounded-full bg-white/5 border border-cyan-500/30 backdrop-blur-md">
          <span className="text-xs font-medium tracking-[0.2em] text-cyan-400 uppercase">
            Exclusive STEM & Science Education
          </span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
          重塑 <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">理科逻辑</span>
          <br />
          点燃 STEM 潜能
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl font-light tracking-wide max-w-2xl mb-12 leading-relaxed">
          杨老师专属定制化教学体系。拒绝机械刷题，以顶级逻辑框架构建孩子的底层思维能力，贯通数理化全科，为未来精英打造坚实的理科基础。
        </p>

        {/* 巨大的登录按钮 */}
        <button 
          onClick={() => navigate('/login')}
          className="group relative overflow-hidden px-10 py-5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:shadow-[0_0_60px_rgba(34,211,238,0.6)] hover:scale-105 transition-all duration-300 ease-out active:scale-95 mb-16"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          <span className="relative z-10 text-lg font-bold tracking-widest text-white">
            {isLoggedIn ? '杨老师 · 管理控制台' : '进入管理系统'}
          </span>
        </button>

        {/* 理念卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
          {[
            { icon: Brain, title: "底层逻辑重构", desc: "从源头解析数学原理，培养独立思考与推理能力。" },
            { icon: Target, title: "个性化学情追踪", desc: "多维度雷达图数据分析，精准定位并突破瓶颈。" },
            { icon: Zap, title: "极客化 STEM 实践", desc: "将抽象理论融入硬核实践，激发跨学科应用潜能。" }
          ].map((item, idx) => (
            <div key={idx} className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-500 group text-left overflow-hidden">
              {/* 卡片微光边缘效果 */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <div className="absolute -inset-px bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="relative z-10">
                <item.icon className="w-8 h-8 text-cyan-400 mb-6 group-hover:scale-110 transition-transform duration-500" />
                <h3 className="text-lg font-bold text-white mb-3 tracking-wider">{item.title}</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="relative z-10 py-8 text-center border-t border-white/5 mt-auto">
        <p className="text-[10px] font-mono text-gray-600 tracking-widest uppercase">
          &copy; {new Date().getFullYear()} 杨老师 Education. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;