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
import { Link, useLocation } from 'react-router-dom';

// 路径前缀映射：用于高亮当前所在区域
const PATH_PREFIX_MAP = {
  '/about': '/about',
};

const HeaderNav = ({ headerNavModules, docsLink, userState, t }) => {
  const location = useLocation();
  const isLoggedIn = !!userState?.user;
  const modules = headerNavModules || {
    home: true,
    docs: true,
    about: true,
  };

  // Define navigation items with their config keys and link targets
  const navItems = [
    {
      key: 'home',
      label: t('首页'),
      to: '/',
      external: false,
      exactMatch: true, // 首页仅精确匹配 /
    },
    {
      key: 'console',
      label: t('数据看板'),
      to: '/console',
      external: false,
      loggedInOnly: true,
    },
    {
      key: 'pricing',
      label: t('价格'),
      to: '/#pricing',
      external: false,
    },
    {
      key: 'docs',
      label: t('文档'),
      to: docsLink || '#',
      external: true,
    },
    {
      key: 'about',
      label: t('关于'),
      to: '/about',
      external: false,
    },
    {
      key: 'privacy-policy',
      label: t('隐私政策'),
      to: '/privacy-policy',
      external: false,
    },
    {
      key: 'user-agreement',
      label: t('用户协议'),
      to: '/user-agreement',
      external: false,
    },
  ];

  // Filter items based on headerNavModules config
  const filteredItems = navItems
    .filter((item) => {
      const moduleConfig = modules[item.key];
      if (item.loggedInOnly && !isLoggedIn) return false;
      if (
        item.key === 'console' ||
        item.key === 'pricing' ||
        item.key === 'privacy-policy' ||
        item.key === 'user-agreement'
      ) {
        return true;
      }
      if (moduleConfig === undefined || moduleConfig === null) return false;
      if (typeof moduleConfig === 'boolean') return moduleConfig;
      if (typeof moduleConfig === 'object')
        return moduleConfig.enabled !== false;
      return false;
    })
    .filter((item) => {
      // 过滤掉没有文档链接的 docs 项
      if (item.key === 'docs' && !docsLink) return false;
      return true;
    });

  if (filteredItems.length === 0) return <div className='flex-1' />;

  // 判断路径是否匹配（支持前缀匹配）
  const isPathActive = (item) => {
    if (item.external) return false;
    if (item.exactMatch) return location.pathname === item.to;
    // 前缀匹配：/console 匹配 /console/xxx
    return (
      location.pathname === item.to ||
      location.pathname.startsWith(item.to + '/')
    );
  };

  return (
    <nav className='flex-1 hidden md:flex items-center justify-center gap-1'>
      {filteredItems.map((item) => {
        const isActive = isPathActive(item);
        const className = `header-nav-link${isActive ? ' header-nav-link-active' : ''}`;

        if (item.external || item.key === 'pricing') {
          return (
            <a
              key={item.key}
              href={item.to}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className='header-nav-link'
            >
              {item.label}
            </a>
          );
        }

        return (
          <Link key={item.key} to={item.to} className={className}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default HeaderNav;
