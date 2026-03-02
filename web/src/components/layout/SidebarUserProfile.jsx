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
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAdmin, isRoot } from '../../helpers';

/**
 * 侧边栏底部用户简介组件
 * @param {{ collapsed: boolean }} props
 */
const SidebarUserProfile = ({ collapsed }) => {
  const { t } = useTranslation();

  const userInfo = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  if (!userInfo) return null;

  const username = userInfo.display_name || userInfo.username || '';
  const initial = username.charAt(0).toUpperCase();

  const roleLabel = isRoot()
    ? t('超级管理员')
    : isAdmin()
      ? t('管理员')
      : t('用户');

  if (collapsed) {
    return (
      <Link to='/console/personal' style={{ textDecoration: 'none' }}>
        <div
          className='sidebar-user-profile'
          style={{ justifyContent: 'center', padding: '8px 0' }}
        >
          <div className='sidebar-user-avatar'>{initial}</div>
        </div>
      </Link>
    );
  }

  return (
    <Link to='/console/personal' style={{ textDecoration: 'none' }}>
      <div className='sidebar-user-profile'>
        <div className='sidebar-user-avatar'>{initial}</div>
        <div className='sidebar-user-info'>
          <div className='sidebar-user-name'>{username}</div>
          <div className='sidebar-user-role'>{roleLabel}</div>
        </div>
      </div>
    </Link>
  );
};

export default SidebarUserProfile;
