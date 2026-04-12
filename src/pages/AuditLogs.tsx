import React from 'react';
import { Button, Card, Empty, Typography } from 'antd';

export default function AuditLogs() {
  return (
    <div className="w-full flex flex-col gap-6">
      <div>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          操作日志
        </Typography.Title>
        <Typography.Text type="secondary">关键操作安全审计与追踪</Typography.Text>
      </div>

      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无日志数据。后续将接入关键操作审计流水"
        >
          <Button type="primary">查看日志策略</Button>
        </Empty>
      </Card>
    </div>
  );
}

