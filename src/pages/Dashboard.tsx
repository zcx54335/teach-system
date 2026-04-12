import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button, Card, Col, Empty, Row, Skeleton, Statistic, Typography } from 'antd';
import dayjs from 'dayjs';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Schedule = { id: string; date: string; status?: string };
type Order = { id: string; created_at: string; total_price: number };

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [studentsCount, setStudentsCount] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const [monthDeductionCount, setMonthDeductionCount] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [trend, setTrend] = useState<Array<{ day: string; classes: number; revenue: number }>>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);

      const now = dayjs();
      const monthStart = now.startOf('month').format('YYYY-MM-DD');
      const monthEnd = now.endOf('month').format('YYYY-MM-DD');
      const last30Start = now.subtract(29, 'day').format('YYYY-MM-DD');

      const [studentsRes, teachersRes, monthSchedulesRes, monthOrdersRes, last30SchedulesRes, last30OrdersRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('schedules').select('id,date,status').gte('date', monthStart).lte('date', monthEnd).eq('status', 'completed'),
        supabase.from('orders').select('id,created_at,total_price').gte('created_at', now.startOf('month').toISOString()).lte('created_at', now.endOf('month').toISOString()),
        supabase.from('schedules').select('id,date,status').gte('date', last30Start).lte('date', now.format('YYYY-MM-DD')).eq('status', 'completed'),
        supabase.from('orders').select('id,created_at,total_price').gte('created_at', now.subtract(29, 'day').startOf('day').toISOString()).lte('created_at', now.endOf('day').toISOString()),
      ]);

      setStudentsCount(studentsRes.count || 0);
      setTeachersCount(teachersRes.count || 0);
      setMonthDeductionCount((monthSchedulesRes.data as Schedule[] | null)?.length || 0);
      setMonthRevenue(
        ((monthOrdersRes.data as Order[] | null) || []).reduce((acc, o) => acc + Number(o.total_price || 0), 0),
      );

      const days = Array.from({ length: 30 }).map((_, idx) => now.subtract(29 - idx, 'day').format('YYYY-MM-DD'));
      const classesMap: Record<string, number> = {};
      ((last30SchedulesRes.data as Schedule[] | null) || []).forEach((s) => {
        classesMap[s.date] = (classesMap[s.date] || 0) + 1;
      });
      const revenueMap: Record<string, number> = {};
      ((last30OrdersRes.data as Order[] | null) || []).forEach((o) => {
        const d = dayjs(o.created_at).format('YYYY-MM-DD');
        revenueMap[d] = (revenueMap[d] || 0) + Number(o.total_price || 0);
      });

      setTrend(days.map((d) => ({ day: d, classes: classesMap[d] || 0, revenue: revenueMap[d] || 0 })));
      setIsLoading(false);
    };
    load();
  }, []);

  const chartData = useMemo(() => {
    return trend.map((d) => ({
      date: dayjs(d.day).format('MM-DD'),
      classes: d.classes,
      revenue: Number(d.revenue.toFixed(2)),
    }));
  }, [trend]);

  const tooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const classes = payload.find((p: any) => p.dataKey === 'classes')?.value ?? 0;
    const revenue = payload.find((p: any) => p.dataKey === 'revenue')?.value ?? 0;
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="mt-1 text-sm text-slate-900">消课：{classes}</div>
        <div className="text-sm text-slate-900">营收：¥{Number(revenue).toFixed(2)}</div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          工作台
        </Typography.Title>
        <Typography.Text type="secondary">核心指标与趋势概览</Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card loading={isLoading}>
            <Statistic title="总学员" value={studentsCount} suffix="人" />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={isLoading}>
            <Statistic title="本月消课时" value={monthDeductionCount} suffix="次" />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={isLoading}>
            <Statistic title="本月新增营收" value={monthRevenue} precision={2} prefix="¥" />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={isLoading}>
            <Statistic title="在职教师" value={teachersCount} suffix="人" />
          </Card>
        </Col>
      </Row>

      <Card title="最近 30 天消课 / 营收趋势">
        {isLoading ? (
          <Skeleton active />
        ) : chartData.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无趋势数据。完成消课或产生营收后，这里会自动生成趋势分析"
          >
            <Button type="primary">前往日历消课</Button>
          </Empty>
        ) : (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="classesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1677ff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1677ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#13c2c2" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#13c2c2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickFormatter={(v) => `¥${v}`}
                />
                <Tooltip content={tooltip} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="classes"
                  stroke="#1677ff"
                  strokeWidth={2.5}
                  fill="url(#classesFill)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#13c2c2"
                  strokeWidth={2.5}
                  fill="url(#revenueFill)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
