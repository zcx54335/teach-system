import React from 'react';
import { Button, Card, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type NoticeRecord = {
  id: string;
  date: string;
  student: string;
  subject: string;
  status: '已发送' | '待发送';
};

const mockData: NoticeRecord[] = [
  { id: 'n1', date: '04-01 19:00', student: '子涵', subject: '数学', status: '已发送' },
  { id: 'n2', date: '04-03 19:00', student: '浩然', subject: '数学', status: '待发送' },
];

export default function NoticeRecords() {
  const columns: ColumnsType<NoticeRecord> = [
    { title: '时间', dataIndex: 'date', key: 'date', width: 140 },
    { title: '学员', dataIndex: 'student', key: 'student', width: 140 },
    { title: '科目', dataIndex: 'subject', key: 'subject', width: 140 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: NoticeRecord['status']) => <Tag color={v === '已发送' ? 'green' : 'gold'}>{v}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_: unknown, record: NoticeRecord) => (
        <Space>
          <Button type="link">查看</Button>
          {record.status === '待发送' && <Button type="link">重试发送</Button>}
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <div>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          排课与家校
        </Typography.Title>
        <Typography.Text type="secondary">排课记录与反馈发送流水</Typography.Text>
      </div>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={mockData} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}

