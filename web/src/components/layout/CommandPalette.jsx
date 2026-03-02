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

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { getLucideIcon } from '../../helpers/render';
import { isAdmin, isRoot } from '../../helpers';
import { SECTION_META, MODULE_META } from '../../hooks/common/useSidebar';

/**
 * 命令面板所有可跳转的路由条目
 * section: 所属分组（用于分组显示和权限判断）
 * key: 模块 key（用于图标和元数据查找）
 * path: 路由路径
 */
const ALL_ROUTES = [
  // 工作台
  { section: 'console', key: 'detail', path: '/console' },
  { section: 'console', key: 'playground', path: '/console/playground' },
  { section: 'console', key: 'token', path: '/console/token' },
  { section: 'console', key: 'log', path: '/console/log' },
  { section: 'console', key: 'midjourney', path: '/console/midjourney' },
  { section: 'console', key: 'task', path: '/console/task' },
  // 个人中心
  { section: 'personal', key: 'topup', path: '/console/topup' },
  { section: 'personal', key: 'personal', path: '/console/personal' },
  // 帮助中心
  { section: 'help', key: 'help-claude-cli', path: '/console/help/claude-cli' },
  { section: 'help', key: 'help-vscode', path: '/console/help/vscode' },
  // 管理员
  { section: 'admin', key: 'channel', path: '/console/channel' },
  { section: 'admin', key: 'models', path: '/console/models' },
  { section: 'admin', key: 'deployment', path: '/console/deployment' },
  { section: 'admin', key: 'subscription', path: '/console/subscription' },
  { section: 'admin', key: 'redemption', path: '/console/redemption' },
  { section: 'admin', key: 'user', path: '/console/user' },
  { section: 'admin', key: 'vibeapi', path: '/console/vibeapi' },
  // Settings sub-tabs (root only)
  { section: 'admin', key: 'setting', path: '/console/setting?tab=operation', titleKey: '运营设置', parentTitleKey: '系统设置' },
  { section: 'admin', key: 'setting', path: '/console/setting?tab=dashboard', titleKey: '仪表盘设置', parentTitleKey: '系统设置' },
  { section: 'admin', key: 'setting', path: '/console/setting?tab=chats', titleKey: '聊天设置', parentTitleKey: '系统设置' },
  { section: 'admin', key: 'setting', path: '/console/setting?tab=drawing', titleKey: '绘图设置', parentTitleKey: '系统设置' },
  { section: 'admin', key: 'setting', path: '/console/setting?tab=payment', titleKey: '支付设置', parentTitleKey: '系统设置' },
  { section: 'admin', key: 'setting', path: '/console/setting?tab=ratio', titleKey: '分组与模型定价设置', parentTitleKey: '系统设置' },
  { section: 'admin', key: 'setting', path: '/console/setting?tab=ratelimit', titleKey: '速率限制设置', parentTitleKey: '系统设置' },
  { section: 'admin', key: 'setting', path: '/console/setting?tab=models', titleKey: '模型相关设置', parentTitleKey: '系统设置' },
  { section: 'admin', key: 'setting', path: '/console/setting?tab=model-deployment', titleKey: '模型部署设置', parentTitleKey: '系统设置' },
  { section: 'admin', key: 'setting', path: '/console/setting?tab=performance', titleKey: '性能设置', parentTitleKey: '系统设置' },
  { section: 'admin', key: 'setting', path: '/console/setting?tab=system', titleKey: '系统设置', parentTitleKey: '系统设置' },
  { section: 'admin', key: 'setting', path: '/console/setting?tab=other', titleKey: '其他设置', parentTitleKey: '系统设置' },
  // 公共页面
  { section: 'public', key: 'pricing', path: '/pricing', titleKey: '模型广场' },
  { section: 'public', key: 'about', path: '/about', titleKey: '关于' },
];

const CommandPalette = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // 构建带本地化标题的路由列表（考虑权限）
  const indexedRoutes = useMemo(() => {
    const userIsAdmin = isAdmin();
    const userIsRoot = isRoot();

    return ALL_ROUTES
      .filter((route) => {
        // 管理员区域需要管理员权限
        if (route.section === 'admin') {
          if (route.key === 'setting') return userIsRoot;
          return userIsAdmin;
        }
        return true;
      })
      .map((route) => {
        const meta = MODULE_META[route.key];
        const title = route.titleKey
          ? t(route.titleKey)
          : meta
            ? t(meta.titleKey)
            : route.key;
        const parentTitle = route.parentTitleKey ? t(route.parentTitleKey) : '';
        const desc = route.parentTitleKey
          ? parentTitle + ' > ' + title
          : meta
            ? t(meta.descKey)
            : '';
        const sectionMeta = SECTION_META[route.section];
        const sectionTitle = sectionMeta
          ? t(sectionMeta.titleKey)
          : route.section === 'public'
            ? t('公共页面')
            : route.section;

        return {
          ...route,
          title,
          desc,
          sectionTitle,
          // 搜索用的拼接字符串（中文标题 + 英文 key + 描述 + 父标题）
          searchText: `${title} ${route.key} ${desc} ${sectionTitle} ${parentTitle}`.toLowerCase(),
        };
      });
  }, [t]);

  // 过滤搜索结果
  const filteredResults = useMemo(() => {
    if (!query.trim()) return indexedRoutes;

    const q = query.trim().toLowerCase();
    return indexedRoutes.filter((item) => item.searchText.includes(q));
  }, [query, indexedRoutes]);

  // 按 section 分组
  const groupedResults = useMemo(() => {
    const groups = {};
    const order = [];

    filteredResults.forEach((item) => {
      if (!groups[item.section]) {
        groups[item.section] = {
          label: item.sectionTitle,
          items: [],
        };
        order.push(item.section);
      }
      groups[item.section].items.push(item);
    });

    return order.map((key) => groups[key]);
  }, [filteredResults]);

  // 扁平化结果列表（用于键盘导航索引）
  const flatResults = useMemo(
    () => groupedResults.flatMap((g) => g.items),
    [groupedResults],
  );

  // 打开/关闭
  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  // 跳转
  const handleSelect = useCallback(
    (item) => {
      closePalette();
      navigate(item.path);
    },
    [navigate, closePalette],
  );

  // 全局快捷键监听
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ⌘K / Ctrl+K 打开
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) {
          closePalette();
        } else {
          openPalette();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, openPalette, closePalette]);

  // 打开时自动聚焦输入框
  useEffect(() => {
    if (open && inputRef.current) {
      // 使用 setTimeout 确保 DOM 渲染完成
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // 键盘导航
  const handleInputKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        closePalette();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < flatResults.length - 1 ? prev + 1 : 0,
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : flatResults.length - 1,
        );
        return;
      }

      if (e.key === 'Enter' && flatResults[activeIndex]) {
        e.preventDefault();
        handleSelect(flatResults[activeIndex]);
      }
    },
    [flatResults, activeIndex, handleSelect, closePalette],
  );

  // 活动项滚动到视图中
  useEffect(() => {
    if (!resultsRef.current) return;
    const activeEl = resultsRef.current.querySelector(
      `[data-index="${activeIndex}"]`,
    );
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // 搜索变化时重置活动索引
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <div className='command-palette-overlay' onClick={closePalette}>
      <div
        className='command-palette-container'
        onClick={(e) => e.stopPropagation()}
      >
        {/* 搜索输入 */}
        <div className='command-palette-input-wrapper'>
          <Search size={18} strokeWidth={2} className='command-palette-search-icon' />
          <input
            ref={inputRef}
            type='text'
            className='command-palette-input'
            placeholder={t('搜索页面...')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          <kbd className='command-palette-kbd'>ESC</kbd>
        </div>

        {/* 结果列表 */}
        <div className='command-palette-results' ref={resultsRef}>
          {flatResults.length === 0 ? (
            <div className='command-palette-empty'>
              {t('没有找到匹配的页面')}
            </div>
          ) : (
            groupedResults.map((group) => (
              <div key={group.label}>
                <div className='command-palette-group-label'>{group.label}</div>
                {group.items.map((item) => {
                  const globalIndex = flatResults.indexOf(item);
                  const isActive = globalIndex === activeIndex;

                  return (
                    <div
                      key={item.path}
                      data-index={globalIndex}
                      className={`command-palette-item${isActive ? ' command-palette-item-active' : ''}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIndex(globalIndex)}
                    >
                      <div className='command-palette-item-icon'>
                        {getLucideIcon(item.key, isActive)}
                      </div>
                      <div className='command-palette-item-content'>
                        <div className='command-palette-item-title'>
                          {item.title}
                        </div>
                        {item.desc && (
                          <div className='command-palette-item-desc'>
                            {item.desc}
                          </div>
                        )}
                      </div>
                      {isActive && (
                        <span className='command-palette-enter-hint'>↵</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* 底部提示 */}
        <div className='command-palette-footer'>
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> {t('导航')}
          </span>
          <span>
            <kbd>↵</kbd> {t('跳转')}
          </span>
          <span>
            <kbd>ESC</kbd> {t('关闭')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
