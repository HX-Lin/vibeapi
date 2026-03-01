/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@douyinfe/semi-ui';
import {
  FlaskConical,
  KeyRound,
  ScrollText,
  Tags,
  Wallet,
} from 'lucide-react';

const quickActionItems = [
  {
    key: 'playground',
    icon: FlaskConical,
    titleKey: '操练场',
    descKey: '探索并测试 AI 模型',
    path: '/console/playground',
    color: 'from-blue-500 to-cyan-400',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    key: 'token',
    icon: KeyRound,
    titleKey: '令牌管理',
    descKey: '管理您的 API 令牌',
    path: '/console/token',
    color: 'from-amber-500 to-orange-400',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
  },
  {
    key: 'log',
    icon: ScrollText,
    titleKey: '使用日志',
    descKey: '查看使用记录与统计',
    path: '/console/log',
    color: 'from-emerald-500 to-teal-400',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
  },
  {
    key: 'pricing',
    icon: Tags,
    titleKey: '模型广场',
    descKey: '浏览模型定价详情',
    path: '/pricing',
    color: 'from-violet-500 to-purple-400',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-500',
  },
  {
    key: 'topup',
    icon: Wallet,
    titleKey: '钱包管理',
    descKey: '账户充值与余额管理',
    path: '/console/topup',
    color: 'from-rose-500 to-pink-400',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
  },
];

const QuickActions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className='mb-6'>
      <h3 className='text-base font-semibold text-gray-600 mb-3'>
        {t('快速访问')}
      </h3>
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
        {quickActionItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Card
              key={item.key}
              className='quick-action-card cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1'
              bodyStyle={{ padding: '20px 16px' }}
              onClick={() => navigate(item.path)}
            >
              <div className='flex flex-col items-center text-center gap-3'>
                <div
                  className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center transition-transform duration-300`}
                >
                  <IconComponent
                    size={24}
                    className={`${item.iconColor} transition-colors duration-300`}
                  />
                </div>
                <div>
                  <div className='text-sm font-semibold text-gray-800 mb-1'>
                    {t(item.titleKey)}
                  </div>
                  <div className='text-xs text-gray-500 leading-relaxed'>
                    {t(item.descKey)}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
