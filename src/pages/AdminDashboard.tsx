import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, Clock, Activity, LogOut, Hexagon, 
  Settings, BookOpen, Edit, MinusCircle, ExternalLink, X, CheckCircle, Trash2, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Col, Empty, Form, Input, Modal, Row, Select, Skeleton, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '../components/Auth/AuthProvider';
import { ROLES } from '../constants/rbac';

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
  const { user } = useAuth();
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

  const [form] = Form.useForm();
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
      (() => {
        let q = supabase.from('students').select('*').order('created_at', { ascending: false });
        if (user?.role === ROLES.TEACHER) {
          q = q.eq('teacher_id', user.id);
        }
        return q;
      })(),
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
    form.resetFields();
    form.setFieldsValue({ grade: '一年级', subjects: [] });
    setIsAddModalOpen(true);
  };

  const handleEditStudentClick = (student: StudentRecord) => {
    setIsEditStudentMode(true);
    setEditingStudentId(student.id);
    form.setFieldsValue({
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

  const handleAddStudent = async (values: any) => {
    const { name, phone, parent_phone, school, grade, subjects } = values;

    if (parent_phone.length !== 11) {
      toast.error('请输入11位有效家长手机号');
      return;
    }
    if (!subjects || subjects.length === 0) {
      toast.error('请至少选择一个报读科目');
      return;
    }
    
    setIsAdding(true);
    try {
      if (isEditStudentMode && editingStudentId) {
        // Edit mode
        const { error } = await supabase.from('students').update({
          name: name,
          phone: phone || parent_phone,
          parent_phone: parent_phone,
          school: school,
          grade: grade,
          subjects: subjects
        }).eq('id', editingStudentId);

        if (error) {
          if (error.code === '23505') throw new Error('手机号已被占用，请检查');
          throw error;
        }
        toast.success('✅ 学员信息修改成功！');
      } else {
        // Add mode
        const password = parent_phone.slice(-6);

        let profileId;
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', parent_phone)
          .single();

        if (existingProfile) {
          profileId = existingProfile.id;
        } else {
          const { data: insertedProfile, error: profileError } = await supabase
            .from('profiles')
            .insert([{
              phone: parent_phone,
              password: password,
              role: 'parent',
              full_name: name + '的家长'
            }])
            .select('id')
            .single();

          if (profileError) throw new Error(`创建家长账号失败: ${profileError.message}`);
          profileId = insertedProfile.id;
        }

        const initialBalances: Record<string, number> = {};
        subjects.forEach((sub: string) => {
          initialBalances[sub] = 0;
        });

        const { error: dbError } = await supabase.from('students').insert([{
          name: name,
          phone: phone || parent_phone,
          parent_phone: parent_phone,
          school: school,
          grade: grade,
          subjects: subjects,
          course_balances: initialBalances,
          status: 'enrolled',
          auth_id: profileId,
          password_hash: password,
          remaining_classes: 0 
        }]);

        if (dbError) throw new Error(`DB Error: ${dbError.message}`);

        toast.success('✅ 新增学员成功！');
      }

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
  const canManageStudents = user?.role === ROLES.SUPER_ADMIN;

  const columns: ColumnsType<StudentRecord> = [
    {
      title: '学员姓名',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <span className="font-semibold">{v}</span>,
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 160 },
    { title: '年级', dataIndex: 'grade', key: 'grade', width: 120, render: (v: string) => v || '未分配' },
    {
      title: '剩余课时',
      dataIndex: 'remaining_classes',
      key: 'remaining_classes',
      width: 140,
      render: (v: number) => <Tag color={v <= 3 ? 'red' : 'blue'}>{v}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 360,
      render: (_: unknown, record: StudentRecord) => (
        <Space size={4} wrap>
          <Button type="link" onClick={() => handleEditStudentClick(record)}>
            编辑
          </Button>
          <Button
            type="link"
            onClick={() => {
              setSelectedTopupStudent(record);
              setIsTopupModalOpen(true);
            }}
          >
            充值
          </Button>
          <Button type="link" onClick={() => handleDeductClass(record.id, record.remaining_classes, record.name)}>
            一键消课
          </Button>
          <Button type="link" onClick={() => window.open(`/#/parent?id=${record.id}`, '_blank', 'noopener,noreferrer')}>
            查看报告
          </Button>
          {canManageStudents && (
            <Button type="link" danger onClick={() => handleDeleteStudentClick(record)}>
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6 relative">
      <div className="flex items-end justify-between">
        <div>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            学员资产概览
          </Typography.Title>
          <Typography.Text type="secondary">实时掌握学员资产与课时结构</Typography.Text>
        </div>
        {canManageStudents && (
          <Button type="primary" onClick={handleAddStudentClick}>
            新增学员
          </Button>
        )}
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="总学员数" value={totalStudents} suffix="人" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="待消课时" value={totalRemainingClasses} suffix="课时" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="系统运行" value={uptime} suffix="天" />
          </Card>
        </Col>
      </Row>

      <Card title="学员列表">
        {isLoading ? (
          <Skeleton active />
        ) : students.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={canManageStudents ? '暂无学员数据，点击新增第一位学员' : '暂无学员数据'}
          >
            {canManageStudents && (
              <Button type="primary" onClick={handleAddStudentClick}>
                新增学员
              </Button>
            )}
          </Empty>
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={students}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={canManageStudents ? '暂无学员数据，点击新增第一位学员' : '暂无学员数据'}
                >
                  {canManageStudents && (
                    <Button type="primary" onClick={handleAddStudentClick}>
                      新增学员
                    </Button>
                  )}
                </Empty>
              ),
            }}
          />
        )}
      </Card>

      <Modal
        title={isEditStudentMode ? '编辑学员信息' : '录入新学员'}
        open={isAddModalOpen}
        onCancel={() => !isAdding && setIsAddModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={isAdding}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAddStudent} requiredMark={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="学员姓名" rules={[{ required: true, message: '请输入学员姓名' }]}>
                <Input placeholder="例如：李小明" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="parent_phone" 
                label="家长手机号 (用于登录)" 
                rules={[
                  { required: true, message: '请输入家长手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的 11 位手机号' }
                ]}
              >
                <Input placeholder="11位手机号" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="school" label="就读学校">
                <Input placeholder="例如：第一小学" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="grade" label="年级" rules={[{ required: true, message: '请选择年级' }]}>
                <Select placeholder="请选择年级" options={GRADE_OPTIONS.map(g => ({ label: g, value: g }))} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="subjects" label="报读科目" rules={[{ required: true, message: '请至少选择一个报读科目' }]}>
            <Select
              mode="multiple"
              placeholder="请选择报读科目"
              options={systemSubjects.map(sub => ({ label: sub, value: sub }))}
              maxTagCount="responsive"
              style={{ width: '100%' }}
              notFoundContent="暂无科目，请先前往科目配置中添加"
            />
          </Form.Item>
        </Form>
      </Modal>

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
