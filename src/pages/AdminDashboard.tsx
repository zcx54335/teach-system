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
  remaining_lessons: number;
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
  const GRADE_OPTIONS = ['学前', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三'];

  const selectedGrade = Form.useWatch('grade', form);

  const filteredSubjects = React.useMemo(() => {
    if (!selectedGrade) return systemSubjects;
    
    const isPrimary = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'].includes(selectedGrade);
    const isMiddle = ['初一', '初二', '初三'].includes(selectedGrade);
    const isHigh = ['高一', '高二', '高三'].includes(selectedGrade);
    const isPreschool = selectedGrade === '学前';

    return systemSubjects.filter(sub => {
      if (isPrimary) {
        return !sub.includes('初中') && !sub.includes('高中') && !sub.includes('学前');
      } else if (isMiddle) {
        return !sub.includes('小学') && !sub.includes('学前') && !sub.includes('高中');
      } else if (isHigh) {
        return !sub.includes('小学') && !sub.includes('初中') && !sub.includes('学前');
      } else if (isPreschool) {
        return !sub.includes('小学') && !sub.includes('初中') && !sub.includes('高中');
      }
      return true;
    });
  }, [selectedGrade, systemSubjects]);

  // Search states
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchSubject, setSearchSubject] = useState<string | undefined>(undefined);

  const [appliedSearchName, setAppliedSearchName] = useState('');
  const [appliedSearchPhone, setAppliedSearchPhone] = useState('');
  const [appliedSearchSubject, setAppliedSearchSubject] = useState<string | undefined>(undefined);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      let allowedStudentIds: string[] | null = null;

      if (user?.role === ROLES.TEACHER) {
        const { data: links } = await supabase
          .from('teacher_student_link')
          .select('student_id')
          .eq('teacher_id', user.id)
          .eq('status', 'active');
        allowedStudentIds = links ? links.map(l => l.student_id) : [];
      }

      const [stuRes, settingsRes] = await Promise.all([
        (() => {
          let q = supabase.from('students').select('*').order('created_at', { ascending: false });
          if (allowedStudentIds !== null) {
            if (allowedStudentIds.length === 0) {
              // Return empty result if no students
              q = q.in('id', ['00000000-0000-0000-0000-000000000000']);
            } else {
              q = q.in('id', allowedStudentIds);
            }
          }
          if (appliedSearchName) {
            q = q.ilike('name', `%${appliedSearchName}%`);
          }
          if (appliedSearchPhone) {
            // Can match either phone or parent_phone or parent_username
            q = q.or(`phone.ilike.%${appliedSearchPhone}%,parent_phone.ilike.%${appliedSearchPhone}%,parent_username.ilike.%${appliedSearchPhone}%`);
          }
          if (appliedSearchSubject) {
            q = q.contains('subjects', [appliedSearchSubject]);
          }
          return q;
        })(),
        supabase.from('system_settings').select('subjects_list').eq('id', 1).single()
      ]);

      if (stuRes.error) throw stuRes.error;
      if (stuRes.data) {
        setStudents(stuRes.data);
      }
      if (settingsRes.data?.subjects_list) {
        setSystemSubjects(settingsRes.data.subjects_list);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('加载学员失败');
    } finally {
      setIsLoading(false);
    }
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
      parent_phone: student.parent_phone || '',
      parent_username: (student as any).parent_username || '',
      password: (student as any).password_hash || '',
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
    const { name, phone, parent_phone, parent_username, password, school, grade, subjects } = values;

    if (!parent_phone && !parent_username) {
      toast.error('手机号和用户名至少填写一项');
      return;
    }
    if (parent_phone && parent_phone.length !== 11) {
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
        const updateData: any = {
          name: name,
          phone: phone || parent_phone || null,
          parent_phone: parent_phone || null,
          parent_username: parent_username || null,
          school: school,
          grade: grade,
          subjects: subjects
        };
        
        if (password) {
          updateData.password_hash = password;
          // Sync password to users table if auth_id exists
          const { data: stuData } = await supabase.from('students').select('auth_id').eq('id', editingStudentId).single();
          if (stuData?.auth_id) {
            await supabase.from('users').update({ 
              password: password,
              phone: parent_phone || null,
              username: parent_username || null
            }).eq('id', stuData.auth_id);
          }
        } else {
          const { data: stuData } = await supabase.from('students').select('auth_id').eq('id', editingStudentId).single();
          if (stuData?.auth_id) {
            await supabase.from('users').update({ 
              phone: parent_phone || null,
              username: parent_username || null
            }).eq('id', stuData.auth_id);
          }
        }

        const { error } = await supabase.from('students').update(updateData).eq('id', editingStudentId);

        if (error) {
          if (error.code === '23505') throw new Error('手机号或用户名已被占用，请检查');
          throw error;
        }
        toast.success('✅ 学员信息修改成功！');
      } else {
        // Add mode
        if (!password) {
          throw new Error('请输入家长账号初始密码');
        }

        let profileId;
        
        let existingProfile = null;
        if (parent_phone) {
          const { data } = await supabase.from('users').select('id').eq('phone', parent_phone).single();
          existingProfile = data;
        } else if (parent_username) {
          const { data } = await supabase.from('users').select('id').eq('username', parent_username).single();
          existingProfile = data;
        }

        if (existingProfile) {
          profileId = existingProfile.id;
        } else {
          const { data: insertedProfile, error: profileError } = await supabase
            .from('users')
            .insert([{
              phone: parent_phone || null,
              username: parent_username || null,
              password: password,
              role: 'parent',
              name: name + '的家长'
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
          phone: phone || parent_phone || null,
          parent_phone: parent_phone || null,
          parent_username: parent_username || null,
          school: school,
          grade: grade,
          subjects: subjects,
          course_balances: initialBalances,
          status: 'enrolled',
          auth_id: profileId,
          password_hash: password,
          remaining_lessons: 0 
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
          remaining_lessons: (selectedTopupStudent.remaining_lessons || 0) + topupAmount,
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
          remaining_lessons: newRemaining,
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
  const totalRemainingClasses = students.reduce((acc, curr) => acc + (curr.remaining_lessons || 0), 0);
  const canManageStudents = user?.role === ROLES.SUPER_ADMIN;

  const columns: ColumnsType<StudentRecord> = [
    {
      title: '学员姓名',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <span className="font-semibold">{v}</span>,
    },
    { 
      title: '登录账号(手机号/用户名)', 
      dataIndex: 'phone', 
      key: 'phone', 
      width: 220,
      render: (_: any, record: any) => (
        <span>
          {record.parent_phone || '-'} 
          {record.parent_username ? ` / ${record.parent_username}` : ''}
        </span>
      )
    },
    { title: '年级', dataIndex: 'grade', key: 'grade', width: 120, render: (v: string) => v || '未分配' },
    {
      title: '剩余课时',
      key: 'remaining_lessons',
      width: 220,
      render: (_: any, record: StudentRecord) => {
        const balances = record.course_balances || {};
        const entries = Object.entries(balances);
        
        if (entries.length === 0) {
          return <span className="text-gray-400">暂无数据</span>;
        }

        return (
          <div className="flex flex-col gap-1.5">
            {entries.map(([subject, count]) => (
              <div key={subject} className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-gray-400 mr-2">{subject}</span>
                <Tag color={count <= 3 ? 'red' : 'blue'} className="m-0 min-w-[32px] text-center">
                  {count}
                </Tag>
              </div>
            ))}
          </div>
        );
      },
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
          <Form.Item name="name" label="学员姓名" rules={[{ required: true, message: '请输入学员姓名' }]}>
            <Input placeholder="例如：李小明" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="parent_phone" 
                label="家长手机号 (用于登录)" 
                dependencies={['parent_username']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value && !getFieldValue('parent_username')) {
                        return Promise.reject(new Error('手机号和用户名至少填写一项'));
                      }
                      if (value && value.length !== 11) {
                        return Promise.reject(new Error('请输入11位有效家长手机号'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input placeholder="手机号或用户名二选一" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="parent_username" 
                label="家长用户名 (用于登录)" 
                dependencies={['parent_phone']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value && !getFieldValue('parent_phone')) {
                        return Promise.reject(new Error('手机号和用户名至少填写一项'));
                      }
                      if (value && !/^[a-zA-Z0-9_]{4,20}$/.test(value)) {
                        return Promise.reject(new Error('用户名只能包含字母、数字或下划线，且长度为4-20位'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input placeholder="手机号或用户名二选一" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="password" 
                label="家长账号初始密码" 
                rules={[{ required: !isEditStudentMode, message: '请输入初始密码' }]}
              >
                <Input.Password placeholder={isEditStudentMode ? "留空则不修改密码" : "请输入初始登录密码"} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="school" label="就读学校" rules={[{ required: true, message: '请输入就读学校' }]}>
                <Input placeholder="例如：育才小学" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="grade" label="年级" rules={[{ required: true, message: '请选择年级' }]}>
                <Select 
                  placeholder="请选择年级" 
                  options={GRADE_OPTIONS.map(g => ({ label: g, value: g }))} 
                  onChange={() => form.setFieldsValue({ subjects: [] })}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="subjects" label="报读科目" rules={[{ required: true, message: '请至少选择一个报读科目' }]}>
            <Select
              mode="multiple"
              placeholder="请选择报读科目"
              options={filteredSubjects.map(sub => ({ label: sub, value: sub }))}
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
