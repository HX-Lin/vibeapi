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

// 路径前缀映射：用于高亮当前所在区域
const PATH_PREFIX_MAP = {
  '/about': '/about',
};

const HeaderNav = ({ headerNavModules, docsLink, t }) => {
  const location = useLocation();

  if (!headerNavModules) return <div className='flex-1' />;

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
  ];

  // Filter items based on headerNavModules config
  const filteredItems = useMemo(() => {
    return navItems
      .filter((item) => {
        const moduleConfig = headerNavModules[item.key];
        if (moduleConfig === undefined || moduleConfig === null) return false;
        if (typeof moduleConfig === 'boolean') return moduleConfig;
        if (typeof moduleConfig === 'object') return moduleConfig.enabled !== false;
        return false;
      })
      .filter((item) => {
        // 过滤掉没有文档链接的 docs 项
        if (item.key === 'docs' && !docsLink) return false;
        return true;
      });
  }, [headerNavModules, docsLink]);

  if (filteredItems.length === 0) return <div className='flex-1' />;

  // 判断路径是否匹配（支持前缀匹配）
  const isPathActive = (item) => {
    if (item.external) return false;
    if (item.exactMatch) return location.pathname === item.to;
    // 前缀匹配：/console 匹配 /console/xxx
    return location.pathname === item.to ||
      location.pathname.startsWith(item.to + '/');
  };

  return (
    <nav className='flex-1 hidden md:flex items-center justify-center gap-1'>
      {filteredItems.map((item) => {
        const isActive = isPathActive(item);
        const className = `header-nav-link${isActive ? ' header-nav-link-active' : ''}`;

        if (item.external) {
          return (
            <a
              key={item.key}
              href={item.to}
              target='_blank'
              rel='noopener noreferrer'
              className='header-nav-link'
            >
              {item.label}
            </a>
          );
        }

        return (
          <Link
            key={item.key}
            to={item.to}
            className={className}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default HeaderNav;
