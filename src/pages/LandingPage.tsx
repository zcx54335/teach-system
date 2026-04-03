import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, Brain, Zap, Target, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
            {isLoggedIn ? '小鱼 · 杨老师控制台' : '小鱼思维'}
          </span>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="relative group overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 rounded-full hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:shadow-[0_0_30px_rgba(34,211,238,0.7)] border border-cyan-300/50"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          <span className="relative z-10 text-sm font-bold tracking-widest text-white drop-shadow-md">
            登录
          </span>
        </button>
      </header>

      {/* 核心展示区 */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto w-full">
        <div className="inline-block px-4 py-1.5 mb-8 rounded-full bg-white/5 border border-cyan-500/30 backdrop-blur-md">
          <span className="text-xs font-medium tracking-[0.2em] text-cyan-400 uppercase">
            
          </span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">小鱼思维</span>
          <br />
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl font-light tracking-wide max-w-2xl mb-12 leading-relaxed">
          拒绝机械刷题
          <br />
          以逻辑框架构建孩子的底层思维能力
          <br />
          贯通数理化全科，打造坚实的理科基础
        </p>

        {/* 如果已登录，首页中间显示进入控制台按钮，否则移除 */}
        {isLoggedIn && (
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="group relative overflow-hidden px-10 py-5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 shadow-[0_0_40px_rgba(34,211,238,0.4)] hover:shadow-[0_0_60px_rgba(34,211,238,0.6)] hover:scale-105 transition-all duration-300 ease-out active:scale-95 mb-16"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <span className="relative z-10 text-lg font-bold tracking-widest text-white">
              杨老师 · 管理控制台
            </span>
          </button>
        )}

        {/* 理念卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
          {[
            { 
              icon: Brain, 
              title: "基础巩固", 
              desc: "从源头解析概念原理，培养独立思考与推理能力。",
              details: "校内跟不上，是逻辑断层。针对学校快进度，提供精准的‘知识补位’。校内没听懂的难题，在这里变简单；校内讲不透的原理，在这里被看穿。 不只是在补课，而是在帮孩子接通断掉的逻辑电路，让基础从‘短板’变成‘跳板’。"
            },
            { 
              icon: Target, 
              title: "b卷难题", 
              desc: "精准定位并突破瓶颈。",
              details: "B卷难题不是靠‘灵光一现’，而是靠思维模型的精确套用。拒绝让孩子在考场上‘盲目试错’。带孩子深度拆解成都历年B卷真题，将复杂的综合压轴题还原为基础模型的叠加。让孩子拥有‘一眼看穿题魂’的能力，变‘苦思冥想’为‘有序推演’。 拿稳B卷关键分，才是拉开差距的硬实力。"
            },
            { 
              icon: Zap, 
              title: "计算能力·做题速度", 
              desc: "将抽象理论融入硬核实践，激发潜能。",
              details: "低级错误，是高阶思维最大的敌人。 不提倡盲目苦练，而是通过‘数感重塑’和‘结构化演算’，让计算像呼吸一样自然、准确。在考场上，时间就是分数。 速度慢的本质是‘思维路径太长’。我们通过‘解题套路内化’和‘计算简便技巧’，剪掉冗余步骤。让孩子掌握‘一眼看结果、提笔即正确’的快节奏感。"
            }
          ].map((item, idx) => {
            const [isExpanded, setIsExpanded] = useState(false);
            
            return (
              <motion.div 
                key={idx} 
                layout
                onClick={() => setIsExpanded(!isExpanded)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl cursor-pointer group text-left overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.2)]"
              >
                {/* 卡片微光边缘效果 */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className={`absolute -inset-px bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl opacity-0 transition-opacity duration-500 pointer-events-none blur-sm ${isExpanded ? 'opacity-30' : 'group-hover:opacity-20'}`}></div>
                
                <motion.div layout className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between">
                    <item.icon className={`w-8 h-8 text-cyan-400 mb-6 transition-transform duration-500 ${isExpanded ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10"
                    >
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </motion.div>
                  </div>
                  
                  <motion.h3 layout className="text-lg font-bold text-white mb-3 tracking-wider">{item.title}</motion.h3>
                  <motion.p layout className="text-sm text-gray-400 font-light leading-relaxed">{item.desc}</motion.p>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pt-6 border-t border-white/10">
                          <p className="text-xs text-cyan-300/80 leading-relaxed font-mono tracking-wide">
                            {item.details}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="relative z-10 py-8 text-center border-t border-white/5 mt-auto">
        <p className="text-[10px] font-mono text-gray-600 tracking-widest uppercase">
          &copy; {new Date().getFullYear()} 小鱼思维
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;