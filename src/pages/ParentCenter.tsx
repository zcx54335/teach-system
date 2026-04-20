import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { LogOut, BookOpen, Activity, Hexagon, User, FileText, Download } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const ParentCenter: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'report' | 'materials'>('report');
  const [user, setUser] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [radarScores, setRadarScores] = useState([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    const sessionStr = localStorage.getItem('xiaoyu_user');
    if (sessionStr) {
      try {
        const parsed = JSON.parse(sessionStr);
        if (parsed.role === 'parent') {
          setUser(parsed);
          // 使用家长手机号去匹配 students 表的 parent_phone
          fetchStudentData(parsed.phone);
        } else {
          navigate('/login');
        }
      } catch (e) {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchStudentData = async (parentPhone: string) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('parent_phone', parentPhone)
        .single();

      if (!error && data) {
        setStudent(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!student) return;
    const targets = [
      student.calc_score ?? 3,
      student.logic_score ?? 3,
      student.spatial_score ?? 3,
      student.app_score ?? 3,
      student.data_score ?? 3,
      student.physics_score ?? 3,
      student.chemistry_score ?? 3
    ];
    
    let startTime: number | null = null;
    const duration = 1500;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      let progress = elapsed / duration;
      if (progress > 1) progress = 1;
      
      const ease = 1 - Math.pow(1 - progress, 4);
      setRadarScores(targets.map(t => Number((t * ease).toFixed(1))));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [student]);

  const radarData = useMemo(() => {
    return [
      { subject: '计算力', A: radarScores[0], fullMark: 5 },
      { subject: '逻辑推理', A: radarScores[1], fullMark: 5 },
      { subject: '空间想象', A: radarScores[2], fullMark: 5 },
      { subject: '应用意识', A: radarScores[3], fullMark: 5 },
      { subject: '数据分析', A: radarScores[4], fullMark: 5 },
      { subject: '物理逻辑', A: radarScores[5], fullMark: 5 },
      { subject: '化学逻辑', A: radarScores[6], fullMark: 5 },
    ];
  }, [radarScores]);

  const renderPolarAngleAxis = ({ payload, x, y, cx, cy, ...rest }: any) => {
    const offset = 20;
    const dx = x - cx;
    const dy = y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const nx = distance > 0 ? x + (dx / distance) * offset : x;
    const ny = distance > 0 ? y + (dy / distance) * offset : y;

    return (
      <text
        {...rest}
        x={nx}
        y={ny}
        cx={cx}
        cy={cy}
        fill="#9ca3af"
        fontSize="10px"
        fontFamily="monospace"
        textAnchor={nx > cx ? 'start' : nx < cx ? 'end' : 'middle'}
      >
        {payload.value}
      </text>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('xiaoyu_user');
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-inter selection:bg-cyan-500/30 overflow-x-hidden relative flex flex-col">
      {/* 动态背景 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] mix-blend-screen animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900/10 blur-[120px] mix-blend-screen animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="fixed inset-0 bg-blueprint bg-blueprint pointer-events-none opacity-10 z-0"></div>

      {/* 顶部导航 */}
      <header className="relative z-10 w-full py-6 px-6 flex justify-between items-center max-w-md mx-auto">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            <Hexagon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-widest text-white drop-shadow-md">
              家长专属中心
            </h1>
            <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">{user?.full_name}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg hover:bg-white/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4 text-gray-400" />
        </button>
      </header>

      {/* Tab 切换 */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 mb-6">
        <div className="flex p-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
          <button 
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold tracking-widest transition-all duration-300 flex items-center justify-center space-x-2 ${
              activeTab === 'report' ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Activity className="w-4 h-4" /> <span>学情报告</span>
          </button>
          <button 
            onClick={() => setActiveTab('materials')}
            className={`flex-1 py-3 rounded-xl text-xs font-bold tracking-widest transition-all duration-300 flex items-center justify-center space-x-2 ${
              activeTab === 'materials' ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <BookOpen className="w-4 h-4" /> <span>学习资料</span>
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <main className="relative z-10 flex-1 w-full max-w-md mx-auto px-6 pb-12">
        {activeTab === 'report' && student && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 学生基础信息卡片 */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-6 flex items-center justify-between shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl transition-all"></div>
              <div>
                <h2 className="text-2xl font-bold tracking-widest text-white mb-1 flex items-center">
                  <User className="w-5 h-5 mr-2 text-cyan-400" />
                  {student.name}
                </h2>
                <span className="text-xs font-mono text-gray-400 px-2 py-0.5 bg-white/10 rounded border border-white/5">{student.grade || '未分配年级'}</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">剩余课时</p>
                <p className="text-3xl font-light text-cyan-400 tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                  {student.remaining_lessons}
                </p>
              </div>
            </div>

            {/* 雷达图卡片 */}
            <div className="bg-white/5 backdrop-blur-xl border border-stem-orange/30 rounded-3xl p-6 shadow-[0_0_40px_rgba(255,107,0,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-stem-orange/10 rounded-full blur-[60px] pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none"></div>
              
              <h3 className="text-sm font-bold tracking-widest text-white mb-6 flex items-center justify-center">
                <Activity className="w-4 h-4 mr-2 text-stem-orange" />
                理科逻辑能力评估
              </h3>

              <div className="h-[280px] w-full flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                    <PolarGrid gridType="polygon" stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={renderPolarAngleAxis} 
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar
                      name="Ability"
                      dataKey="A"
                      stroke="#ff6b00"
                      strokeWidth={2}
                      fill="#ff6b00"
                      fillOpacity={0.3}
                      isAnimationActive={false}
                      label={{ fill: '#ff6b00', fontSize: 10, fontWeight: 'bold', position: 'top' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              
              <button 
                onClick={() => navigate(`/parent?id=${student.id}`)}
                className="w-full mt-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-xs font-bold tracking-widest text-gray-300 transition-colors flex items-center justify-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                查看完整成长轨迹 (时间轴)
              </button>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-64 flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <Download className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-sm font-bold tracking-widest text-white mb-3">
              学习资料整理中
            </h3>
            <p className="text-xs text-gray-400 font-light leading-relaxed tracking-wider">
              杨老师正在为您准备近期理科逻辑学习资料...<br/>请稍后查看。
            </p>
          </div>
        )}

        {activeTab === 'report' && !student && (
          <div className="h-64 flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center">
            <User className="w-8 h-8 text-gray-600 mb-4" />
            <p className="text-xs text-gray-400 tracking-widest">暂未查询到关联的学员信息<br/>请联系杨老师核对手机号</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ParentCenter;