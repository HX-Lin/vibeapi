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

import React, { useCallback, useContext, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@douyinfe/semi-ui';
import { LogOut } from 'lucide-react';
import { API } from '../../helpers/api';
import { isAdmin, isRoot, showSuccess } from '../../helpers/utils';
import { UserContext } from '../../context/User';

/**
 * 侧边栏底部用户简介组件
 * @param {{ collapsed: boolean }} props
 */
const SidebarUserProfile = ({ collapsed }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [, userDispatch] = useContext(UserContext);

  const userInfo = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const handleLogout = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await API.get('/api/user/logout');
    showSuccess(t('注销成功!'));
    userDispatch({ type: 'logout' });
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate, t, userDispatch]);

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
      <div className='sidebar-user-profile' style={{ justifyContent: 'center', padding: '8px 0', flexDirection: 'column', gap: '8px' }}>
        <Link to='/console/personal' style={{ textDecoration: 'none' }}>
          <div className='sidebar-user-avatar'>{initial}</div>
        </Link>
        <Tooltip content={t('退出')} position='right'>
          <button
            onClick={handleLogout}
            className='flex items-center justify-center w-7 h-7 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
            title={t('退出')}
          >
            <LogOut size={14} className='text-gray-400 hover:text-red-500 transition-colors' />
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className='sidebar-user-profile'>
      <Link to='/console/personal' style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        <div className='sidebar-user-avatar'>{initial}</div>
        <div className='sidebar-user-info'>
          <div className='sidebar-user-name'>{username}</div>
          <div className='sidebar-user-role'>{roleLabel}</div>
        </div>
      </Link>
      <Tooltip content={t('退出')} position='top'>
        <button
          onClick={handleLogout}
          className='flex items-center justify-center w-7 h-7 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0'
          title={t('退出')}
        >
          <LogOut size={14} className='text-gray-400 hover:text-red-500 transition-colors' />
        </button>
      </Tooltip>
    </div>
  );
};

export default SidebarUserProfile;
