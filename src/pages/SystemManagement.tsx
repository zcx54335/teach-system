import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, Database, Settings, Plus, UserPlus, CreditCard, Search, ArrowRight,
  UserCheck, Banknote, ShieldCheck, Edit, Trash2, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

type Tab = 'teachers' | 'finance' | 'settings';

const SUBJECT_OPTIONS = ['数学', '物理', '化学', '英语', '语文'];

const SystemManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('teachers');
  const [isLoading, setIsLoading] = useState(true);

  // Global Data
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // ----------------------------------------
  // Teachers Management State
  // ----------------------------------------
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isEditTeacherMode, setIsEditTeacherMode] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('');
  
  const [isAssignStudentOpen, setIsAssignStudentOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [assignSearch, setAssignSearch] = useState('');

  const [isDeleteTeacherOpen, setIsDeleteTeacherOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<any | null>(null);

  // ----------------------------------------
  // Financial Management State
  // ----------------------------------------
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [orderStudentId, setOrderStudentId] = useState('');
  const [orderSubject, setOrderSubject] = useState('');
  const [orderClasses, setOrderClasses] = useState('');
  const [orderTotalPrice, setOrderTotalPrice] = useState('');

  const orderUnitPrice = useMemo(() => {
    const total = parseFloat(orderTotalPrice);
    const classes = parseInt(orderClasses, 10);
    if (!isNaN(total) && !isNaN(classes) && classes > 0) {
      return (total / classes).toFixed(2);
    }
    return '0.00';
  }, [orderTotalPrice, orderClasses]);

  // Auth & Fetch
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      setIsLoading(true);
      const sessionStr = localStorage.getItem('xiaoyu_user');
      let currentUser = null;
      if (sessionStr) {
        try { currentUser = JSON.parse(sessionStr); } catch (e) {}
      }

      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'sysadmin')) {
        toast.error('权限不足：仅限管理员访问系统设置');
        navigate('/dashboard');
        return;
      }

      await fetchData();
      setIsLoading(false);
    };

    checkAuthAndFetch();
  }, [navigate]);

  const fetchData = async () => {
    const [stuRes, teacherRes, orderRes] = await Promise.all([
      supabase.from('students').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'teacher').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false })
    ]);

    if (stuRes.data) setStudents(stuRes.data);
    if (teacherRes.data) setTeachers(teacherRes.data);
    if (orderRes.data) setOrders(orderRes.data);
  };

  // --- Teacher Actions ---
  const handleAddTeacherClick = () => {
    setIsEditTeacherMode(false);
    setEditingTeacherId(null);
    setNewTeacherName('');
    setNewTeacherPhone('');
    setNewTeacherSubject('');
    setIsAddTeacherOpen(true);
  };

  const handleEditTeacherClick = (teacher: any) => {
    setIsEditTeacherMode(true);
    setEditingTeacherId(teacher.id);
    setNewTeacherName(teacher.full_name || '');
    setNewTeacherPhone(teacher.phone || '');
    setNewTeacherSubject(teacher.subject || '');
    setIsAddTeacherOpen(true);
  };

  const handleDeleteTeacherClick = (teacher: any) => {
    setTeacherToDelete(teacher);
    setIsDeleteTeacherOpen(true);
  };

  const handleConfirmDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    try {
      // 1. Unbind students
      const { error: stuError } = await supabase.from('students')
        .update({ teacher_id: null })
        .eq('teacher_id', teacherToDelete.id);
      if (stuError) throw stuError;

      // 2. Delete teacher
      const { error } = await supabase.from('profiles')
        .delete()
        .eq('id', teacherToDelete.id);
      if (error) throw error;

      toast.success('✅ 教师已删除，关联学员已释放');
      setIsDeleteTeacherOpen(false);
      setTeacherToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error('删除失败: ' + err.message);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName || !newTeacherPhone || !newTeacherSubject) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      if (isEditTeacherMode && editingTeacherId) {
        const { error } = await supabase.from('profiles').update({
          phone: newTeacherPhone,
          full_name: newTeacherName,
          subject: newTeacherSubject
        }).eq('id', editingTeacherId);

        if (error) {
          if (error.code === '23505') throw new Error('手机号已被占用');
          throw error;
        }
        toast.success('教师信息修改成功！');
      } else {
        const { error } = await supabase.from('profiles').insert({
          phone: newTeacherPhone,
          password: newTeacherPhone.slice(-6),
          role: 'teacher',
          full_name: newTeacherName,
          subject: newTeacherSubject
        });

        if (error) {
          if (error.code === '23505') throw new Error('手机号已被占用');
          throw error;
        }
        toast.success('教师账号创建成功！');
      }
      
      setIsAddTeacherOpen(false);
      setNewTeacherName('');
      setNewTeacherPhone('');
      setNewTeacherSubject('');
      fetchData();
    } catch (err: any) {
      toast.error(`${isEditTeacherMode ? '修改' : '创建'}教师失败：` + err.message);
    }
  };

  const handleAssignStudent = async (studentId: string) => {
    if (!selectedTeacherId) return;
    try {
      const { error } = await supabase.from('students')
        .update({ teacher_id: selectedTeacherId })
        .eq('id', studentId);
      
      if (error) throw error;
      fetchData(); // Refresh list to reflect changes
      toast.success('分配成功');
    } catch (err: any) {
      toast.error('分配失败：' + err.message);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      const { error } = await supabase.from('students')
        .update({ teacher_id: null })
        .eq('id', studentId);
      
      if (error) throw error;
      fetchData();
      toast.success('移除成功');
    } catch (err: any) {
      toast.error('移除失败：' + err.message);
    }
  };

  // --- Financial Actions ---
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderStudentId || !orderSubject || !orderClasses || !orderTotalPrice) {
      toast.error('请填写完整信息');
      return;
    }

    const student = students.find(s => s.id === orderStudentId);
    if (!student) return;

    try {
      const classesToAdd = parseInt(orderClasses, 10);
      
      // 1. Create Order
      const { error: orderError } = await supabase.from('orders').insert({
        student_id: orderStudentId,
        subject: orderSubject,
        total_classes: classesToAdd,
        total_price: parseFloat(orderTotalPrice),
        unit_price: parseFloat(orderUnitPrice),
        status: 'active'
      });

      if (orderError) throw orderError;

      // 2. Update Student Balance
      const currentBalances = student.course_balances || {};
      const currentRemaining = currentBalances[orderSubject] || 0;
      const newBalances = { ...currentBalances, [orderSubject]: currentRemaining + classesToAdd };

      // Ensure subject is in the array
      const currentSubjects = Array.isArray(student.subjects) ? student.subjects : [];
      const newSubjects = currentSubjects.includes(orderSubject) 
        ? currentSubjects 
        : [...currentSubjects, orderSubject];

      const { error: stuError } = await supabase.from('students')
        .update({ 
          course_balances: newBalances,
          subjects: newSubjects
        })
        .eq('id', orderStudentId);

      if (stuError) throw stuError;

      toast.success('订单创建成功，课时已入账！');
      setIsNewOrderOpen(false);
      setOrderStudentId('');
      setOrderSubject('');
      setOrderClasses('');
      setOrderTotalPrice('');
      fetchData();
    } catch (err: any) {
      toast.error('订单创建失败：' + err.message);
    }
  };

  // --- Derived Data for Finance ---
  const financialStats = useMemo(() => {
    let totalRemainingClasses = 0;
    let estimatedLiability = 0; // Extremely simplified liability estimation

    // Group active orders by student and subject to find the "latest" unit price
    // Real liability calculation should ideally map exact remaining classes to specific order unit prices (FIFO).
    // For this SaaS iteration, we use an average or latest unit price.
    const latestPriceMap: Record<string, number> = {}; 
    orders.forEach(o => {
      const key = `${o.student_id}_${o.subject}`;
      if (!latestPriceMap[key]) {
        latestPriceMap[key] = o.unit_price;
      }
    });

    students.forEach(stu => {
      const balances = stu.course_balances || {};
      Object.entries(balances).forEach(([sub, count]: [string, any]) => {
        if (count > 0) {
          totalRemainingClasses += count;
          const unitPrice = latestPriceMap[`${stu.id}_${sub}`] || 0;
          estimatedLiability += (count * unitPrice);
        }
      });
    });

    return { totalRemainingClasses, estimatedLiability };
  }, [students, orders]);


  if (isLoading) {
    return <div className="p-8 text-cyan-400 font-mono animate-pulse">SYSTEM INITIALIZING...</div>;
  }

  return (
    <div className="w-full h-full flex flex-col relative max-w-7xl mx-auto p-4 md:p-6 overflow-hidden">
      
      {/* Header */}
      <header className="mb-8 shrink-0">
        <h2 className="text-2xl md:text-3xl font-bold tracking-widest text-white flex items-center">
          <Database className="w-6 h-6 md:w-8 md:h-8 mr-3 text-cyan-400" />
          系统管理与控制台
        </h2>
      </header>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-white/10 shrink-0 overflow-x-auto flex-nowrap no-scrollbar">
        <button 
          onClick={() => setActiveTab('teachers')}
          className={`flex items-center px-6 py-3 font-bold tracking-widest transition-all border-b-2 whitespace-nowrap shrink-0 ${
            activeTab === 'teachers' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Users className="w-4 h-4 mr-2" /> 👥 师资管理
        </button>
        <button 
          onClick={() => setActiveTab('finance')}
          className={`flex items-center px-6 py-3 font-bold tracking-widest transition-all border-b-2 whitespace-nowrap shrink-0 ${
            activeTab === 'finance' ? 'border-amber-400 text-amber-400' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <CreditCard className="w-4 h-4 mr-2" /> 💰 财务与订单
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex items-center px-6 py-3 font-bold tracking-widest transition-all border-b-2 whitespace-nowrap shrink-0 ${
            activeTab === 'settings' ? 'border-purple-400 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Settings className="w-4 h-4 mr-2" /> ⚙️ 基础设置
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        
        {/* ==================== TEACHERS TAB ==================== */}
        {activeTab === 'teachers' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-black/20 p-5 rounded-2xl border border-white/5">
      
              <button 
                onClick={handleAddTeacherClick}
                className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-5 h-5 mr-2" /> 新增教师
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {teachers.map(teacher => {
                const assignedStudents = students.filter(s => s.teacher_id === teacher.id);
                return (
                  <div key={teacher.id} className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 hover:bg-white/[0.04] transition-all relative group">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
                        <span className="text-xl font-bold text-cyan-300">{teacher.full_name?.charAt(0) || 'T'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xl font-bold text-white tracking-widest">{teacher.full_name}</h4>
                          {teacher.subject && (
                            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                              {teacher.subject}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-mono text-gray-400 mt-0.5">{teacher.phone}</p>
                      </div>
                    </div>
                    
                    <div className="bg-black/30 rounded-2xl p-4 mb-5">
                      <div className="text-xs font-mono text-gray-500 uppercase mb-2 flex items-center justify-between">
                        <span>名下学员 ({assignedStudents.length})</span>
                      </div>
                      {assignedStudents.length === 0 ? (
                        <div className="text-sm text-gray-500 italic py-2">暂无分配学员</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {assignedStudents.map(s => (
                            <span key={s.id} className="bg-cyan-900/30 border border-cyan-500/20 text-cyan-300 text-xs px-2.5 py-1 rounded-lg">
                              {s.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => {
                          setSelectedTeacherId(teacher.id);
                          setIsAssignStudentOpen(true);
                        }}
                        className="flex-1 bg-white/5 hover:bg-cyan-500/20 border border-white/5 hover:border-cyan-500/50 text-gray-300 hover:text-cyan-300 font-bold py-3 rounded-xl transition-colors flex items-center justify-center text-sm"
                      >
                        <UserCheck className="w-4 h-4 mr-2" /> 分配
                      </button>
                      <button 
                        onClick={() => handleEditTeacherClick(teacher)}
                        className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-gray-500 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center text-sm"
                      >
                        <Edit className="w-4 h-4 mr-2" /> 编辑
                      </button>
                      <button 
                        onClick={() => handleDeleteTeacherClick(teacher)}
                        className="flex-1 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/50 text-red-500/70 hover:text-red-400 font-bold py-3 rounded-xl transition-colors flex items-center justify-center text-sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> 删除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== FINANCE TAB ==================== */}
        {activeTab === 'finance' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-cyan-500/30 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full"></div>
                <div className="flex items-center text-cyan-400 mb-2">
                  <Database className="w-5 h-5 mr-2" />
                  <span className="text-sm font-bold tracking-widest uppercase">全校待消课时总量</span>
                </div>
                <div className="text-4xl font-black text-white font-mono tracking-wider">
                  {financialStats.totalRemainingClasses} <span className="text-lg text-cyan-400 font-bold ml-1">课时</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full"></div>
                <div className="flex items-center text-amber-400 mb-2">
                  <Banknote className="w-5 h-5 mr-2" />
                  <span className="text-sm font-bold tracking-widest uppercase">预估待消负债金额</span>
                </div>
                <div className="text-4xl font-black text-white font-mono tracking-wider">
                  <span className="text-2xl text-amber-400 mr-1">¥</span>
                  {financialStats.estimatedLiability.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Orders Header */}
            <div className="flex justify-between items-center bg-black/20 p-5 rounded-2xl border border-white/5 mt-8">
              <div>
                <h3 className="text-lg font-bold text-white tracking-widest">财务充值订单流水</h3>
                <p className="text-sm text-gray-400 mt-1">严格记录每一笔课时充值明细及单价</p>
              </div>
              <button 
                onClick={() => setIsNewOrderOpen(true)}
                className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center whitespace-nowrap shrink-0"
              >
                <Plus className="w-5 h-5 mr-2" /> 新建订单
              </button>
            </div>

            {/* Orders List */}
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/40 border-b border-white/10">
                      <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-widest">订单时间</th>
                      <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-widest">学员姓名</th>
                      <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-widest">充值科目</th>
                      <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-widest">增加课时</th>
                      <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-widest text-right">总金额</th>
                      <th className="p-4 text-xs font-mono text-gray-400 uppercase tracking-widest text-right">核算单价</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-500">暂无订单数据</td></tr>
                    ) : (
                      orders.map(order => {
                        const stu = students.find(s => s.id === order.student_id);
                        return (
                          <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 text-sm text-gray-400 font-mono">
                              {new Date(order.created_at).toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'})}
                            </td>
                            <td className="p-4 text-sm font-bold text-white">{stu?.name || '未知学员'}</td>
                            <td className="p-4 text-sm text-cyan-300">
                              <span className="bg-cyan-900/30 px-2 py-1 rounded-md border border-cyan-500/20">{order.subject}</span>
                            </td>
                            <td className="p-4 text-sm font-bold text-white">+{order.total_classes} 课时</td>
                            <td className="p-4 text-sm font-mono font-bold text-amber-400 text-right">¥{order.total_price.toFixed(2)}</td>
                            <td className="p-4 text-xs font-mono text-gray-500 text-right">¥{order.unit_price.toFixed(2)} /课时</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================== SETTINGS TAB ==================== */}
        {activeTab === 'settings' && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 border border-dashed border-white/10 rounded-3xl bg-black/20">
            <ShieldCheck className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-lg font-bold tracking-widest">系统基础设置</p>
            <p className="text-sm mt-2">（系统参数、角色权限配置等模块建设中...）</p>
          </div>
        )}

      </div>

      {/* ==================== MODALS ==================== */}

      {/* Add Teacher Modal */}
      {isAddTeacherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-xl font-bold text-white tracking-widest mb-6">{isEditTeacherMode ? '修改教师信息' : '新增在职教师'}</h3>
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-2">教师姓名</label>
                <input required type="text" value={newTeacherName} onChange={e => setNewTeacherName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500" placeholder="例如：杨老师" />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-2">手机号码 (作为登录账号)</label>
                <input required type="text" value={newTeacherPhone} onChange={e => setNewTeacherPhone(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500" placeholder="输入11位手机号" />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-2">授课科目</label>
                <select required value={newTeacherSubject} onChange={e => setNewTeacherSubject(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500">
                  <option value="" disabled>请选择授课科目</option>
                  {SUBJECT_OPTIONS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
              <div className="text-xs text-gray-500 bg-white/5 p-3 rounded-xl border border-white/5 mt-4">
                初始登录密码将自动设置为手机号后 6 位。
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddTeacherOpen(false)} className="flex-1 bg-white/5 text-gray-400 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors">取消</button>
                <button type="submit" className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-bold tracking-widest transition-colors">{isEditTeacherMode ? '保存修改' : '确认创建'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Student Modal (Transfer list approach) */}
      {isAssignStudentOpen && selectedTeacherId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col h-[80vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white tracking-widest">分配学员</h3>
                <p className="text-sm text-cyan-400 mt-1">正在为 {teachers.find(t => t.id === selectedTeacherId)?.full_name} 分配学员</p>
              </div>
              <button onClick={() => setIsAssignStudentOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left: All Unassigned or other students */}
              <div className="flex-1 border-r border-white/5 flex flex-col bg-black/20">
                <div className="p-4 border-b border-white/5 shrink-0">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text" placeholder="搜索全校学员..." value={assignSearch} onChange={e => setAssignSearch(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-cyan-500"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {students
                    .filter(s => {
                      const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
                      const isNotAssigned = s.teacher_id !== selectedTeacherId;
                      const matchesSearch = s.name.includes(assignSearch);
                      // Smart filter: check if student has the teacher's subject in their subject list or course balances
                      const hasSubject = selectedTeacher?.subject 
                        ? (s.subjects?.includes(selectedTeacher.subject) || (s.course_balances && s.course_balances[selectedTeacher.subject] > 0))
                        : true;
                      
                      return isNotAssigned && matchesSearch && hasSubject;
                    })
                    .map(stu => (
                      <div key={stu.id} className="flex items-center justify-between bg-white/5 border border-white/5 p-3 rounded-xl hover:border-cyan-500/30 transition-colors">
                        <div>
                          <span className="font-bold text-white text-sm">{stu.name}</span>
                          <span className="text-xs text-gray-500 ml-2">{stu.grade || '未知年级'}</span>
                        </div>
                        <button onClick={() => handleAssignStudent(stu.id)} className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-lg text-xs font-bold hover:bg-cyan-500/20">
                          分配 +
                        </button>
                      </div>
                    ))}
                </div>
              </div>
              
              {/* Right: Assigned Students */}
              <div className="flex-1 flex flex-col bg-cyan-950/10">
                <div className="p-4 border-b border-cyan-500/20 shrink-0">
                  <h4 className="text-sm font-bold tracking-widest text-cyan-400">已分配到名下</h4>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {students.filter(s => s.teacher_id === selectedTeacherId).length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-8">暂未分配</div>
                  ) : (
                    students.filter(s => s.teacher_id === selectedTeacherId).map(stu => (
                      <div key={stu.id} className="flex items-center justify-between bg-cyan-900/20 border border-cyan-500/30 p-3 rounded-xl">
                        <span className="font-bold text-white text-sm">{stu.name}</span>
                        <button onClick={() => handleRemoveStudent(stu.id)} className="text-red-400 px-3 py-1 rounded-lg text-xs hover:bg-red-500/10 transition-colors">
                          移除 -
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-white/5 bg-black/40 shrink-0 text-right">
              <button onClick={() => setIsAssignStudentOpen(false)} className="bg-cyan-500 text-black px-8 py-2.5 rounded-xl font-bold tracking-widest">完成</button>
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {isNewOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-xl font-bold text-white tracking-widest mb-6 flex items-center">
              <Banknote className="w-6 h-6 mr-2 text-amber-400" /> 新建充值订单
            </h3>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-2">充值学员</label>
                <select required value={orderStudentId} onChange={e => setOrderStudentId(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500">
                  <option value="" disabled>选择学员...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.parent_phone})</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-2">充值科目</label>
                  <select required value={orderSubject} onChange={e => setOrderSubject(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500">
                    <option value="" disabled>选择科目...</option>
                    {SUBJECT_OPTIONS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-2">购买课时数</label>
                  <input required type="number" min="1" value={orderClasses} onChange={e => setOrderClasses(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 font-mono font-bold" placeholder="例如：20" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-2">总收费金额 (元)</label>
                <input required type="number" step="0.01" min="0" value={orderTotalPrice} onChange={e => setOrderTotalPrice(e.target.value)} className="w-full bg-black/50 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-400 font-mono font-bold text-lg focus:border-amber-500" placeholder="0.00" />
              </div>

              <div className="flex justify-between items-center bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                <span className="text-sm text-amber-500/80 font-bold tracking-widest">系统核算单价</span>
                <span className="text-xl font-mono font-black text-amber-400">¥{orderUnitPrice} <span className="text-xs font-sans text-amber-500/60 font-normal">/课时</span></span>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsNewOrderOpen(false)} className="flex-1 bg-white/5 text-gray-400 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors">取消</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black py-3 rounded-xl font-bold tracking-widest transition-all shadow-lg">确认入账</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Teacher Confirm Modal */}
      {isDeleteTeacherOpen && teacherToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(239,68,68,0.2)] p-6 relative">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2 tracking-widest">确认删除教师？</h3>
            <p className="text-sm text-gray-400 text-center mb-6 leading-relaxed">
              即将删除教师 <span className="text-white font-bold">{teacherToDelete.full_name}</span>。<br/>
              名下关联的所有学员将被自动释放，该操作不可逆！
            </p>
            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsDeleteTeacherOpen(false)} 
                className="flex-1 bg-white/5 text-gray-400 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleConfirmDeleteTeacher} 
                className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 py-3 rounded-xl font-bold tracking-widest transition-colors"
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

export default SystemManagement;
