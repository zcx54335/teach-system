import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, Shield, BookOpen, ChevronRight, Activity, Cpu, DollarSign, Users, Clock, X, ChevronLeft, CalendarCheck, FileText, Image as ImageIcon, Quote, LogOut, CheckCircle2 } from "lucide-react";
import { PageProps } from "../components/Layout/RollerNavigation";
import { supabase } from '../lib/supabaseClient';

import { createClient } from '@supabase/supabase-js';

// 扩展类型定义
interface CRMStudentRecord {
  id: string;
  name: string;
  grade: string;
  total_classes: number;
  remaining_classes: number;
  status: 'enrolled' | 'intent' | 'completed';
  price_per_lesson: number;
  total_amount: number;
  enrollment_date: string | null;
  phone?: string;
  class_records?: any[];
}

// 简单的动态粒子背景组件
const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置 Canvas 尺寸
    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener('resize', setSize);

    // 粒子类
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 1.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        // 边界回绕
        if (this.x > canvas!.width) this.x = 0;
        if (this.x < 0) this.x = canvas!.width;
        if (this.y > canvas!.height) this.y = 0;
        if (this.y < 0) this.y = canvas!.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = 'rgba(255, 107, 0, 0.3)'; // 亮橙色粒子
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 初始化粒子
    const particleArray: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      particleArray.push(new Particle());
    }

    // 动画循环
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particleArray.length; i++) {
        particleArray[i].update();
        particleArray[i].draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

const Profile: React.FC<PageProps> = ({ localProgress, students = [], fetchStudents, isLoading }) => {
  const [selectedStudent, setSelectedStudent] = useState<CRMStudentRecord | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const navigate = useNavigate();

  // 新增学员状态
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', phone: '', grade: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<{name: string, phone: string, id: string} | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudent.phone.length !== 11) {
      alert('请输入11位有效手机号');
      return;
    }
    
    setIsAdding(true);
    try {
      // 1. 使用备用客户端创建 Supabase Auth 用户，避免当前管理员被踢出
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      const supabaseSecondary = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

      const phone = newStudent.phone;
      const password = newStudent.phone.slice(-6);

      const { data: authData, error: authError } = await supabaseSecondary.auth.signUp({
        phone,
        password,
      });

      if (authError) {
        throw new Error(`Auth Error: ${authError.message}`);
      }

      // 2. 在 students 表中插入数据并关联 auth_id
      const { data: insertData, error: dbError } = await supabase.from('students').insert([{
        name: newStudent.name,
        phone: newStudent.phone,
        grade: newStudent.grade,
        status: 'enrolled',
        auth_id: authData.user?.id,
        password_hash: password, // 保存初始密码供参考
        remaining_classes: 0
      }]).select().single();

      if (dbError) {
        throw new Error(`DB Error: ${dbError.message}`);
      }

      // 注意：profiles 表的数据由 auth.users 的 Trigger 自动生成，
      // 若 Trigger 未能生效或需确保双重保险，可在此处额外进行更新：
      await supabase.from('profiles').upsert({
        id: authData.user?.id,
        role: 'parent',
        phone: newStudent.phone
      });

      setCreatedStudent({
        name: newStudent.name,
        phone: newStudent.phone,
        id: insertData.id
      });
      
      setNewStudent({ name: '', phone: '', grade: '' });
      if (fetchStudents) fetchStudents();

    } catch (err: any) {
      alert(`创建学员失败: ${err.message}\n(注: 若提示 Signups not allowed，请在 Supabase Auth 设置中开启 Enable Signups)`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleCopyLink = (id: string) => {
    const url = `https://xiongxiong.top/#/parent?id=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('家长专属链接已复制到剪贴板！');
    }).catch(() => {
      alert('复制失败，请手动选择复制');
    });
  };

  // 扣除课时逻辑
  const handleDeductClass = async (studentId: string, currentRemaining: number, studentName: string) => {
    if (currentRemaining <= 0) {
      alert('剩余课时不足，无法消课！');
      return;
    }
    
    if (!window.confirm(`确认要为学员 ${studentName} 扣除 1 个课时吗？`)) {
      return;
    }

    try {
      const newRemaining = currentRemaining - 1;
      const { error } = await supabase
        .from('students')
        .update({ 
          remaining_classes: newRemaining,
          last_deducted_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) throw error;

      alert(`已扣除 1 课时，${studentName} 剩余 ${newRemaining} 课时。`);
      
      // 预留接口：发送通知
      sendNotification(studentId, newRemaining);

      if (fetchStudents) fetchStudents();
    } catch (err: any) {
      alert('消课失败：' + err.message);
    }
  };

  // 预留的通知函数
  const sendNotification = (studentId: string, remainingClasses: number) => {
    // TODO: 接入短信或微信通知逻辑
    console.log(`[通知] 学员 ${studentId} 已消课，剩余课时: ${remainingClasses}`);
  };

  // 调试日志
  useEffect(() => {
    console.log('资产中心接收到的云端学生数据:', students);
  }, [students]);

  // 计算顶部概览数据
  const enrolledStudents = students.filter(s => s.status === 'enrolled').length;
  const totalRemainingClasses = students.reduce((acc, curr) => acc + (curr.remaining_classes || 0), 0);
  const expectedRevenue = students.reduce((acc, curr) => {
    // 简单模拟待收尾款：剩余课时 * 单价
    return acc + ((curr.remaining_classes || 0) * (curr.price_per_lesson || 0));
  }, 0);

  // 辅助函数：状态翻译
  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'enrolled': return { text: '在读', color: 'text-stem-green bg-stem-green/10 border-stem-green/30' };
      case 'intent': return { text: '意向', color: 'text-stem-orange bg-stem-orange/10 border-stem-orange/30' };
      case 'completed': return { text: '结课', color: 'text-gray-400 bg-gray-500/10 border-gray-500/30' };
      default: return { text: status, color: 'text-gray-400 bg-gray-500/10 border-gray-500/30' };
    }
  };

  return (
    <div className="min-h-full bg-stem-dark relative font-sans selection:bg-stem-orange/30 text-white overflow-hidden flex flex-col items-center pt-16 px-4 pb-32">
      
      {/* 动态粒子背景 */}
      <ParticleBackground />
      
      {/* 背景微弱网格 */}
      <div className="absolute inset-0 bg-blueprint bg-blueprint pointer-events-none opacity-20 z-0"></div>

      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 border-4 border-stem-orange/30 border-t-stem-orange rounded-full animate-spin"></div>
            <span className="text-stem-orange font-mono text-sm tracking-widest animate-pulse">LOADING CRM...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 w-full max-w-4xl mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light tracking-widest flex items-center space-x-3 text-white">
            <Shield className="w-8 h-8 text-stem-orange opacity-80" />
            <span>学生资产管理</span>
          </h1>
          <p className="text-[10px] text-stem-orange/60 tracking-[0.3em] uppercase mt-2 font-mono">
            Yang CRM System
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs font-mono text-white border border-stem-orange/50 px-3 py-1.5 rounded bg-stem-orange hover:bg-stem-orange/80 transition-colors shadow-[0_0_15px_rgba(255,107,0,0.4)]"
          >
            + 新增学员
          </button>
          <button 
            onClick={fetchStudents}
            className="text-xs font-mono text-stem-orange border border-stem-orange/30 px-3 py-1.5 rounded bg-stem-orange/10 hover:bg-stem-orange/20 transition-colors"
          >
            刷新数据
          </button>
          <button 
            onClick={handleLogout}
            className="text-xs font-mono text-red-400 border border-red-400/30 px-3 py-1.5 rounded bg-red-400/10 hover:bg-red-400/20 transition-colors flex items-center"
          >
            <LogOut className="w-3 h-3 mr-1" />
            登出系统
          </button>
        </div>
      </div>

      {/* 顶部数据概览 */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-stem-green/20 rounded-full blur-xl group-hover:bg-stem-green/30 transition-colors"></div>
          <div className="flex items-center space-x-3 mb-2">
            <Users className="w-4 h-4 text-stem-green" />
            <span className="text-[10px] font-mono text-gray-400 tracking-widest uppercase">在读总数</span>
          </div>
          <div className="text-3xl font-light text-white tracking-tighter">{enrolledStudents}</div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-cyan-500/20 rounded-full blur-xl group-hover:bg-cyan-500/30 transition-colors"></div>
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono text-gray-400 tracking-widest uppercase">总待消课时</span>
          </div>
          <div className="text-3xl font-light text-white tracking-tighter">{totalRemainingClasses}</div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-stem-orange/20 rounded-full blur-xl group-hover:bg-stem-orange/30 transition-colors"></div>
          <div className="flex items-center space-x-3 mb-2">
            <DollarSign className="w-4 h-4 text-stem-orange" />
            <span className="text-[10px] font-mono text-gray-400 tracking-widest uppercase">预计待收</span>
          </div>
          <div className="text-3xl font-light text-white tracking-tighter flex items-baseline">
            <span className="text-sm text-gray-500 mr-1">¥</span>{expectedRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 高级学生列表表格 */}
      <div className="relative z-10 w-full max-w-4xl bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-xs font-mono text-gray-400 tracking-widest uppercase">学生姓名</th>
                <th className="px-6 py-4 text-xs font-mono text-gray-400 tracking-widest uppercase">年级</th>
                <th className="px-6 py-4 text-xs font-mono text-gray-400 tracking-widest uppercase">状态</th>
                <th className="px-6 py-4 text-xs font-mono text-gray-400 tracking-widest uppercase">课时进度</th>
                <th className="px-6 py-4 text-xs font-mono text-gray-400 tracking-widest uppercase text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.map(student => {
                const isWarning = student.remaining_classes <= 3 && student.status === 'enrolled';
                const statusStyle = getStatusDisplay(student.status);
                
                return (
                  <tr 
                    key={student.id} 
                    className={`transition-colors hover:bg-white/5 ${isWarning ? 'bg-red-500/5' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm border border-white/20">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-bold text-white tracking-wider">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 font-light">{student.grade}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-mono px-2 py-1 rounded border ${statusStyle.color}`}>
                        {statusStyle.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className={`text-sm font-bold ${isWarning ? 'text-red-400' : 'text-cyan-400'}`}>
                          {student.remaining_classes}
                        </div>
                        <span className="text-xs text-gray-500">/ {student.total_classes}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleDeductClass(student.id, student.remaining_classes, student.name)}
                          className="text-[10px] font-mono text-stem-orange border border-stem-orange/30 px-3 py-1.5 rounded hover:bg-stem-orange/20 transition-colors tracking-widest"
                        >
                          消课
                        </button>
                        <button 
                          onClick={() => setSelectedStudent(student)}
                          className="text-[10px] font-mono text-gray-300 border border-white/20 px-3 py-1.5 rounded hover:bg-white/10 hover:text-white transition-colors tracking-widest"
                        >
                          档案
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-mono text-sm tracking-widest">
                    NO DATA FOUND
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 抽屉：查看档案 (Drawer) */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* 遮罩 */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setSelectedStudent(null)}
          ></div>
          
          {/* 抽屉主体 */}
          <div className="relative w-full max-w-md h-full bg-slate-950 border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* 抽屉头部 */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-stem-orange/20 border border-stem-orange/50 flex items-center justify-center">
                  <span className="text-xl font-bold text-stem-orange">{selectedStudent.name.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-widest">{selectedStudent.name}</h2>
                  <p className="text-[10px] font-mono text-gray-400 tracking-widest">{selectedStudent.grade}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 抽屉内容区（可滚动） */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* 基础资料面板 */}
              <div>
                <h3 className="text-xs font-mono text-stem-orange tracking-widest uppercase mb-4 flex items-center">
                  <User className="w-4 h-4 mr-2" /> Basic Info
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                    <p className="text-[10px] text-gray-500 font-mono mb-1">报名日期</p>
                    <p className="text-sm text-gray-200 font-mono">{selectedStudent.enrollment_date || '-'}</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                    <p className="text-[10px] text-gray-500 font-mono mb-1">联系电话</p>
                    <p className="text-sm text-gray-200 font-mono">{selectedStudent.phone || '-'}</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                    <p className="text-[10px] text-gray-500 font-mono mb-1">课时单价</p>
                    <p className="text-sm text-stem-orange font-mono font-bold">¥ {selectedStudent.price_per_lesson}</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                    <p className="text-[10px] text-gray-500 font-mono mb-1">预计总额</p>
                    <p className="text-sm text-gray-200 font-mono">¥ {selectedStudent.total_amount}</p>
                  </div>
                </div>
              </div>

              {/* 历史课程与评语轨迹 */}
              <div>
                <h3 className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-4 flex items-center">
                  <Activity className="w-4 h-4 mr-2" /> Class Records
                </h3>
                
                <div className="space-y-4 relative">
                  {/* 时间轴发光线 */}
                  <div className="absolute left-3.5 top-2 bottom-0 w-px bg-white/10"></div>
                  
                  {selectedStudent.class_records && selectedStudent.class_records.length > 0 ? (
                    selectedStudent.class_records.map((record, idx) => (
                      <div key={record.id} className="relative pl-10">
                        {/* 节点 */}
                        <div className="absolute left-[11px] top-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                        
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-bold text-white">{record.topic}</h4>
                            <span className="text-[10px] font-mono text-gray-500">{record.date}</span>
                          </div>
                          
                          {/* 评语 */}
                          <div className="bg-black/30 rounded p-3 mb-3 border border-white/5">
                            <p className="text-xs text-gray-300 font-light italic flex items-start">
                              <Quote className="w-3 h-3 text-cyan-500/50 mr-2 shrink-0 mt-0.5" />
                              {record.comment || '无评语'}
                            </p>
                          </div>

                          {/* 作业状态与缩略图 */}
                          <div className="flex items-center justify-between border-t border-white/5 pt-3">
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${record.status === 'pending' ? 'text-stem-orange border-stem-orange/30 bg-stem-orange/10' : 'text-stem-green border-stem-green/30 bg-stem-green/10'}`}>
                              {record.status === 'pending' ? '作业待交' : '已交作业'}
                            </span>
                            
                            {/* 作业状态与缩略图展示 */}
                            {record.status !== 'pending' && (
                              <div className="flex -space-x-2 mt-2">
                                {record.homework_images && record.homework_images.length > 0 ? (
                                  record.homework_images.map((img: string, i: number) => (
                                    <div 
                                      key={i} 
                                      onClick={() => setLightboxImage(img)}
                                      className="w-8 h-8 rounded bg-gray-800 border-2 border-slate-900 overflow-hidden cursor-pointer hover:scale-110 transition-transform z-10 hover:z-20 shadow-md"
                                    >
                                      <img src={img} alt={`作业 ${i+1}`} className="w-full h-full object-cover" />
                                    </div>
                                  ))
                                ) : (
                                  <div className="w-6 h-6 rounded bg-gray-800 border border-gray-600 flex items-center justify-center overflow-hidden opacity-50">
                                    <ImageIcon className="w-3 h-3 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pl-10 text-xs text-gray-500 font-mono tracking-widest">
                      暂无上课记录
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 新增学员弹窗 */}
      {isAddModalOpen && !createdStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-slate-950 border border-white/20 w-full max-w-sm rounded-2xl p-6 shadow-[0_0_50px_rgba(255,107,0,0.2)] animate-in zoom-in duration-300">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center tracking-widest">
              <User className="w-5 h-5 mr-2 text-stem-orange" />
              录入新学员
            </h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">姓名</label>
                <input 
                  type="text" 
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-stem-orange focus:outline-none"
                  placeholder="例如: 张三"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">手机号 (登录账号)</label>
                <input 
                  type="tel" 
                  required
                  maxLength={11}
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-stem-orange focus:outline-none"
                  placeholder="11位手机号"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">年级</label>
                <input 
                  type="text" 
                  required
                  value={newStudent.grade}
                  onChange={(e) => setNewStudent({...newStudent, grade: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-stem-orange focus:outline-none"
                  placeholder="例如: 三年级"
                />
              </div>
              <div className="pt-2">
                <p className="text-[10px] text-gray-500 font-mono mb-4 leading-relaxed bg-white/5 p-2 rounded border border-white/5">
                  <strong className="text-stem-orange">注意：</strong>
                  保存后，系统将自动为该家长创建专属账号。<br/>
                  初始密码为手机号后 6 位：{newStudent.phone.length >= 6 ? newStudent.phone.slice(-6) : '******'}
                </p>
                <button 
                  type="submit" 
                  disabled={isAdding}
                  className="w-full bg-stem-orange hover:bg-orange-600 text-white font-bold py-3 rounded-lg tracking-widest disabled:opacity-50 transition-colors"
                >
                  {isAdding ? '创建中...' : '一键开户并保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 创建成功后的链接展示弹窗 */}
      {createdStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md"></div>
          <div className="relative bg-slate-950 border border-stem-green/30 w-full max-w-sm rounded-2xl p-6 shadow-[0_0_50px_rgba(34,197,94,0.2)] animate-in zoom-in duration-300">
            <h2 className="text-xl font-bold text-stem-green mb-4 flex items-center tracking-widest">
              <CheckCircle2 className="w-6 h-6 mr-2" />
              开户成功
            </h2>
            
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-xs text-gray-400 font-mono mb-1">学员姓名</p>
                <p className="text-lg text-white font-bold tracking-widest mb-3">{createdStudent.name}</p>
                
                <p className="text-xs text-gray-400 font-mono mb-1">家长登录账号</p>
                <p className="text-sm text-cyan-400 font-mono mb-3">{createdStudent.phone}</p>
                
                <p className="text-xs text-gray-400 font-mono mb-1">初始密码</p>
                <p className="text-sm text-white font-mono">{createdStudent.phone.slice(-6)}</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-500 font-mono mb-2 uppercase tracking-widest">专属免登录链接</p>
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={`https://xiongxiong.top/#/parent?id=${createdStudent.id}`}
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-gray-400 font-mono focus:outline-none"
                  />
                  <button 
                    onClick={() => handleCopyLink(createdStudent.id)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded-lg text-xs font-mono transition-colors tracking-widest"
                  >
                    复制链接
                  </button>
                </div>
              </div>

              <button 
                onClick={() => {
                  setCreatedStudent(null);
                  setIsAddModalOpen(false);
                }}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg tracking-widest transition-colors mt-2 border border-white/10"
              >
                完成并关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox 大图查看器 */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer animate-in fade-in duration-300"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            className="absolute top-6 right-6 p-2 text-white/50 hover:text-white bg-white/10 rounded-full transition-colors"
            onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={lightboxImage} 
            alt="大图查看" 
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} // 防止点击图片时关闭
          />
        </div>
      )}

    </div>
  );
};

export default Profile;