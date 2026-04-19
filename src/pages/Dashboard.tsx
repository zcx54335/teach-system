import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button, Card, Col, Empty, Row, Skeleton, Statistic, theme, Typography } from 'antd';
import dayjs from 'dayjs';
import { Area, Pie, Radar, Rose } from '@ant-design/plots';
import { useTheme } from '../components/Theme/ThemeProvider';

type Schedule = { id: string; date: string; status?: string };
type Order = { id: string; created_at: string; total_price: number };

export default function Dashboard() {
  const { token } = theme.useToken();
  const { theme: appTheme } = useTheme();
  const isDark = appTheme === 'dark' || (appTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [isLoading, setIsLoading] = useState(true);
  const [studentsCount, setStudentsCount] = useState(0);
  const [teachersCount, setTeachersCount] = useState(0);
  const [monthDeductionCount, setMonthDeductionCount] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [trend, setTrend] = useState<Array<{ day: string; deductions: number; newSchedules: number }>>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);

      const now = dayjs();
      const monthStart = now.startOf('month').format('YYYY-MM-DD');
      const monthEnd = now.endOf('month').format('YYYY-MM-DD');
      const last30Start = now.subtract(29, 'day').format('YYYY-MM-DD');

      const [studentsRes, teachersRes, monthSchedulesRes, monthOrdersRes, last30DeductionsRes, last30SchedulesRes, last30OrdersRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('schedules').select('id,date,status').gte('date', monthStart).lte('date', monthEnd).eq('status', 'completed'),
        supabase.from('orders').select('id,created_at,total_price').gte('created_at', now.startOf('month').toISOString()).lte('created_at', now.endOf('month').toISOString()),
        supabase.from('schedules').select('id,date,status').gte('date', last30Start).lte('date', now.format('YYYY-MM-DD')).eq('status', 'completed'),
        supabase.from('schedules').select('id,date,status').gte('date', last30Start).lte('date', now.format('YYYY-MM-DD')),
        supabase.from('orders').select('id,created_at,total_price').gte('created_at', now.subtract(29, 'day').startOf('day').toISOString()).lte('created_at', now.endOf('day').toISOString()),
      ]);

      setStudentsCount(studentsRes.count || 0);
      setTeachersCount(teachersRes.count || 0);
      setMonthDeductionCount((monthSchedulesRes.data as Schedule[] | null)?.length || 0);
      setMonthRevenue(
        ((monthOrdersRes.data as Order[] | null) || []).reduce((acc, o) => acc + Number(o.total_price || 0), 0),
      );

      const days = Array.from({ length: 30 }).map((_, idx) => now.subtract(29 - idx, 'day').format('YYYY-MM-DD'));
      const deductionsMap: Record<string, number> = {};
      ((last30DeductionsRes.data as Schedule[] | null) || []).forEach((s) => {
        deductionsMap[s.date] = (deductionsMap[s.date] || 0) + 1;
      });
      const schedulesMap: Record<string, number> = {};
      ((last30SchedulesRes.data as Schedule[] | null) || []).forEach((s) => {
        schedulesMap[s.date] = (schedulesMap[s.date] || 0) + 1;
      });

      setTrend(days.map((d) => ({ day: d, deductions: deductionsMap[d] || 0, newSchedules: schedulesMap[d] || 0 })));
      setIsLoading(false);
    };
    load();
  }, []);

  const areaData = useMemo(() => {
    const out: Array<{ date: string; value: number; category: string }> = [];
    trend.forEach((d) => {
      const date = dayjs(d.day).format('MM-DD');
      out.push({ date, value: d.deductions, category: '消课数' });
      out.push({ date, value: d.newSchedules, category: '新增排课' });
    });
    return out;
  }, [trend]);

  const axisLabelColor = token.colorTextSecondary;
  const axisLineColor = token.colorSplit;

  const areaConfig = useMemo(() => {
    return {
      data: areaData,
      xField: 'date',
      yField: 'value',
      seriesField: 'category',
      smooth: true,
      autoFit: true,
      color: ['#1677ff', '#13c2c2'],
      areaStyle: (_: any, item: any) => {
        const c = item?.color || '#1677ff';
        return {
          fill: `l(270) 0:${c}40 1:${c}00`,
        };
      },
      line: { style: { lineWidth: 2.5 } },
      xAxis: {
        label: { style: { fill: axisLabelColor } },
        line: { style: { stroke: axisLineColor } },
        grid: { line: { style: { stroke: axisLineColor, lineDash: [3, 3] } } },
      },
      yAxis: {
        label: { style: { fill: axisLabelColor } },
        line: { style: { stroke: axisLineColor } },
        grid: { line: { style: { stroke: axisLineColor, lineDash: [3, 3] } } },
      },
      legend: {
        position: 'top-left',
        itemName: { style: { fill: token.colorText } },
      },
      tooltip: { shared: true, showCrosshairs: true, crosshairs: { type: 'xy' } },
      animation: { appear: { animation: 'fade-in', duration: 400 } },
    };
  }, [areaData, axisLabelColor, axisLineColor, token.colorText]);

  const radarData = useMemo(() => {
    return [
      { name: '专注力', score: 82 },
      { name: '理解力', score: 76 },
      { name: '计算力', score: 69 },
      { name: '表达力', score: 74 },
      { name: '习惯', score: 80 },
    ];
  }, []);

  const radarConfig = useMemo(() => {
    return {
      data: radarData,
      xField: 'name',
      yField: 'score',
      meta: { score: { min: 0, max: 100 } },
      area: { style: { fill: '#1677ff', fillOpacity: 0.18 } },
      line: { style: { stroke: '#1677ff', lineWidth: 2 } },
      point: { size: 2, style: { fill: '#1677ff' } },
      xAxis: { label: { style: { fill: axisLabelColor } }, line: null, grid: null },
      yAxis: { label: false, grid: { line: { style: { stroke: axisLineColor } } } },
      theme: isDark ? 'dark' : 'default',
    };
  }, [radarData, axisLabelColor, axisLineColor, isDark]);

  const donutData = useMemo(() => {
    return [
      { type: '一年级', value: 12 },
      { type: '二年级', value: 18 },
      { type: '三年级', value: 9 },
      { type: '四年级', value: 7 },
    ];
  }, []);

  const donutConfig = useMemo(() => {
    return {
      data: donutData,
      angleField: 'value',
      colorField: 'type',
      radius: 1,
      innerRadius: 0.62,
      color: ['#69c0ff', '#95de64', '#ffd666', '#ff9c6e'],
      legend: { position: 'bottom', itemName: { style: { fill: token.colorTextSecondary } } },
      label: { type: 'spider', style: { fill: axisLabelColor }, labelHeight: 28 },
      tooltip: { showTitle: false },
      statistic: { title: false, content: { style: { color: token.colorText, fontSize: 14 }, content: '年级' } },
      theme: isDark ? 'dark' : 'default',
    };
  }, [donutData, token.colorText, token.colorTextSecondary, axisLabelColor, isDark]);

  const roseData = useMemo(() => {
    return [
      { subject: '数学', value: 36 },
      { subject: '英语', value: 18 },
      { subject: '语文', value: 15 },
      { subject: '物理', value: 10 },
      { subject: '化学', value: 8 },
    ];
  }, []);

  const roseConfig = useMemo(() => {
    return {
      data: roseData,
      xField: 'subject',
      yField: 'value',
      seriesField: 'subject',
      radius: 0.9,
      legend: false,
      label: {
        offset: -8,
        style: { fill: token.colorText },
      },
      tooltip: { showTitle: false },
      theme: isDark ? 'dark' : 'default',
    };
  }, [roseData, token.colorText, isDark]);

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

      <Card title="消课与营收趋势">
        {isLoading ? (
          <Skeleton active />
        ) : areaData.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无趋势数据。完成消课或产生营收后，这里会自动生成趋势分析"
          >
            <Button type="primary">前往日历消课</Button>
          </Empty>
        ) : (
          <div style={{ height: 360 }}>
            <Area {...(areaConfig as any)} />
          </div>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="学员能力画像">
            <div style={{ height: 320 }}>
              <Radar {...(radarConfig as any)} />
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="生源来源/年级分布">
            <div style={{ height: 320 }}>
              <Pie {...(donutConfig as any)} />
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="热门消耗科目">
            <div style={{ height: 320 }}>
              <Rose {...(roseConfig as any)} />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
