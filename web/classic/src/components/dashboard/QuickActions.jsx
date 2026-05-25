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

import React, { useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@douyinfe/semi-ui';
import {
  Gift,
  KeyRound,
  ScrollText,
  Server,
} from 'lucide-react';
import { StatusContext } from '../../context/Status';

const QuickActions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusState] = useContext(StatusContext);

  // 获取第一个帮助文档的路径
  const firstHelpDocPath = useMemo(() => {
    const helpDocs = statusState?.status?.help_docs;
    if (!Array.isArray(helpDocs) || helpDocs.length === 0) return null;
    const sorted = helpDocs
      .slice()
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return '/console/help/' + sorted[0].slug;
  }, [statusState?.status?.help_docs]);

  const quickActionItems = useMemo(() => {
    const items = [
      {
        key: 'redeem',
        icon: Gift,
        titleKey: '兑换码兑换额度',
        descKey: '使用兑换码充值额度',
        path: '/console/topup',
        iconBg: 'bg-rose-50',
        iconColor: 'text-rose-500',
      },
      {
        key: 'token',
        icon: KeyRound,
        titleKey: '令牌添加',
        descKey: '创建和管理 API 令牌',
        path: '/console/token',
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-500',
      },
      ...(firstHelpDocPath
        ? [
            {
              key: 'deploy',
              icon: Server,
              titleKey: '部署与配置',
              descKey: '查看部署与配置指南',
              path: firstHelpDocPath,
              iconBg: 'bg-blue-50',
              iconColor: 'text-blue-500',
            },
          ]
        : []),
      {
        key: 'log',
        icon: ScrollText,
        titleKey: '使用日志',
        descKey: '查看使用记录与统计',
        path: '/console/log',
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-500',
      },
    ];
    return items;
  }, [firstHelpDocPath]);

  return (
    <div className='mb-6'>
      <h3 className='text-base font-semibold text-gray-600 mb-3'>
        {t('快速访问')}
      </h3>
      <div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
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
