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

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLucideIcon } from '../../helpers/lucide-icons';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useSidebarCollapsed } from '../../hooks/common/useSidebarCollapsed';
import { useSidebar } from '../../hooks/common/useSidebar';
import { useSidebarSections } from '../../hooks/common/useSidebarSections';
import { useMinimumLoadingTime } from '../../hooks/common/useMinimumLoadingTime';
import { isAdmin, isRoot } from '../../helpers/utils';
import { StatusContext } from '../../context/Status';
import SkeletonWrapper from './components/SkeletonWrapper';
import SidebarUserProfile from './SidebarUserProfile';

import { Nav, Divider, Button } from '@douyinfe/semi-ui';

const baseRouterMap = {
  channel: '/console/channel',
  token: '/console/token',
  redemption: '/console/redemption',
  topup: '/console/topup',
  user: '/console/user',
  subscription: '/console/subscription',
  log: '/console/log',
  midjourney: '/console/midjourney',
  task: '/console/task',
  setting: '/console/setting',
  detail: '/console',
  pricing: '/pricing',
  models: '/console/models',
  deployment: '/console/deployment',
  playground: '/console/playground',
  personal: '/console/personal',
  vibeapi: '/console/vibeapi',
};

const SiderBar = ({ onNavigate = () => {} }) => {
  const { t } = useTranslation();
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const [statusState] = useContext(StatusContext);
  const {
    isModuleVisible,
    hasSectionVisibleModules,
    loading: sidebarLoading,
  } = useSidebar();

  const { isSectionCollapsed, toggleSection } = useSidebarSections();
  const showSkeleton = useMinimumLoadingTime(sidebarLoading, 200);

  const vibeapiUpstreamEnabled = statusState?.status?.vibeapi_upstream_enabled || false;

  const [selectedKeys, setSelectedKeys] = useState(['detail']);
  const [openedKeys, setOpenedKeys] = useState([]);
  const location = useLocation();

  const workspaceItems = useMemo(() => {
    const items = [
      {
        text: t('模型广场'),
        itemKey: 'pricing',
        to: '/pricing',
      },
      {
        text: t('网页聊天'),
        itemKey: 'playground',
        to: '/console/playground',
      },
      {
        text: t('数据看板'),
        itemKey: 'detail',
        to: '/detail',
        className:
          localStorage.getItem('enable_data_export') === 'true'
            ? ''
            : 'tableHiddle',
      },
      {
        text: t('令牌管理'),
        itemKey: 'token',
        to: '/token',
      },
      {
        text: t('使用日志'),
        itemKey: 'log',
        to: '/log',
      },
      {
        text: t('绘图日志'),
        itemKey: 'midjourney',
        to: '/midjourney',
      },
      {
        text: t('任务日志'),
        itemKey: 'task',
        to: '/task',
      },
    ];

    // 根据配置过滤项目
    const filteredItems = items.filter((item) => {
      const configVisible = isModuleVisible('console', item.itemKey);
      return configVisible;
    });

    return filteredItems;
  }, [
    localStorage.getItem('enable_data_export'),
    t,
    isModuleVisible,
  ]);

  const financeItems = useMemo(() => {
    const items = [
      {
        text: t('钱包管理'),
        itemKey: 'topup',
        to: '/topup',
      },
      {
        text: t('个人设置'),
        itemKey: 'personal',
        to: '/personal',
      },
    ];

    // 根据配置过滤项目
    const filteredItems = items.filter((item) => {
      const configVisible = isModuleVisible('personal', item.itemKey);
      return configVisible;
    });

    return filteredItems;
  }, [t, isModuleVisible]);

  const helpDocs = statusState?.status?.help_docs;

  // 动态构建 routerMap，包含帮助文档路由
  const routerMap = useMemo(() => {
    const map = { ...baseRouterMap };
    if (Array.isArray(helpDocs)) {
      helpDocs.forEach((doc) => {
        map['help-' + doc.slug] = '/console/help/' + doc.slug;
      });
    }
    return map;
  }, [helpDocs]);

  const helpItems = useMemo(() => {
    if (!Array.isArray(helpDocs) || helpDocs.length === 0) return [];

    const items = helpDocs
      .slice()
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((doc) => ({
        text: doc.title,
        itemKey: 'help-' + doc.slug,
        to: '/console/help/' + doc.slug,
      }));

    return items;
  }, [helpDocs]);

  const adminItems = useMemo(() => {
    const items = [
      {
        text: t('渠道管理'),
        itemKey: 'channel',
        to: '/channel',
        className: isAdmin() ? '' : 'tableHiddle',
      },
      {
        text: t('订阅管理'),
        itemKey: 'subscription',
        to: '/subscription',
        className: isAdmin() ? '' : 'tableHiddle',
      },
      {
        text: t('模型管理'),
        itemKey: 'models',
        to: '/console/models',
        className: isAdmin() ? '' : 'tableHiddle',
      },
      {
        text: t('模型部署'),
        itemKey: 'deployment',
        to: '/deployment',
        className: isAdmin() ? '' : 'tableHiddle',
      },
      {
        text: t('兑换码管理'),
        itemKey: 'redemption',
        to: '/redemption',
        className: isAdmin() ? '' : 'tableHiddle',
      },
      {
        text: t('用户管理'),
        itemKey: 'user',
        to: '/user',
        className: isAdmin() ? '' : 'tableHiddle',
      },
      {
        text: t('VibeAPI 管理'),
        itemKey: 'vibeapi',
        to: '/vibeapi',
        className: isAdmin() && vibeapiUpstreamEnabled ? '' : 'tableHiddle',
      },
      {
        text: t('系统设置'),
        itemKey: 'setting',
        to: '/setting',
        className: isAdmin() ? '' : 'tableHiddle',
      },
    ];

    // 根据配置过滤项目
    const filteredItems = items.filter((item) => {
      const configVisible = isModuleVisible('admin', item.itemKey);
      return configVisible;
    });

    return filteredItems;
  }, [isAdmin(), isRoot(), t, isModuleVisible, vibeapiUpstreamEnabled]);

  // 根据当前路径设置选中的菜单项
  useEffect(() => {
    const currentPath = location.pathname;
    const matchingKey = Object.keys(routerMap).find(
      (key) => routerMap[key] === currentPath,
    );

    // 如果找到匹配的键，更新选中的键
    if (matchingKey) {
      setSelectedKeys([matchingKey]);
    }
  }, [location.pathname]);

  // 监控折叠状态变化以更新 body class
  useEffect(() => {
    if (collapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [collapsed]);

  // 选中高亮颜色（统一）
  const SELECTED_COLOR = 'var(--semi-color-primary)';

  // 渲染自定义菜单项
  const renderNavItem = (item) => {
    // 跳过隐藏的项目
    if (item.className === 'tableHiddle') return null;

    const isSelected = selectedKeys.includes(item.itemKey);
    const textColor = isSelected ? SELECTED_COLOR : 'inherit';

    return (
      <Nav.Item
        key={item.itemKey}
        itemKey={item.itemKey}
        text={
          <span
            className='truncate font-medium text-sm'
            style={{ color: textColor }}
          >
            {item.text}
          </span>
        }
        icon={
          <div className='sidebar-icon-container flex-shrink-0'>
            {getLucideIcon(item.itemKey, isSelected)}
          </div>
        }
        className={item.className}
      />
    );
  };

  // 渲染可折叠的区域
  const renderSection = (sectionKey, label, items, isFirst = false) => {
    const sectionFolded = isSectionCollapsed(sectionKey);

    return (
      <>
        {!isFirst && <Divider className='sidebar-divider' />}
        <div className={isFirst ? 'sidebar-section' : ''}>
          {!collapsed && (
            <div
              className='sidebar-section-header'
              onClick={() => toggleSection(sectionKey)}
            >
              <div className='sidebar-group-label'>{label}</div>
              <ChevronDown
                size={12}
                strokeWidth={2}
                color='var(--semi-color-text-2)'
                className={`sidebar-fold-icon${sectionFolded ? ' sidebar-fold-icon-visible' : ''}`}
                style={{
                  transform: sectionFolded ? 'rotate(-90deg)' : 'rotate(0deg)',
                }}
              />
            </div>
          )}
          <div
            className={`sidebar-section-content${sectionFolded && !collapsed ? ' sidebar-section-content-collapsed' : ' sidebar-section-content-expanded'}`}
            style={
              !sectionFolded || collapsed
                ? { maxHeight: `${items.length * 48 + 20}px` }
                : undefined
            }
          >
            {items.map((item) => renderNavItem(item))}
          </div>
        </div>
      </>
    );
  };

  return (
    <div
      className='sidebar-container'
      style={{
        width: 'var(--sidebar-current-width)',
      }}
    >
      <SkeletonWrapper
        loading={showSkeleton}
        type='sidebar'
        className=''
        collapsed={collapsed}
        showAdmin={isAdmin()}
      >
        <Nav
          className='sidebar-nav'
          defaultIsCollapsed={collapsed}
          isCollapsed={collapsed}
          onCollapseChange={toggleCollapsed}
          selectedKeys={selectedKeys}
          itemStyle='sidebar-nav-item'
          hoverStyle='sidebar-nav-item:hover'
          selectedStyle='sidebar-nav-item-selected'
          renderWrapper={({ itemElement, props }) => {
            const to = routerMap[props.itemKey];

            // 如果没有路由，直接返回元素
            if (!to) return itemElement;

            return (
              <Link
                style={{ textDecoration: 'none' }}
                to={to}
                onClick={onNavigate}
              >
                {itemElement}
              </Link>
            );
          }}
          onSelect={(key) => {
            // 如果点击的是已经展开的子菜单的父项，则收起子菜单
            if (openedKeys.includes(key.itemKey)) {
              setOpenedKeys(openedKeys.filter((k) => k !== key.itemKey));
            }

            setSelectedKeys([key.itemKey]);
          }}
          openKeys={openedKeys}
          onOpenChange={(data) => {
            setOpenedKeys(data.openKeys);
          }}
        >
          {/* 工作台区域 */}
          {hasSectionVisibleModules('console') &&
            renderSection('console', t('工作台'), workspaceItems, true)}

          {/* 个人中心区域 */}
          {hasSectionVisibleModules('personal') &&
            renderSection('personal', t('个人中心'), financeItems)}

          {/* 帮助中心区域 */}
          {helpItems.length > 0 &&
            renderSection('help', t('帮助中心'), helpItems)}

          {/* 管理员区域 - 只在管理员时显示且配置允许时显示 */}
          {isAdmin() &&
            hasSectionVisibleModules('admin') &&
            renderSection('admin', t('管理员'), adminItems)}
        </Nav>
      </SkeletonWrapper>

      {/* 底部用户信息 + 折叠按钮 */}
      <SidebarUserProfile collapsed={collapsed} />
      <div className='sidebar-collapse-button'>
        <SkeletonWrapper
          loading={showSkeleton}
          type='button'
          width={collapsed ? 36 : 156}
          height={24}
          className='w-full'
        >
          <Button
            theme='outline'
            type='tertiary'
            size='small'
            icon={
              <ChevronLeft
                size={16}
                strokeWidth={2.5}
                color='var(--semi-color-text-2)'
                style={{
                  transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            }
            onClick={toggleCollapsed}
            icononly={collapsed}
            style={
              collapsed
                ? { width: 36, height: 24, padding: 0 }
                : { padding: '4px 12px', width: '100%' }
            }
          >
            {!collapsed ? t('收起侧边栏') : null}
          </Button>
        </SkeletonWrapper>
      </div>
    </div>
  );
};

export default SiderBar;
