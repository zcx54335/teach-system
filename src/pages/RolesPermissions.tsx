import React from 'react';
import { Button, Card, Empty, Typography } from 'antd';

export default function RolesPermissions() {
  return (
    <div className="w-full flex flex-col gap-6">
      <div>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          角色与权限
        </Typography.Title>
        <Typography.Text type="secondary">管理员、教师等角色的权限边界配置</Typography.Text>
      </div>

      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="权限系统开发中。当前版本采用基础角色（管理员/教师/家长）"
        >
          <Button type="primary">新建角色</Button>
        </Empty>
      </Card>
    </div>
  );
}

