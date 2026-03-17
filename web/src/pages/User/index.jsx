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

import React, { lazy, Suspense, useState } from 'react';
import { TabPane, Tabs } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { Users, BarChart3 } from 'lucide-react';
import UsersTable from '../../components/table/users';
import Loading from '../../components/common/ui/Loading';

const UserStats = lazy(() =>
  import('../../components/table/users/UserStats'),
);

const User = () => {
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState('users');

  return (
    <div className='mt-[60px] px-2'>
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        type='line'
        style={{ marginBottom: 16 }}
      >
        <TabPane
          tab={
            <span className='flex items-center gap-1'>
              <Users size={16} />
              {t('用户列表')}
            </span>
          }
          itemKey='users'
        >
          <UsersTable />
        </TabPane>
        <TabPane
          tab={
            <span className='flex items-center gap-1'>
              <BarChart3 size={16} />
              {t('统计分析')}
            </span>
          }
          itemKey='stats'
        >
          <Suspense fallback={<Loading />}>
            <UserStats />
          </Suspense>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default User;
