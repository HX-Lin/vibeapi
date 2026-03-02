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

import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';

/**
 * 路径 → 面包屑配置
 * 每个条目包含面包屑层级：[{ labelKey, to? }]
 * labelKey 使用 i18n key（中文），to 为可选的链接路径
 */
const ROUTE_BREADCRUMBS = {
  // 控制台首页
  '/console': [{ labelKey: '数据看板' }],

  // 工作台
  '/console/playground': [{ labelKey: '操练场' }],
  '/console/token': [{ labelKey: '令牌管理' }],
  '/console/log': [{ labelKey: '使用日志' }],
  '/console/midjourney': [{ labelKey: '绘图日志' }],
  '/console/task': [{ labelKey: '任务日志' }],

  // 个人中心
  '/console/personal': [{ labelKey: '个人设置' }],
  '/console/topup': [{ labelKey: '钱包管理' }],

  // 帮助中心
  '/console/help/claude-cli': [
    { labelKey: '帮助中心', to: null },
    { labelKey: 'Claude Code CLI 配置' },
  ],
  '/console/help/vscode': [
    { labelKey: '帮助中心', to: null },
    { labelKey: 'VSCode 配置' },
  ],

  // 管理员
  '/console/channel': [{ labelKey: '渠道管理' }],
  '/console/models': [{ labelKey: '模型管理' }],
  '/console/deployment': [{ labelKey: '模型部署' }],
  '/console/subscription': [{ labelKey: '订阅管理' }],
  '/console/redemption': [{ labelKey: '兑换码管理' }],
  '/console/user': [{ labelKey: '用户管理' }],
  '/console/vibeapi': [{ labelKey: 'VibeAPI 管理' }],
  '/console/setting': [{ labelKey: '系统设置', dynamic: true }],
};

/**
 * Settings 页面 tab 名称映射
 * key = ?tab= 的值, value = i18n key
 */
const SETTINGS_TAB_LABELS = {
  operation: '运营设置',
  dashboard: '仪表盘设置',
  chats: '聊天设置',
  drawing: '绘图设置',
  payment: '支付设置',
  ratio: '分组与模型定价设置',
  ratelimit: '速率限制设置',
  models: '模型相关设置',
  'model-deployment': '模型部署设置',
  performance: '性能设置',
  system: '系统设置',
  other: '其他设置',
};

const Breadcrumb = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const crumbs = useMemo(() => {
    const path = location.pathname;

    // 只在 /console 路由下显示面包屑
    if (!path.startsWith('/console')) return null;

    const config = ROUTE_BREADCRUMBS[path];
    if (!config) return null;

    // 构建面包屑：首页 > ... > 当前页
    const items = [
      { label: t('控制台'), to: '/console', isHome: true },
    ];

    config.forEach((item, idx) => {
      const isLast = idx === config.length - 1;

      // 处理 Settings 页面的动态 tab 名称
      if (item.dynamic && path === '/console/setting') {
        const searchParams = new URLSearchParams(location.search);
        const tab = searchParams.get('tab');
        const tabLabel = tab && SETTINGS_TAB_LABELS[tab]
          ? SETTINGS_TAB_LABELS[tab]
          : null;

        // 系统设置 作为可点击的父层级
        items.push({
          label: t(item.labelKey),
          to: tabLabel ? '/console/setting' : null,
          isCurrent: !tabLabel,
        });

        // 如果有具体 tab，添加 tab 名称作为最后一层
        if (tabLabel) {
          items.push({
            label: t(tabLabel),
            to: null,
            isCurrent: true,
          });
        }
      } else {
        items.push({
          label: t(item.labelKey),
          to: item.to !== undefined ? item.to : null,
          isCurrent: isLast,
        });
      }
    });

    return items;
  }, [location.pathname, location.search, t]);

  if (!crumbs) return null;

  return (
    <nav className='breadcrumb-nav' aria-label='breadcrumb'>
      <ol className='breadcrumb-list'>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={index} className='breadcrumb-item'>
              {index > 0 && (
                <ChevronRight
                  size={14}
                  strokeWidth={2}
                  className='breadcrumb-separator'
                />
              )}
              {isLast || !crumb.to ? (
                <span
                  className={`breadcrumb-text${isLast ? ' breadcrumb-text-current' : ''}`}
                >
                  {crumb.isHome && (
                    <Home size={14} strokeWidth={2} className='breadcrumb-home-icon' />
                  )}
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.to} className='breadcrumb-link'>
                  {crumb.isHome && (
                    <Home size={14} strokeWidth={2} className='breadcrumb-home-icon' />
                  )}
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
