import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/Auth/AuthProvider';
import { ROLES } from '../constants/rbac';

export default function Forbidden() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const home = user?.role === ROLES.TEACHER ? '/dashboard/deduction' : '/';

  return (
    <Result
      status="403"
      title="403"
      subTitle="无权访问该页面"
      extra={[
        <Button key="home" type="primary" onClick={() => navigate(home, { replace: true })}>
          返回首页
        </Button>,
      ]}
    />
  );
}

