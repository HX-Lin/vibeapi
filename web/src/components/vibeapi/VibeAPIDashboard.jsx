import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Table,
  Tag,
  Button,
  Spin,
  Empty,
  Typography,
  Tooltip,
  Banner,
} from '@douyinfe/semi-ui';
import {
  Activity,
  Server,
  Users,
  BarChart3,
  ScrollText,
  RefreshCw,
  Circle,
  ArrowUpRight,
  Clock,
  Zap,
  Globe,
  UserCheck,
  Shield,
  ShieldOff,
} from 'lucide-react';
import { API, showError, showSuccess } from '../../helpers';
import { renderQuota } from '../../helpers/render';

const { Text, Title } = Typography;

const VibeAPIDashboard = () => {
  const { t } = useTranslation();

  // Status
  const [statusData, setStatusData] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Accounts
  const [accountsData, setAccountsData] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);

  // Token stats
  const [tokenStats, setTokenStats] = useState(null);
  const [tokenStatsLoading, setTokenStatsLoading] = useState(false);
  const [tokenStatsLoaded, setTokenStatsLoaded] = useState(false);

  // Logs
  const [logsData, setLogsData] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);

  // User usage
  const [userUsageData, setUserUsageData] = useState([]);
  const [userUsageLoading, setUserUsageLoading] = useState(false);
  const [userUsageLoaded, setUserUsageLoaded] = useState(false);
  const [provisioningUserId, setProvisioningUserId] = useState(null);

  // Active panel
  const [activePanel, setActivePanel] = useState('usage');

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await API.get('/api/vibeapi/status');
      if (res.data.success) {
        setStatusData(res.data.data);
      }
    } catch (e) {
      showError(t('连接失败'));
    } finally {
      setStatusLoading(false);
    }
  }, [t]);

  const loadAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const res = await API.get('/api/vibeapi/accounts');
      if (res.status === 200) {
        const data = res.data;
        setAccountsData(Array.isArray(data) ? data : data?.data || []);
      }
    } catch (e) {
      setAccountsData([]);
    } finally {
      setAccountsLoading(false);
      setAccountsLoaded(true);
    }
  }, []);

  const loadTokenStats = useCallback(async () => {
    setTokenStatsLoading(true);
    try {
      const res = await API.get(
        '/api/vibeapi/stats/tokens/summary?hours=24',
      );
      if (res.status === 200) {
        setTokenStats(res.data?.data || res.data || null);
      }
    } catch (e) {
      setTokenStats(null);
    } finally {
      setTokenStatsLoading(false);
      setTokenStatsLoaded(true);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await API.get('/api/vibeapi/logs?limit=50');
      if (res.status === 200) {
        const data = res.data;
        setLogsData(Array.isArray(data) ? data : data?.data || []);
      }
    } catch (e) {
      setLogsData([]);
    } finally {
      setLogsLoading(false);
      setLogsLoaded(true);
    }
  }, []);

  const loadUserUsage = useCallback(async () => {
    setUserUsageLoading(true);
    try {
      const res = await API.get('/api/vibeapi/user-usage');
      if (res.data?.success) {
        setUserUsageData(res.data.data || []);
      }
    } catch (e) {
      setUserUsageData([]);
    } finally {
      setUserUsageLoading(false);
      setUserUsageLoaded(true);
    }
  }, []);

  const provisionUser = useCallback(async (userId) => {
    setProvisioningUserId(userId);
    try {
      const res = await API.post(`/api/vibeapi/provision/${userId}`);
      if (res.data?.success) {
        showSuccess(t('操作成功'));
        loadUserUsage();
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch (e) {
      showError(t('操作失败'));
    } finally {
      setProvisioningUserId(null);
    }
  }, [t, loadUserUsage]);

  const provisionAll = useCallback(async () => {
    try {
      const res = await API.post('/api/vibeapi/provision-all');
      if (res.data?.success) {
        showSuccess(t('操作成功'));
      } else {
        showError(res.data?.message || t('操作失败'));
      }
    } catch (e) {
      showError(t('操作失败'));
    }
  }, [t]);

  useEffect(() => {
    loadStatus();
    loadUserUsage();
  }, [loadStatus, loadUserUsage]);

  const handlePanelSwitch = (panel) => {
    setActivePanel(panel);
    if (panel === 'accounts' && !accountsLoaded) loadAccounts();
    if (panel === 'tokens' && !tokenStatsLoaded) loadTokenStats();
    if (panel === 'logs' && !logsLoaded) loadLogs();
    if (panel === 'usage' && !userUsageLoaded) loadUserUsage();
  };

  const refreshAll = async () => {
    loadStatus();
    if (activePanel === 'accounts') loadAccounts();
    if (activePanel === 'tokens') loadTokenStats();
    if (activePanel === 'logs') loadLogs();
    if (activePanel === 'usage') loadUserUsage();
  };

  // Derived stats
  const activeAccountCount = useMemo(
    () => accountsData.filter((a) => a.status === 'active').length,
    [accountsData],
  );

  const tokenStatsEntries = useMemo(() => {
    if (!tokenStats) return [];
    return Object.entries(tokenStats).map(([key, value]) => ({
      key,
      value: typeof value === 'number' ? value.toLocaleString() : String(value),
      rawValue: value,
    }));
  }, [tokenStats]);

  const successRate = useMemo(() => {
    if (logsData.length === 0) return null;
    const successCount = logsData.filter(
      (log) => log.status_code >= 200 && log.status_code < 300,
    ).length;
    return ((successCount / logsData.length) * 100).toFixed(1);
  }, [logsData]);

  const avgLatency = useMemo(() => {
    if (logsData.length === 0) return null;
    const latencies = logsData
      .filter((log) => log.latency)
      .map((log) => log.latency);
    if (latencies.length === 0) return null;
    return Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  }, [logsData]);

  // --- Status indicator dot ---
  const connectionColor = statusData?.connected
    ? '#10b981'
    : statusData?.enabled
      ? '#ef4444'
      : '#9ca3af';
  const connectionText = statusData?.connected
    ? t('连接正常')
    : statusData?.enabled
      ? t('连接失败')
      : t('已停止');

  // --- Stat cards ---
  const statCards = [
    {
      icon: <Activity size={18} />,
      label: t('连接状态'),
      value: connectionText,
      color: connectionColor,
      bgClass: 'bg-gradient-to-br from-emerald-50 to-teal-50',
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
    {
      icon: <Server size={18} />,
      label: t('启用状态'),
      value: statusData?.enabled ? t('运行中') : t('已停止'),
      color: statusData?.enabled ? '#3b82f6' : '#9ca3af',
      bgClass: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      icon: <Users size={18} />,
      label: t('活跃账号'),
      value: accountsLoaded ? `${activeAccountCount}` : '-',
      color: '#8b5cf6',
      bgClass: 'bg-gradient-to-br from-violet-50 to-purple-50',
      iconBg: 'bg-violet-100 text-violet-600',
    },
    {
      icon: <Zap size={18} />,
      label: t('延迟'),
      value: avgLatency !== null ? `${avgLatency}ms` : '-',
      color: '#f59e0b',
      bgClass: 'bg-gradient-to-br from-amber-50 to-yellow-50',
      iconBg: 'bg-amber-100 text-amber-600',
    },
  ];

  // --- Table columns ---
  const accountColumns = [
    {
      title: t('邮箱'),
      dataIndex: 'email',
      key: 'email',
      render: (text) => (
        <Text strong style={{ fontSize: 13 }}>
          {text}
        </Text>
      ),
    },
    {
      title: t('提供商'),
      dataIndex: 'provider',
      key: 'provider',
      render: (text) => (
        <Tag size='small' shape='circle' color='blue'>
          {text}
        </Tag>
      ),
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        <div className='flex items-center gap-1.5'>
          <Circle
            size={8}
            fill={text === 'active' ? '#10b981' : '#ef4444'}
            stroke='none'
          />
          <Text
            type={text === 'active' ? 'success' : 'danger'}
            style={{ fontSize: 13 }}
          >
            {text === 'active' ? t('运行中') : t('已停止')}
          </Text>
        </div>
      ),
    },
    {
      title: t('配额'),
      dataIndex: 'quota',
      key: 'quota',
      render: (text) => (
        <Text style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          {text}
        </Text>
      ),
    },
  ];

  const logColumns = [
    {
      title: t('时间'),
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (text) => (
        <div className='flex items-center gap-1.5'>
          <Clock size={12} className='text-gray-400 flex-shrink-0' />
          <Text style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
            {text ? new Date(text).toLocaleString() : '-'}
          </Text>
        </div>
      ),
    },
    {
      title: t('模型'),
      dataIndex: 'model',
      key: 'model',
      render: (text) => (
        <Tag size='small' shape='circle' color='violet'>
          {text}
        </Tag>
      ),
    },
    {
      title: t('状态码'),
      dataIndex: 'status_code',
      key: 'status_code',
      width: 100,
      align: 'center',
      render: (text) => {
        const isOk = text >= 200 && text < 300;
        return (
          <Tag
            size='small'
            shape='circle'
            color={isOk ? 'green' : 'red'}
            type={isOk ? 'light' : 'solid'}
          >
            {text}
          </Tag>
        );
      },
    },
    {
      title: t('延迟'),
      dataIndex: 'latency',
      key: 'latency',
      width: 100,
      align: 'right',
      render: (text) => {
        if (!text) return <Text type='tertiary'>-</Text>;
        const color = text < 500 ? '#10b981' : text < 2000 ? '#f59e0b' : '#ef4444';
        return (
          <Text
            style={{
              fontSize: 13,
              fontVariantNumeric: 'tabular-nums',
              color,
              fontWeight: 500,
            }}
          >
            {text}ms
          </Text>
        );
      },
    },
  ];

  // --- Panel nav items ---
  const panelNavItems = [
    {
      key: 'usage',
      icon: <UserCheck size={15} />,
      label: t('用户用量'),
    },
    {
      key: 'accounts',
      icon: <Users size={15} />,
      label: t('账号管理'),
    },
    {
      key: 'tokens',
      icon: <BarChart3 size={15} />,
      label: t('Token 统计'),
    },
    {
      key: 'logs',
      icon: <ScrollText size={15} />,
      label: t('请求日志'),
    },
  ];

  const isAnyLoading =
    statusLoading || accountsLoading || tokenStatsLoading || logsLoading || userUsageLoading;

  // --- User usage columns ---
  const userUsageColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      render: (text) => (
        <Text style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          {text}
        </Text>
      ),
    },
    {
      title: t('用户名'),
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {record.display_name || text}
          </Text>
          {record.display_name && record.display_name !== text && (
            <Text type='tertiary' style={{ fontSize: 11, display: 'block' }}>
              @{text}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: t('分组'),
      dataIndex: 'group',
      key: 'group',
      width: 100,
      render: (text) => (
        <Tag size='small' shape='circle' color='blue'>
          {text || 'default'}
        </Tag>
      ),
    },
    {
      title: t('状态'),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (val) => (
        <div className='flex items-center gap-1.5'>
          <Circle
            size={8}
            fill={val === 1 ? '#10b981' : '#ef4444'}
            stroke='none'
          />
          <Text
            type={val === 1 ? 'success' : 'danger'}
            style={{ fontSize: 13 }}
          >
            {val === 1 ? t('启用') : t('禁用')}
          </Text>
        </div>
      ),
    },
    {
      title: t('已用额度'),
      dataIndex: 'used_quota',
      key: 'used_quota',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.used_quota - b.used_quota,
      render: (text) => (
        <Text style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: '#ef4444' }}>
          {renderQuota(text)}
        </Text>
      ),
    },
    {
      title: t('剩余额度'),
      dataIndex: 'quota',
      key: 'quota',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.quota - b.quota,
      render: (text) => (
        <Text style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: '#10b981', fontWeight: 500 }}>
          {renderQuota(text)}
        </Text>
      ),
    },
    {
      title: t('请求次数'),
      dataIndex: 'request_count',
      key: 'request_count',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.request_count - b.request_count,
      render: (text) => (
        <Text style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          {(text || 0).toLocaleString()}
        </Text>
      ),
    },
    {
      title: t('上游令牌'),
      dataIndex: 'has_upstream_token',
      key: 'has_upstream_token',
      width: 120,
      align: 'center',
      filters: [
        { text: t('已分配'), value: true },
        { text: t('未分配'), value: false },
      ],
      onFilter: (value, record) => record.has_upstream_token === value,
      render: (val, record) => (
        <div className='flex items-center justify-center gap-1.5'>
          {val ? (
            <Tag size='small' shape='circle' color='green' type='light'>
              <div className='flex items-center gap-1'>
                <Shield size={11} />
                {t('已分配')}
              </div>
            </Tag>
          ) : (
            <Tooltip content={t('点击分配上游令牌')}>
              <Button
                size='small'
                theme='borderless'
                type='warning'
                icon={<ShieldOff size={13} />}
                loading={provisioningUserId === record.id}
                onClick={() => provisionUser(record.id)}
                className='!rounded-lg'
              >
                {t('分配')}
              </Button>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className='space-y-4'>
      {/* ===== Header ===== */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center'>
            <Globe size={18} className='text-white' />
          </div>
          <div>
            <Title heading={5} style={{ marginBottom: 0 }}>
              {t('VibeAPI 管理')}
            </Title>
            {statusData?.upstream_url && (
              <Text
                type='tertiary'
                style={{ fontSize: 12 }}
              >
                {statusData.upstream_url}
              </Text>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {/* Connection status pill */}
          <div
            className='flex items-center gap-1.5 px-3 py-1 rounded-full'
            style={{
              backgroundColor: `${connectionColor}15`,
              border: `1px solid ${connectionColor}30`,
            }}
          >
            <Circle size={7} fill={connectionColor} stroke='none' />
            <Text style={{ fontSize: 12, color: connectionColor, fontWeight: 500 }}>
              {connectionText}
            </Text>
          </div>
          <Tooltip content={t('刷新')}>
            <Button
              theme='borderless'
              type='tertiary'
              icon={<RefreshCw size={15} />}
              onClick={refreshAll}
              loading={isAnyLoading}
              className='!rounded-lg'
            />
          </Tooltip>
        </div>
      </div>

      {/* ===== Disabled banner ===== */}
      {statusData && !statusData.enabled && (
        <Banner
          type='warning'
          description={t('VibeAPI upstream is not enabled')}
          closeIcon={null}
        />
      )}

      {/* ===== Stat cards ===== */}
      <Spin spinning={statusLoading}>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
          {statCards.map((card, idx) => (
            <div
              key={idx}
              className={`${card.bgClass} rounded-xl p-4 border border-transparent transition-all duration-200 hover:shadow-sm`}
            >
              <div className='flex items-start justify-between mb-3'>
                <div
                  className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center`}
                >
                  {card.icon}
                </div>
                <ArrowUpRight size={14} className='text-gray-300' />
              </div>
              <Text
                type='tertiary'
                style={{ fontSize: 12, display: 'block', marginBottom: 2 }}
              >
                {card.label}
              </Text>
              <Text
                strong
                style={{
                  fontSize: 18,
                  color: card.color,
                  display: 'block',
                  lineHeight: 1.3,
                }}
              >
                {card.value}
              </Text>
            </div>
          ))}
        </div>
      </Spin>

      {/* ===== Content area ===== */}
      <Card
        shadows=''
        bordered={true}
        headerLine={false}
        className='!rounded-xl'
        title={
          <div className='flex items-center gap-1'>
            {panelNavItems.map((item) => (
              <Button
                key={item.key}
                theme={activePanel === item.key ? 'solid' : 'borderless'}
                type={activePanel === item.key ? 'primary' : 'tertiary'}
                size='small'
                icon={item.icon}
                onClick={() => handlePanelSwitch(item.key)}
                className='!rounded-lg'
              >
                {item.label}
              </Button>
            ))}
          </div>
        }
        headerExtraContent={
          <Button
            theme='borderless'
            type='tertiary'
            size='small'
            icon={<RefreshCw size={14} />}
            onClick={() => {
              if (activePanel === 'accounts') loadAccounts();
              if (activePanel === 'tokens') loadTokenStats();
              if (activePanel === 'logs') loadLogs();
              if (activePanel === 'usage') loadUserUsage();
            }}
            loading={
              (activePanel === 'accounts' && accountsLoading) ||
              (activePanel === 'tokens' && tokenStatsLoading) ||
              (activePanel === 'logs' && logsLoading) ||
              (activePanel === 'usage' && userUsageLoading)
            }
            className='!rounded-lg'
          >
            {t('刷新')}
          </Button>
        }
      >
        {/* --- User usage panel --- */}
        {activePanel === 'usage' && (
          <Spin spinning={userUsageLoading}>
            {userUsageData.length > 0 ? (
              <>
                <div className='flex items-center justify-between mb-3'>
                  <Text type='secondary' style={{ fontSize: 13 }}>
                    {t('共')} {userUsageData.length} {t('个用户')}
                    {' / '}
                    {userUsageData.filter((u) => u.has_upstream_token).length} {t('已分配令牌')}
                  </Text>
                  <Tooltip content={t('为所有未分配令牌的用户批量分配')}>
                    <Button
                      size='small'
                      type='warning'
                      theme='light'
                      onClick={provisionAll}
                      className='!rounded-lg'
                    >
                      {t('批量分配')}
                    </Button>
                  </Tooltip>
                </div>
                <Table
                  columns={userUsageColumns}
                  dataSource={userUsageData}
                  rowKey='id'
                  pagination={{ pageSize: 20 }}
                  size='small'
                  empty={<Empty description={t('暂无数据')} />}
                />
              </>
            ) : (
              <Empty
                description={t('暂无数据')}
                style={{ padding: '40px 0' }}
              />
            )}
          </Spin>
        )}

        {/* --- Accounts panel --- */}
        {activePanel === 'accounts' && (
          <Spin spinning={accountsLoading}>
            {accountsData.length > 0 ? (
              <Table
                columns={accountColumns}
                dataSource={accountsData}
                pagination={{ pageSize: 10 }}
                size='small'
                empty={<Empty description={t('暂无数据')} />}
              />
            ) : (
              <Empty
                description={t('暂无数据')}
                style={{ padding: '40px 0' }}
              />
            )}
          </Spin>
        )}

        {/* --- Token stats panel --- */}
        {activePanel === 'tokens' && (
          <Spin spinning={tokenStatsLoading}>
            {tokenStatsEntries.length > 0 ? (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                {tokenStatsEntries.map((entry) => (
                  <div
                    key={entry.key}
                    className='flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'
                  >
                    <Text type='secondary' style={{ fontSize: 13 }}>
                      {entry.key}
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: 15,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {entry.value}
                    </Text>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                description={t('暂无数据')}
                style={{ padding: '40px 0' }}
              />
            )}
            {successRate !== null && logsLoaded && (
              <div className='mt-4 flex items-center gap-4 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100'>
                <div className='flex items-center gap-1.5'>
                  <Activity size={14} className='text-blue-500' />
                  <Text style={{ fontSize: 12, color: '#3b82f6' }}>
                    {t('请求日志')}: {t('成功率')} {successRate}%
                  </Text>
                </div>
                {avgLatency !== null && (
                  <div className='flex items-center gap-1.5'>
                    <Zap size={14} className='text-amber-500' />
                    <Text style={{ fontSize: 12, color: '#f59e0b' }}>
                      {t('延迟')}: {avgLatency}ms
                    </Text>
                  </div>
                )}
              </div>
            )}
          </Spin>
        )}

        {/* --- Logs panel --- */}
        {activePanel === 'logs' && (
          <Spin spinning={logsLoading}>
            {logsData.length > 0 ? (
              <Table
                columns={logColumns}
                dataSource={logsData}
                pagination={{ pageSize: 20 }}
                size='small'
                empty={<Empty description={t('暂无数据')} />}
              />
            ) : (
              <Empty
                description={t('暂无数据')}
                style={{ padding: '40px 0' }}
              />
            )}
          </Spin>
        )}
      </Card>
    </div>
  );
};

export default VibeAPIDashboard;
