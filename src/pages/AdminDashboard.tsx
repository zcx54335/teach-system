import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, Clock, Activity, LogOut, Hexagon, 
  Settings, BookOpen, Edit, MinusCircle, ExternalLink, X
} from 'lucide-react';

interface StudentRecord {
  id: string;
  name: string;
  phone: string;
  grade: string;
  remaining_classes: number;
  total_classes: number;
  calc_score: number;
  logic_score: number;
  spatial_score: number;
  app_score: number;
  data_score: number;
  physics_score: number;
  chemistry_score: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uptime, setUptime] = useState(0);
  
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchStudents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setStudents(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStudents();
    
    // Calculate system uptime (assume launch date is Jan 1, 2024)
    const launchDate = new Date('2024-01-01').getTime();
    const now = new Date().getTime();
    const days = Math.floor((now - launchDate) / (1000 * 60 * 60 * 24));
    setUptime(days);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('xiaoyu_user');
    navigate('/');
  };

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
      fetchStudents();
    } catch (err: any) {
      alert('消课失败：' + err.message);
    }
  };

  const handleSaveScores = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    try {
      const { error } = await supabase
        .from('students')
        .update({
          calc_score: editingStudent.calc_score,
          logic_score: editingStudent.logic_score,
          spatial_score: editingStudent.spatial_score,
          app_score: editingStudent.app_score,
          data_score: editingStudent.data_score,
          physics_score: editingStudent.physics_score,
          chemistry_score: editingStudent.chemistry_score,
        })
        .eq('id', editingStudent.id);

      if (error) throw error;
      alert('分数更新成功！');
      setIsEditModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      alert('更新失败：' + err.message);
    }
  };

  const totalStudents = students.length;
  const totalRemainingClasses = students.reduce((acc, curr) => acc + (curr.remaining_classes || 0), 0);

  return (
    <div className="w-full p-10 h-full flex flex-col">
      <header className="mb-12">
        <h2 className="text-3xl font-bold tracking-widest text-white mb-2 drop-shadow-md">学员资产概览</h2>
        <p className="text-sm text-gray-400 font-mono tracking-widest">REAL-TIME DATA DASHBOARD</p>
      </header>

      {/* 顶部三个数据卡片 - CSS Grid 强制横向三列 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl group-hover:bg-cyan-500/30 transition-all"></div>
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-300 tracking-widest uppercase">总学员数</h3>
          </div>
          <div className="text-5xl font-bold font-inter text-white tracking-tighter drop-shadow-sm">{totalStudents} <span className="text-base text-gray-500 ml-2 font-mono font-normal">人</span></div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all"></div>
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-300 tracking-widest uppercase">待消课时</h3>
          </div>
          <div className="text-5xl font-bold font-inter text-white tracking-tighter drop-shadow-sm">{totalRemainingClasses} <span className="text-base text-gray-500 ml-2 font-mono font-normal">课时</span></div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all"></div>
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-300 tracking-widest uppercase">系统运行</h3>
          </div>
          <div className="text-5xl font-bold font-inter text-white tracking-tighter drop-shadow-sm">{uptime} <span className="text-base text-gray-500 ml-2 font-mono font-normal">天</span></div>
        </div>
      </div>

      {/* 核心列表：学员管理表格 */}
      <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex-1 flex flex-col">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
          <h3 className="text-xl font-bold tracking-widest text-white flex items-center">
            <Users className="w-5 h-5 mr-3 text-cyan-500" />
            学员列表
          </h3>
          <button className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-sm font-bold tracking-widest shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all active:scale-95">
            + 新增学员
          </button>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40">
                <th className="px-8 py-5 text-xs font-mono font-bold text-gray-400 tracking-[0.2em] uppercase">学员姓名</th>
                <th className="px-8 py-5 text-xs font-mono font-bold text-gray-400 tracking-[0.2em] uppercase">手机号</th>
                <th className="px-8 py-5 text-xs font-mono font-bold text-gray-400 tracking-[0.2em] uppercase">年级</th>
                <th className="px-8 py-5 text-xs font-mono font-bold text-gray-400 tracking-[0.2em] uppercase">剩余课时</th>
                <th className="px-8 py-5 text-xs font-mono font-bold text-gray-400 tracking-[0.2em] uppercase text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-cyan-400/50 font-mono tracking-widest">
                    <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
                    LOADING DATA...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-gray-500 font-mono text-sm tracking-widest">
                    NO DATA FOUND
                  </td>
                </tr>
              ) : (
                students.map(student => (
                  <tr key={student.id} className="hover:bg-white/5 transition-colors duration-200">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-bold text-white tracking-widest text-base">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-gray-300 font-mono tracking-wider">{student.phone}</td>
                    <td className="px-8 py-5 text-sm text-gray-400 tracking-wider">{student.grade || '未分配'}</td>
                    <td className="px-8 py-5">
                      <span className={`text-xl font-bold font-inter ${student.remaining_classes <= 3 ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]' : 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]'}`}>
                        {student.remaining_classes}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <button 
                          onClick={() => handleDeductClass(student.id, student.remaining_classes, student.name)}
                          className="flex items-center px-4 py-2 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl text-xs font-bold tracking-widest transition-colors shadow-[0_0_10px_rgba(249,115,22,0.1)]"
                        >
                          <MinusCircle className="w-3.5 h-3.5 mr-1.5" /> 消课
                        </button>
                        <button 
                          onClick={() => { setEditingStudent(student); setIsEditModalOpen(true); }}
                          className="flex items-center px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-xs font-bold tracking-widest transition-colors shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1.5" /> 评分
                        </button>
                        <button 
                          onClick={() => window.open(`/#/parent?id=${student.id}`, '_blank')}
                          className="flex items-center px-4 py-2 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10 rounded-xl text-xs font-bold tracking-widest transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> 报告
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 编辑分数弹窗 */}
      {isEditModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white tracking-widest mb-6 border-b border-white/5 pb-4">
              编辑能力雷达图 - {editingStudent.name}
            </h3>
            
            <form onSubmit={handleSaveScores} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                {['calc_score', 'logic_score', 'spatial_score', 'app_score', 'data_score', 'physics_score', 'chemistry_score'].map((field) => (
                  <div key={field}>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-[0.2em]">
                      {field.replace('_score', '')} (0-5)
                    </label>
                    <input 
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={(editingStudent as any)[field] || 0}
                      onChange={(e) => setEditingStudent({...editingStudent, [field]: parseFloat(e.target.value)})}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono font-bold focus:outline-none focus:border-cyan-500/50 focus:bg-black/80 transition-all shadow-inner"
                    />
                  </div>
                ))}
              </div>
              <div className="pt-6">
                <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl tracking-widest transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] active:scale-95">
                  保存更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
