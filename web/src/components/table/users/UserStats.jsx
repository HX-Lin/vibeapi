import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  DatePicker,
  Button,
  Table,
  Spin,
  Space,
  InputNumber,
  Typography,
} from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { VChart } from '@visactor/react-vchart';
import { initVChartSemiTheme } from '@visactor/vchart-semi-theme';
import { API, showError } from '../../../helpers';
import { renderQuota, renderNumber } from '../../../helpers/render';

const { Title, Text } = Typography;

const CHART_CONFIG = { autoFit: true };

const UserStats = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([]);
  const [limit, setLimit] = useState(20);

  // Data
  const [userRank, setUserRank] = useState([]);
  const [modelStats, setModelStats] = useState([]);
  const [tokenStats, setTokenStats] = useState([]);
  const [groupStats, setGroupStats] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);

  useEffect(() => {
    initVChartSemiTheme({ isWatchingThemeSwitch: true });
  }, []);

  const getTimestamps = useCallback(() => {
    let start = 0;
    let end = 0;
    if (dateRange && dateRange.length === 2) {
      start = Math.floor(dateRange[0].getTime() / 1000);
      end = Math.floor(dateRange[1].getTime() / 1000);
    }
    return { start, end };
  }, [dateRange]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { start, end } = getTimestamps();
    try {
      const [rankRes, usageRes] = await Promise.all([
        API.get(
          `/api/stats/user_rank?start_timestamp=${start}&end_timestamp=${end}&limit=${limit}`,
        ),
        API.get(
          `/api/stats/usage?start_timestamp=${start}&end_timestamp=${end}`,
        ),
      ]);

      if (rankRes.data.success) {
        setUserRank(rankRes.data.data || []);
      } else {
        showError(rankRes.data.message);
      }

      if (usageRes.data.success) {
        const d = usageRes.data.data;
        setModelStats(d.models || []);
        setTokenStats(d.tokens || []);
        setGroupStats(d.groups || []);
        setDailyStats(d.daily || []);
      } else {
        showError(usageRes.data.message);
      }
    } catch (e) {
      showError(t('请求失败'));
    } finally {
      setLoading(false);
    }
  }, [getTimestamps, limit, t]);

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // --- User Rank Table ---
  const rankColumns = [
    {
      title: t('排名'),
      dataIndex: 'rank',
      width: 70,
      render: (_, __, index) => index + 1,
    },
    { title: t('用户名'), dataIndex: 'username' },
    {
      title: t('消耗额度'),
      dataIndex: 'quota',
      render: (val) => renderQuota(val, 2),
      sorter: (a, b) => a.quota - b.quota,
    },
    {
      title: t('调用次数'),
      dataIndex: 'count',
      render: (val) => renderNumber(val),
      sorter: (a, b) => a.count - b.count,
    },
  ];

  // --- Charts ---
  const buildPieSpec = (data, title, valueField, categoryField) => {
    const total = data.reduce((s, item) => s + (item[valueField] || 0), 0);
    return {
      type: 'pie',
      data: [{ id: 'pie', values: data.length > 0 ? data : [{ [categoryField]: 'N/A', [valueField]: 0 }] }],
      outerRadius: 0.8,
      innerRadius: 0.5,
      padAngle: 0.6,
      valueField,
      categoryField,
      pie: {
        style: { cornerRadius: 10 },
        state: {
          hover: { outerRadius: 0.85, stroke: '#000', lineWidth: 1 },
        },
      },
      title: {
        visible: true,
        text: title,
        subtext:
          valueField === 'quota'
            ? `${t('总计')}：${renderQuota(total, 2)}`
            : `${t('总计')}：${renderNumber(total)}`,
      },
      legends: { visible: true, orient: 'left' },
      label: { visible: true },
      tooltip: {
        mark: {
          content: [
            {
              key: (datum) => datum[categoryField],
              value: (datum) =>
                valueField === 'quota'
                  ? renderQuota(datum[valueField], 4)
                  : renderNumber(datum[valueField]),
            },
          ],
        },
      },
    };
  };

  const dailyBarSpec = {
    type: 'bar',
    data: [{ id: 'daily', values: dailyStats }],
    xField: 'day',
    yField: 'quota',
    title: {
      visible: true,
      text: t('每日消耗分布'),
      subtext: `${t('总计')}：${renderQuota(
        dailyStats.reduce((s, d) => s + (d.quota || 0), 0),
        2,
      )}`,
    },
    bar: {
      style: { cornerRadius: [4, 4, 0, 0] },
      state: { hover: { stroke: '#000', lineWidth: 1 } },
    },
    tooltip: {
      mark: {
        content: [
          {
            key: (datum) => datum['day'],
            value: (datum) => renderQuota(datum['quota'], 4),
          },
        ],
      },
    },
  };

  const dailyCountBarSpec = {
    type: 'bar',
    data: [{ id: 'dailyCount', values: dailyStats }],
    xField: 'day',
    yField: 'count',
    title: {
      visible: true,
      text: t('每日调用次数分布'),
      subtext: `${t('总计')}：${renderNumber(
        dailyStats.reduce((s, d) => s + (d.count || 0), 0),
      )}`,
    },
    bar: {
      style: { cornerRadius: [4, 4, 0, 0] },
      state: { hover: { stroke: '#000', lineWidth: 1 } },
    },
    tooltip: {
      mark: {
        content: [
          {
            key: (datum) => datum['day'],
            value: (datum) => renderNumber(datum['count']),
          },
        ],
      },
    },
  };

  return (
    <Spin spinning={loading}>
      <div className='flex flex-col gap-4'>
        {/* Filter Bar */}
        <Card>
          <div className='flex flex-wrap items-end gap-4'>
            <div>
              <Text strong>{t('时间范围')}</Text>
              <div className='mt-1'>
                <DatePicker
                  type='dateRange'
                  density='compact'
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder={[t('开始日期'), t('结束日期')]}
                  style={{ width: 280 }}
                />
              </div>
            </div>
            <div>
              <Text strong>{t('排行数量')}</Text>
              <div className='mt-1'>
                <InputNumber
                  value={limit}
                  onChange={setLimit}
                  min={1}
                  max={100}
                  style={{ width: 100 }}
                />
              </div>
            </div>
            <Button theme='solid' onClick={fetchData}>
              {t('查询')}
            </Button>
          </div>
        </Card>

        {/* User Rank */}
        <Card title={t('用户用量排行')}>
          <Table
            columns={rankColumns}
            dataSource={userRank}
            pagination={false}
            size='small'
            rowKey='user_id'
          />
        </Card>

        {/* Daily Distribution */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <Card>
            <div style={{ height: 350 }}>
              <VChart spec={dailyBarSpec} option={CHART_CONFIG} />
            </div>
          </Card>
          <Card>
            <div style={{ height: 350 }}>
              <VChart spec={dailyCountBarSpec} option={CHART_CONFIG} />
            </div>
          </Card>
        </div>

        {/* Model / Token / Group Pie Charts */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          <Card>
            <div style={{ height: 350 }}>
              <VChart
                spec={buildPieSpec(
                  modelStats.map((m) => ({
                    name: m.model_name || 'unknown',
                    quota: m.quota,
                  })),
                  t('模型消耗占比'),
                  'quota',
                  'name',
                )}
                option={CHART_CONFIG}
              />
            </div>
          </Card>
          <Card>
            <div style={{ height: 350 }}>
              <VChart
                spec={buildPieSpec(
                  tokenStats.map((tk) => ({
                    name: tk.token_name || 'unknown',
                    quota: tk.quota,
                  })),
                  t('令牌消耗占比'),
                  'quota',
                  'name',
                )}
                option={CHART_CONFIG}
              />
            </div>
          </Card>
          <Card>
            <div style={{ height: 350 }}>
              <VChart
                spec={buildPieSpec(
                  groupStats.map((g) => ({
                    name: g.group || 'default',
                    quota: g.quota,
                  })),
                  t('分组消耗占比'),
                  'quota',
                  'name',
                )}
                option={CHART_CONFIG}
              />
            </div>
          </Card>
        </div>

        {/* Call count pie charts */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          <Card>
            <div style={{ height: 350 }}>
              <VChart
                spec={buildPieSpec(
                  modelStats.map((m) => ({
                    name: m.model_name || 'unknown',
                    count: m.count,
                  })),
                  t('模型调用次数占比'),
                  'count',
                  'name',
                )}
                option={CHART_CONFIG}
              />
            </div>
          </Card>
          <Card>
            <div style={{ height: 350 }}>
              <VChart
                spec={buildPieSpec(
                  tokenStats.map((tk) => ({
                    name: tk.token_name || 'unknown',
                    count: tk.count,
                  })),
                  t('令牌调用次数占比'),
                  'count',
                  'name',
                )}
                option={CHART_CONFIG}
              />
            </div>
          </Card>
          <Card>
            <div style={{ height: 350 }}>
              <VChart
                spec={buildPieSpec(
                  groupStats.map((g) => ({
                    name: g.group || 'default',
                    count: g.count,
                  })),
                  t('分组调用次数占比'),
                  'count',
                  'name',
                )}
                option={CHART_CONFIG}
              />
            </div>
          </Card>
        </div>
      </div>
    </Spin>
  );
};

export default UserStats;
