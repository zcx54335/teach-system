import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button, Card, Col, Empty, Form, Input, InputNumber, Modal, Row, Select, Skeleton, Space, Statistic, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Banknote, Plus } from 'lucide-react';

type Student = {
  id: string;
  name: string;
  subjects?: string[];
  course_balances?: Record<string, number>;
};

type Order = {
  id: string;
  created_at: string;
  student_id: string;
  subject: string;
  total_classes: number;
  total_price: number;
  unit_price: number;
  status?: string;
};

export default function FinanceManagement() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const sessionStr = localStorage.getItem('xiaoyu_user');
    if (!sessionStr) {
      navigate('/login');
      return;
    }
    try {
      const session = JSON.parse(sessionStr);
      const role = session.role === 'admin' ? 'sysadmin' : session.role;
      if (role !== 'sysadmin') {
        message.error('权限不足：仅限管理员访问财务管理');
        navigate('/dashboard/dashboard');
        return;
      }
    } catch {
      navigate('/login');
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    const [stuRes, orderRes] = await Promise.all([
      supabase.from('students').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
    ]);

    if (stuRes.data) setStudents(stuRes.data as Student[]);
    if (orderRes.data) setOrders(orderRes.data as Order[]);
    setIsLoading(false);
  };

  const studentMap = useMemo(() => {
    const m = new Map<string, Student>();
    students.forEach((s) => m.set(s.id, s));
    return m;
  }, [students]);

  const financialStats = useMemo(() => {
    let totalRemainingClasses = 0;
    let estimatedLiability = 0;

    const latestPriceMap: Record<string, number> = {};
    orders.forEach((o) => {
      const key = `${o.student_id}_${o.subject}`;
      if (!latestPriceMap[key]) {
        latestPriceMap[key] = o.unit_price;
      }
    });

    students.forEach((stu) => {
      const balances = stu.course_balances || {};
      Object.entries(balances).forEach(([sub, count]) => {
        if (count > 0) {
          totalRemainingClasses += count;
          const unitPrice = latestPriceMap[`${stu.id}_${sub}`] || 0;
          estimatedLiability += count * unitPrice;
        }
      });
    });

    return { totalRemainingClasses, estimatedLiability };
  }, [students, orders]);

  const columns: ColumnsType<Order> = [
    {
      title: '订单时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
    {
      title: '学员姓名',
      dataIndex: 'student_id',
      key: 'student_id',
      render: (id: string) => studentMap.get(id)?.name || '未知学员',
    },
    {
      title: '充值科目',
      dataIndex: 'subject',
      key: 'subject',
      width: 160,
      render: (v: string) => <Tag color="cyan">{v}</Tag>,
    },
    {
      title: '增加课时',
      dataIndex: 'total_classes',
      key: 'total_classes',
      width: 120,
      render: (v: number) => `+${v}`,
    },
    {
      title: '总金额',
      dataIndex: 'total_price',
      key: 'total_price',
      width: 140,
      align: 'right',
      render: (v: number) => `¥${Number(v).toFixed(2)}`,
    },
    {
      title: '核算单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 160,
      align: 'right',
      render: (v: number) => `¥${Number(v).toFixed(2)} /课时`,
    },
  ];

  const handleCreate = async (values: { student_id: string; subject: string; total_classes: number; total_price: number }) => {
    const student = students.find((s) => s.id === values.student_id);
    if (!student) return;

    const unitPrice = values.total_classes > 0 ? Number((values.total_price / values.total_classes).toFixed(2)) : 0;
    setIsSubmitting(true);

    try {
      const { error: orderError } = await supabase.from('orders').insert({
        student_id: values.student_id,
        subject: values.subject,
        total_classes: values.total_classes,
        total_price: values.total_price,
        unit_price: unitPrice,
        status: 'active',
      });
      if (orderError) throw orderError;

      const currentBalances = student.course_balances || {};
      const currentRemaining = currentBalances[values.subject] || 0;
      const newBalances = { ...currentBalances, [values.subject]: currentRemaining + values.total_classes };

      const currentSubjects = Array.isArray(student.subjects) ? student.subjects : [];
      const newSubjects = currentSubjects.includes(values.subject) ? currentSubjects : [...currentSubjects, values.subject];

      const { error: stuError } = await supabase
        .from('students')
        .update({
          course_balances: newBalances,
          subjects: newSubjects,
        })
        .eq('id', values.student_id);
      if (stuError) throw stuError;

      message.success('订单创建成功，课时已入账');
      setIsCreateOpen(false);
      form.resetFields();
      fetchData();
    } catch (e: any) {
      message.error(`订单创建失败：${e?.message || '未知错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <Statistic title="全校待消课时总量" value={financialStats.totalRemainingClasses} suffix="课时" />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Statistic title="预估待消负债金额" value={financialStats.estimatedLiability} precision={2} prefix="¥" />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <Banknote className="w-5 h-5" />
            财务充值订单流水
          </Space>
        }
        extra={
          <Button type="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
            新建订单
          </Button>
        }
      >
        {isLoading ? (
          <Skeleton active />
        ) : orders.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无订单数据，点击新建第一笔充值订单"
          >
            <Button type="primary" onClick={() => setIsCreateOpen(true)}>
              新建订单
            </Button>
          </Empty>
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={orders}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无订单数据，点击新建第一笔充值订单"
                >
                  <Button type="primary" onClick={() => setIsCreateOpen(true)}>
                    新建订单
                  </Button>
                </Empty>
              ),
            }}
          />
        )}
      </Card>

      <Modal
        title="新建充值订单"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={isSubmitting}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          requiredMark={false}
          initialValues={{ total_classes: 1, total_price: 0 }}
        >
          <Form.Item name="student_id" label="学员" rules={[{ required: true, message: '请选择学员' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={students.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="请选择学员"
            />
          </Form.Item>
          <Form.Item name="subject" label="充值科目" rules={[{ required: true, message: '请输入科目' }]}>
            <Input placeholder="例如：数学" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="total_classes" label="增加课时" rules={[{ required: true, message: '请输入课时数' }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="total_price" label="总金额" rules={[{ required: true, message: '请输入总金额' }]}>
                <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
