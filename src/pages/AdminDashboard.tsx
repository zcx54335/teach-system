import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, Clock, Activity, LogOut, Hexagon, 
  Settings, BookOpen, Edit, MinusCircle, ExternalLink, X, CheckCircle, Trash2, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StudentRecord {
  id: string;
  name: string;
  phone: string;
  parent_phone: string;
  school: string;
  grade: string;
  subjects: string[];
  course_balances: Record<string, number>;
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
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [selectedTopupStudent, setSelectedTopupStudent] = useState<StudentRecord | null>(null);
  const [topupSubject, setTopupSubject] = useState('');
  const [topupAmount, setTopupAmount] = useState(0);

  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [newStudent, setNewStudent] = useState({
    name: '',
    phone: '',
    parent_phone: '',
    school: '',
    grade: '一年级',
    subjects: [] as string[]
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isEditStudentMode, setIsEditStudentMode] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const [deleteStudentModalOpen, setDeleteStudentModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentRecord | null>(null);

  const [systemSubjects, setSystemSubjects] = useState<string[]>([]);
  const GRADE_OPTIONS = ['学前', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三'];

  const fetchStudents = async () => {
    setIsLoading(true);
    const [stuRes, settingsRes] = await Promise.all([
      supabase.from('students').select('*').order('created_at', { ascending: false }),
      supabase.from('system_settings').select('subjects_list').eq('id', 1).single()
    ]);
      
    if (stuRes.data) {
      setStudents(stuRes.data);
    }
    if (settingsRes.data?.subjects_list) {
      setSystemSubjects(settingsRes.data.subjects_list);
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

  const handleAddStudentClick = () => {
    setIsEditStudentMode(false);
    setEditingStudentId(null);
    setNewStudent({ name: '', phone: '', parent_phone: '', school: '', grade: '一年级', subjects: [] });
    setIsAddModalOpen(true);
  };

  const handleEditStudentClick = (student: StudentRecord) => {
    setIsEditStudentMode(true);
    setEditingStudentId(student.id);
    setNewStudent({
      name: student.name || '',
      phone: student.phone || '',
      parent_phone: student.parent_phone || student.phone || '',
      school: student.school || '',
      grade: student.grade || '一年级',
      subjects: student.subjects || []
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteStudentClick = (student: StudentRecord) => {
    setStudentToDelete(student);
    setDeleteStudentModalOpen(true);
  };

  const handleConfirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      const { error } = await supabase.from('students').delete().eq('id', studentToDelete.id);
      if (error) throw error;
      toast.success('✅ 学员已删除');
      setDeleteStudentModalOpen(false);
      setStudentToDelete(null);
      fetchStudents();
    } catch (err: any) {
      toast.error('删除失败: ' + err.message);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudent.parent_phone.length !== 11) {
      toast.error('请输入11位有效家长手机号');
      return;
    }
    if (newStudent.subjects.length === 0) {
      toast.error('请至少选择一个报读科目');
      return;
    }
    
    setIsAdding(true);
    try {
      if (isEditStudentMode && editingStudentId) {
        // Edit mode
        const { error } = await supabase.from('students').update({
          name: newStudent.name,
          phone: newStudent.phone || newStudent.parent_phone,
          parent_phone: newStudent.parent_phone,
          school: newStudent.school,
          grade: newStudent.grade,
          subjects: newStudent.subjects
        }).eq('id', editingStudentId);

        if (error) {
          if (error.code === '23505') throw new Error('手机号已被占用，请检查');
          throw error;
        }
        toast.success('✅ 学员信息修改成功！');
      } else {
        // Add mode
        const password = newStudent.parent_phone.slice(-6);

        let profileId;
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', newStudent.parent_phone)
          .single();

        if (existingProfile) {
          profileId = existingProfile.id;
        } else {
          const { data: insertedProfile, error: profileError } = await supabase
            .from('profiles')
            .insert([{
              phone: newStudent.parent_phone,
              password: password,
              role: 'parent',
              full_name: newStudent.name + '的家长'
            }])
            .select('id')
            .single();

          if (profileError) throw new Error(`创建家长账号失败: ${profileError.message}`);
          profileId = insertedProfile.id;
        }

        const initialBalances: Record<string, number> = {};
        newStudent.subjects.forEach(sub => {
          initialBalances[sub] = 0;
        });

        const { error: dbError } = await supabase.from('students').insert([{
          name: newStudent.name,
          phone: newStudent.phone || newStudent.parent_phone,
          parent_phone: newStudent.parent_phone,
          school: newStudent.school,
          grade: newStudent.grade,
          subjects: newStudent.subjects,
          course_balances: initialBalances,
          status: 'enrolled',
          auth_id: profileId,
          password_hash: password,
          remaining_classes: 0 
        }]);

        if (dbError) throw new Error(`DB Error: ${dbError.message}`);

        toast.success('✅ 新增学员成功！');
      }

      setNewStudent({ name: '', phone: '', parent_phone: '', school: '', grade: '一年级', subjects: [] });
      setIsAddModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(`${isEditStudentMode ? '修改' : '创建'}学员失败: ${err.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopupStudent || !topupSubject || topupAmount <= 0) return;

    try {
      const currentBalances = selectedTopupStudent.course_balances || {};
      const currentAmount = currentBalances[topupSubject] || 0;
      
      const newBalances = {
        ...currentBalances,
        [topupSubject]: currentAmount + topupAmount
      };

      const { error } = await supabase
        .from('students')
        .update({ 
          course_balances: newBalances,
          // 为了兼容老页面，如果是首个科目，同时加到 remaining_classes
          ...(Object.keys(currentBalances).length === 0 || topupSubject === selectedTopupStudent.subjects[0] ? {
            remaining_classes: (selectedTopupStudent.remaining_classes || 0) + topupAmount
          } : {})
        })
        .eq('id', selectedTopupStudent.id);

      if (error) throw error;

      toast.success(`✅ 充值成功！已为 ${selectedTopupStudent.name} 的 ${topupSubject} 增加 ${topupAmount} 课时。`);
      setIsTopupModalOpen(false);
      setTopupAmount(0);
      setTopupSubject('');
      fetchStudents();
    } catch (err: any) {
      toast.error('充值失败：' + err.message);
    }
  };
  const handleDeductClass = async (studentId: string, currentRemaining: number, studentName: string) => {
    if (currentRemaining <= 0) {
      toast.error('剩余课时不足，无法消课！');
      return;
    }
    
    // Removed window.confirm to comply with no-blocking-dialog rule

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

      toast.success(`已扣除 1 课时，${studentName} 剩余 ${newRemaining} 课时。`);
      fetchStudents();
    } catch (err: any) {
      toast.error('消课失败：' + err.message);
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
      toast.success('分数更新成功！');
      setIsEditModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      toast.error('更新失败：' + err.message);
    }
  };

  const totalStudents = students.length;
  const totalRemainingClasses = students.reduce((acc, curr) => acc + (curr.remaining_classes || 0), 0);

  return (
    <div className="w-full p-4 md:p-10 h-full flex flex-col">
      <header className="mb-6 md:mb-12 flex justify-between items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-widest text-white mb-2 drop-shadow-md">学员资产概览</h2>
          <p className="text-xs md:text-sm text-gray-400 font-mono tracking-widest">REAL-TIME DATA DASHBOARD</p>
        </div>
      </header>

      {/* 顶部三个数据卡片 - 移动端横向滚动，桌面端 Grid */}
      <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12 pb-4 md:pb-0 snap-x">
        <div className="min-w-[240px] md:min-w-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group shadow-[0_0_20px_rgba(0,0,0,0.3)] snap-center shrink-0">
          <div className="absolute -right-6 -top-6 w-24 h-24 md:w-32 md:h-32 bg-cyan-500/20 rounded-full blur-2xl group-hover:bg-cyan-500/30 transition-all"></div>
          <div className="flex items-center space-x-3 md:space-x-4 mb-4 md:mb-6">
            <div className="p-2 md:p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
            </div>
            <h3 className="text-xs md:text-sm font-bold text-gray-300 tracking-widest uppercase">总学员数</h3>
          </div>
          <div className="text-4xl md:text-5xl font-bold font-inter text-white tracking-tighter drop-shadow-sm">{totalStudents} <span className="text-sm md:text-base text-gray-500 ml-1 md:ml-2 font-mono font-normal">人</span></div>
        </div>

        <div className="min-w-[240px] md:min-w-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group shadow-[0_0_20px_rgba(0,0,0,0.3)] snap-center shrink-0">
          <div className="absolute -right-6 -top-6 w-24 h-24 md:w-32 md:h-32 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all"></div>
          <div className="flex items-center space-x-3 md:space-x-4 mb-4 md:mb-6">
            <div className="p-2 md:p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
            </div>
            <h3 className="text-xs md:text-sm font-bold text-gray-300 tracking-widest uppercase">待消课时</h3>
          </div>
          <div className="text-4xl md:text-5xl font-bold font-inter text-white tracking-tighter drop-shadow-sm">{totalRemainingClasses} <span className="text-sm md:text-base text-gray-500 ml-1 md:ml-2 font-mono font-normal">课时</span></div>
        </div>

        <div className="min-w-[240px] md:min-w-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group shadow-[0_0_20px_rgba(0,0,0,0.3)] snap-center shrink-0">
          <div className="absolute -right-6 -top-6 w-24 h-24 md:w-32 md:h-32 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all"></div>
          <div className="flex items-center space-x-3 md:space-x-4 mb-4 md:mb-6">
            <div className="p-2 md:p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
            </div>
            <h3 className="text-xs md:text-sm font-bold text-gray-300 tracking-widest uppercase">系统运行</h3>
          </div>
          <div className="text-4xl md:text-5xl font-bold font-inter text-white tracking-tighter drop-shadow-sm">{uptime} <span className="text-sm md:text-base text-gray-500 ml-1 md:ml-2 font-mono font-normal">天</span></div>
        </div>
      </div>

      {/* 核心列表：学员管理 */}
      <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex-1 flex flex-col">
        <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between bg-black/20 gap-4">
          <h3 className="text-lg md:text-xl font-bold tracking-widest text-white flex items-center">
            <Users className="w-5 h-5 mr-3 text-cyan-500" />
            学员列表
          </h3>
          <button 
            onClick={handleAddStudentClick}
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-sm font-bold tracking-widest shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all active:scale-95"
          >
            + 新增学员
          </button>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto flex-1">
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
                          onClick={() => handleEditStudentClick(student)}
                          className="flex items-center px-4 py-2 bg-transparent text-gray-400 hover:text-white border border-transparent hover:border-gray-500 rounded-xl text-xs font-bold tracking-widest transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1.5" /> 编辑
                        </button>
                        <button 
                          onClick={() => handleDeleteStudentClick(student)}
                          className="flex items-center px-4 py-2 bg-transparent text-red-500/70 hover:text-red-400 border border-transparent hover:border-red-500/50 rounded-xl text-xs font-bold tracking-widest transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> 删除
                        </button>
                        <button 
                          onClick={() => { setSelectedTopupStudent(student); setIsTopupModalOpen(true); }}
                          className="flex items-center px-4 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30 rounded-xl text-xs font-bold tracking-widest transition-colors shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                        >
                          <Activity className="w-3.5 h-3.5 mr-1.5" /> 充值
                        </button>
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

        {/* Mobile Card View */}
        <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="py-20 text-center text-cyan-400/50 font-mono tracking-widest">
              <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
              LOADING DATA...
            </div>
          ) : students.length === 0 ? (
            <div className="py-20 text-center text-gray-500 font-mono text-sm tracking-widest">
              NO DATA FOUND
            </div>
          ) : (
            students.map(student => (
              <div key={student.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-white tracking-widest text-base block">{student.name}</span>
                      <span className="text-xs text-gray-400">{student.grade || '未分配年级'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 font-mono block mb-1">剩余课时</span>
                    <span className={`text-2xl font-bold font-inter ${student.remaining_classes <= 3 ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]' : 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]'}`}>
                      {student.remaining_classes}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-6 gap-2 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => handleEditStudentClick(student)}
                    className="flex flex-col items-center justify-center py-2 bg-transparent text-gray-400 hover:text-white rounded-xl text-xs font-bold tracking-widest transition-colors"
                  >
                    <Edit className="w-4 h-4 mb-1" /> 编辑
                  </button>
                  <button 
                    onClick={() => handleDeleteStudentClick(student)}
                    className="flex flex-col items-center justify-center py-2 bg-transparent text-red-500/70 hover:text-red-400 rounded-xl text-xs font-bold tracking-widest transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mb-1" /> 删除
                  </button>
                  <button 
                    onClick={() => { setSelectedTopupStudent(student); setIsTopupModalOpen(true); }}
                    className="flex flex-col items-center justify-center py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-xl text-xs font-bold tracking-widest transition-colors"
                  >
                    <Activity className="w-4 h-4 mb-1" /> 充值
                  </button>
                  <button 
                    onClick={() => handleDeductClass(student.id, student.remaining_classes, student.name)}
                    className="flex flex-col items-center justify-center py-2 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-xl text-xs font-bold tracking-widest transition-colors"
                  >
                    <MinusCircle className="w-4 h-4 mb-1" /> 消课
                  </button>
                  <button 
                    onClick={() => { setEditingStudent(student); setIsEditModalOpen(true); }}
                    className="flex flex-col items-center justify-center py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl text-xs font-bold tracking-widest transition-colors"
                  >
                    <Edit className="w-4 h-4 mb-1" /> 评分
                  </button>
                  <button 
                    onClick={() => window.open(`/#/parent?id=${student.id}`, '_blank')}
                    className="flex flex-col items-center justify-center py-2 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl text-xs font-bold tracking-widest transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mb-1" /> 报告
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 新增学员弹窗 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isAdding && setIsAddModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button onClick={() => !isAdding && setIsAddModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white tracking-widest mb-6 border-b border-white/5 pb-4">
              {isEditStudentMode ? '编辑学员信息' : '录入新学员'}
            </h3>
            
            <form onSubmit={handleAddStudent} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-[0.2em]">学员姓名 *</label>
                  <input 
                    type="text" required value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-cyan-500/50 focus:bg-black/80 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-[0.2em]">家长手机号 * (用于登录)</label>
                  <input 
                    type="tel" required value={newStudent.parent_phone} onChange={(e) => setNewStudent({...newStudent, parent_phone: e.target.value})}
                    placeholder="11位手机号"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono font-bold focus:outline-none focus:border-cyan-500/50 focus:bg-black/80 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-[0.2em]">就读学校</label>
                  <input 
                    type="text" value={newStudent.school} onChange={(e) => setNewStudent({...newStudent, school: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:bg-black/80 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-[0.2em]">年级 *</label>
                  <select 
                    value={newStudent.grade} onChange={(e) => setNewStudent({...newStudent, grade: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:bg-black/80 transition-all shadow-inner appearance-none"
                  >
                    {GRADE_OPTIONS.map(g => <option key={g} value={g} className="bg-slate-900">{g}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-mono font-bold text-gray-400 mb-3 uppercase tracking-[0.2em]">报读科目 * (多选)</label>
                <div className="grid grid-cols-2 gap-3">
                  {systemSubjects.map(sub => (
                    <label key={sub} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${newStudent.subjects.includes(sub) ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-black/50 border-white/10 hover:border-white/30'}`}>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={newStudent.subjects.includes(sub)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewStudent({...newStudent, subjects: [...newStudent.subjects, sub]});
                          } else {
                            setNewStudent({...newStudent, subjects: newStudent.subjects.filter(s => s !== sub)});
                          }
                        }}
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 ${newStudent.subjects.includes(sub) ? 'bg-cyan-500 border-cyan-500' : 'border-gray-500'}`}>
                        {newStudent.subjects.includes(sub) && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm font-bold ${newStudent.subjects.includes(sub) ? 'text-cyan-400' : 'text-gray-300'}`}>{sub}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" disabled={isAdding} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl tracking-widest transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-95 disabled:opacity-50 flex justify-center items-center">
                  {isAdding ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isEditStudentMode ? '确认保存修改' : '确认创建并分配初始密码')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 课时充值弹窗 */}
      {isTopupModalOpen && selectedTopupStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsTopupModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsTopupModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white tracking-widest mb-6 border-b border-white/5 pb-4">
              为 {selectedTopupStudent.name} 充值课时
            </h3>
            
            <form onSubmit={handleTopup} className="space-y-5">
              <div>
                <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-[0.2em]">选择充值科目</label>
                <select 
                  required value={topupSubject} onChange={(e) => setTopupSubject(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 focus:bg-black/80 transition-all shadow-inner appearance-none"
                >
                  <option value="" disabled>请选择科目</option>
                  {(selectedTopupStudent.subjects || []).map(sub => (
                    <option key={sub} value={sub} className="bg-slate-900">{sub} (当前余额: {(selectedTopupStudent.course_balances || {})[sub] || 0})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-mono font-bold text-gray-400 mb-2 uppercase tracking-[0.2em]">充值数量 (课时)</label>
                <input 
                  type="number" required min="1" step="1"
                  value={topupAmount || ''} onChange={(e) => setTopupAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-green-500/50 focus:bg-black/80 transition-all shadow-inner text-2xl"
                />
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl tracking-widest transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] active:scale-95">
                  确认充值
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
      {/* Delete Student Modal */}
      {deleteStudentModalOpen && studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteStudentModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-red-500/30 w-full max-w-sm rounded-3xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">确认删除学员？</h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              您正在删除学员 <span className="text-white font-bold">{studentToDelete.name}</span>。<br/>
              此操作不可逆，学员的所有课时和记录将被永久删除。
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteStudentModalOpen(false)}
                className="flex-1 py-3 rounded-xl font-bold bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleConfirmDeleteStudent}
                className="flex-1 py-3 rounded-xl font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
