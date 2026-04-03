import React from 'react';
import { Calendar } from 'lucide-react';

const AdminSchedule: React.FC = () => {
  return (
    <div className="p-8 h-full flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
        <Calendar className="w-10 h-10 text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold tracking-widest text-white mb-4">课程排期模块开发中</h2>
      <p className="text-sm text-gray-400 font-light tracking-wider max-w-md leading-relaxed">
        即将支持可视化日历排课、一键通知家长等功能。<br />敬请期待！
      </p>
    </div>
  );
};

export default AdminSchedule;