import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

const AdminSettings: React.FC = () => {
  return (
    <div className="p-8 h-full flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 bg-purple-500/10 border border-purple-500/20 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
        <SettingsIcon className="w-10 h-10 text-purple-400" />
      </div>
      <h2 className="text-2xl font-bold tracking-widest text-white mb-4">系统全局配置</h2>
      <p className="text-sm text-gray-400 font-light tracking-wider max-w-md leading-relaxed">
        即将支持课时包配置、机构信息管理、管理员密码修改等高级设置。
      </p>
    </div>
  );
};

export default AdminSettings;