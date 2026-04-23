import React from 'react';
import { Button, Card, Empty, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type HistoryRecord = {
  id: string;
  time: string;
  student: string;
  subject: string;
  type: '消课' | '推送';
  status: '成功' | '失败';
};

const data: HistoryRecord[] = [];

export default function History() {
  const columns: ColumnsType<HistoryRecord> = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 140 },
    { title: '学员', dataIndex: 'student', key: 'student', width: 140 },
    { title: '科目', dataIndex: 'subject', key: 'subject', width: 140 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 120, render: (v) => <Tag color={v === '消课' ? 'blue' : 'gold'}>{v}</Tag> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: HistoryRecord['status']) => <Tag color={v === '成功' ? 'green' : 'red'}>{v}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: () => (
        <Space>
          <Button type="link">查看详情</Button>
          <Button type="link">重试</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <div>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          消课与推送流水
        </Typography.Title>
        <Typography.Text type="secondary">统一查看消课记录与家校推送发送结果</Typography.Text>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无流水记录。完成一次消课或推送后会在这里自动沉淀"
              >
                <Button type="primary">查看日历消课</Button>
              </Empty>
            ),
          }}
        />
      </Card>
    </div>
  );
}
