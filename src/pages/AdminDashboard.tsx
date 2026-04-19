import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, Clock, Activity, LogOut, Hexagon, 
  Settings, BookOpen, Edit, MinusCircle, ExternalLink, X, CheckCircle, Trash2, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Col, Empty, Form, Input, InputNumber, Modal, Row, Select, Skeleton, Space, Statistic, Table, Tag, Typography } from 'antd';
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
  const [topupForm] = Form.useForm();
  const [scoreForm] = Form.useForm();
  const [isAdding, setIsAdding] = useState(false);
  const [isEditStudentMode, setIsEditStudentMode] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const [deleteStudentModalOpen, setDeleteStudentModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentRecord | null>(null);

  const [systemSubjects, setSystemSubjects] = useState<string[]>([]);
  const GRADE_OPTIONS = ['学前', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三'];

  // Search states
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchSubject, setSearchSubject] = useState<string | undefined>(undefined);

  const [appliedSearchName, setAppliedSearchName] = useState('');
  const [appliedSearchPhone, setAppliedSearchPhone] = useState('');
  const [appliedSearchSubject, setAppliedSearchSubject] = useState<string | undefined>(undefined);

  const fetchStudents = async () => {
    setIsLoading(true);
    const [stuRes, settingsRes] = await Promise.all([
      (() => {
        let q = supabase.from('students').select('*').order('created_at', { ascending: false });
        if (user?.role === ROLES.TEACHER) {
          q = q.eq('teacher_id', user.id);
        }
        if (appliedSearchName) {
          q = q.ilike('name', `%${appliedSearchName}%`);
        }
        if (appliedSearchPhone) {
          // Can match either phone or parent_phone
          q = q.or(`phone.ilike.%${appliedSearchPhone}%,parent_phone.ilike.%${appliedSearchPhone}%`);
        }
        if (appliedSearchSubject) {
          q = q.contains('subjects', [appliedSearchSubject]);
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

  // Re-fetch when applied search parameters change
  useEffect(() => {
    // Only fetch if it's not the initial mount to avoid double fetch
    // since we already have an empty dependency array useEffect below
    fetchStudents();
  }, [appliedSearchName, appliedSearchPhone, appliedSearchSubject]);

  useEffect(() => {
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

  const handleTopup = async (values: { topupSubject: string; topupAmount: number; topupNotes?: string }) => {
    const { topupSubject, topupAmount, topupNotes } = values;
    if (!selectedTopupStudent || !topupSubject || topupAmount <= 0) return;

    setIsAdding(true);
    try {
      const currentBalances = selectedTopupStudent.course_balances || {};
      const currentAmount = currentBalances[topupSubject] || 0;
      
      const newBalances = {
        ...currentBalances,
        [topupSubject]: currentAmount + topupAmount
      };

      // 1. Update students table (balances and total remaining)
      const { error: updateError } = await supabase
        .from('students')
        .update({ 
          course_balances: newBalances,
          remaining_classes: (selectedTopupStudent.remaining_classes || 0) + topupAmount,
          total_classes: (selectedTopupStudent.total_classes || 0) + topupAmount
        })
        .eq('id', selectedTopupStudent.id);

      if (updateError) throw updateError;

      // 2. Insert recharge record
      const { error: insertError } = await supabase
        .from('recharge_records')
        .insert([{
          student_id: selectedTopupStudent.id,
          subject: topupSubject,
          amount: topupAmount,
          notes: topupNotes || ''
        }]);

      if (insertError) throw insertError;

      toast.success(`✅ 充值成功！已为 ${selectedTopupStudent.name} 增加 ${topupAmount} 课时。`);
      setIsTopupModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      toast.error('充值失败：' + err.message);
    } finally {
      setIsAdding(false);
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

  const handleSaveScores = async (values: any) => {
    if (!editingStudent) return;
    
    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          calc_score: values.calc_score,
          logic_score: values.logic_score,
          spatial_score: values.spatial_score,
          app_score: values.app_score,
          data_score: values.data_score,
          physics_score: values.physics_score,
          chemistry_score: values.chemistry_score,
        })
        .eq('id', editingStudent.id);

      if (error) throw error;
      toast.success('分数更新成功！');
      setIsEditModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      toast.error('更新失败：' + err.message);
    } finally {
      setIsAdding(false);
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
            编辑档案
          </Button>
          <Button 
            type="link" 
            onClick={() => {
              setEditingStudent(record);
              scoreForm.setFieldsValue({
                calc_score: record.calc_score || 0,
                logic_score: record.logic_score || 0,
                spatial_score: record.spatial_score || 0,
                app_score: record.app_score || 0,
                data_score: record.data_score || 0,
                physics_score: record.physics_score || 0,
                chemistry_score: record.chemistry_score || 0,
              });
              setIsEditModalOpen(true);
            }}
          >
            编辑分数
          </Button>
          <Button
            type="link"
            onClick={() => {
              setSelectedTopupStudent(record);
              topupForm.resetFields();
              setIsTopupModalOpen(true);
            }}
          >
            充值
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

      <Card title={
        <div className="flex items-center justify-between">
          <span>学员列表</span>
          <Space size="middle">
            <Space>
              <Input
                placeholder="搜索姓名"
                allowClear
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                onPressEnter={() => {
                  setAppliedSearchName(searchName);
                  setAppliedSearchPhone(searchPhone);
                  setAppliedSearchSubject(searchSubject);
                }}
                style={{ width: 140 }}
              />
              <Input
                placeholder="搜索手机号"
                allowClear
                value={searchPhone}
                onChange={e => setSearchPhone(e.target.value)}
                onPressEnter={() => {
                  setAppliedSearchName(searchName);
                  setAppliedSearchPhone(searchPhone);
                  setAppliedSearchSubject(searchSubject);
                }}
                style={{ width: 160 }}
              />
              <Select
                placeholder="筛选科目"
                allowClear
                value={searchSubject}
                onChange={value => setSearchSubject(value)}
                options={systemSubjects.map(sub => ({ label: sub, value: sub }))}
                style={{ width: 140 }}
              />
              <Button type="default" onClick={() => {
                setAppliedSearchName(searchName);
                setAppliedSearchPhone(searchPhone);
                setAppliedSearchSubject(searchSubject);
              }}>
                搜索
              </Button>
            </Space>
          </Space>
        </div>
      }>
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
      <Modal
        title={`为 ${selectedTopupStudent?.name} 充值课时`}
        open={isTopupModalOpen}
        onCancel={() => setIsTopupModalOpen(false)}
        onOk={() => topupForm.submit()}
        confirmLoading={isAdding}
        width={400}
      >
        <Form form={topupForm} layout="vertical" onFinish={handleTopup} requiredMark={false}>
          <Form.Item name="topupSubject" label="选择充值科目" rules={[{ required: true, message: '请选择充值科目' }]}>
            <Select placeholder="请选择科目">
              {(selectedTopupStudent?.subjects || []).map(sub => (
                <Select.Option key={sub} value={sub}>
                  {sub} (当前余额: {(selectedTopupStudent?.course_balances || {})[sub] || 0})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="topupAmount" label="充值数量 (课时)" rules={[{ required: true, message: '请输入充值数量' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入数量" />
          </Form.Item>
          <Form.Item name="topupNotes" label="充值备注">
            <Input.TextArea rows={3} placeholder="可选：填写充值相关备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑分数弹窗 */}
      <Modal
        title={`编辑能力雷达图 - ${editingStudent?.name}`}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => scoreForm.submit()}
        confirmLoading={isAdding}
        width={600}
      >
        <Form form={scoreForm} layout="vertical" onFinish={handleSaveScores} requiredMark={false}>
          <Row gutter={16}>
            {['calc_score', 'logic_score', 'spatial_score', 'app_score', 'data_score', 'physics_score', 'chemistry_score'].map((field) => (
              <Col span={12} key={field}>
                <Form.Item 
                  name={field} 
                  label={`${field.replace('_score', '')} (0-5)`}
                  rules={[{ required: true, message: '请输入分数' }]}
                >
                  <InputNumber min={0} max={5} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      </Modal>

      {/* Delete Student Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            <span>确认删除学员？</span>
          </div>
        }
        open={deleteStudentModalOpen}
        onCancel={() => setDeleteStudentModalOpen(false)}
        onOk={handleConfirmDeleteStudent}
        okText="确认删除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
        width={400}
      >
        <p className="text-gray-400 my-4">
          您正在删除学员 <span className="text-white font-bold">{studentToDelete?.name}</span>。<br/>
          此操作不可逆，学员的所有课时和记录将被永久删除。
        </p>
      </Modal>

    </div>
  );
};

export default AdminDashboard;
