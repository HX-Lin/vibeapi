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
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card, Tag, Typography } from '@douyinfe/semi-ui';
import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Mail,
  Route,
  ShieldCheck,
} from 'lucide-react';
import { API, getLogo, getSystemName } from '../../helpers';
import { StatusContext } from '../../context/Status';
import LazyMarkdownRenderer from '../../components/common/markdown/LazyMarkdownRenderer';
import {
  PUBLIC_PRICING_ANCHOR,
  getPublicSupportEmail,
  getPublicSupportMailto,
} from '../../lib/publicCompliance';

const { Title, Text } = Typography;

const isValidUrl = (value) => {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isHtmlContent = (value) => /<\/?[a-z][\s\S]*>/i.test(value || '');

const normalizeFeatures = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const parseLandingPricingTable = (raw) => {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const name = typeof item.name === 'string' ? item.name.trim() : '';
        const price = typeof item.price === 'string' ? item.price.trim() : '';
        const description =
          typeof item.description === 'string' ? item.description.trim() : '';
        const cta = typeof item.cta === 'string' ? item.cta.trim() : '';
        const features = normalizeFeatures(item.features);

        if (!name || !price || !description) return null;
        return { name, price, description, features, cta };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

const buildDefaultPricingRows = (t) => [
  {
    name: t('自托管平台'),
    price: t('$0/月'),
    description: t('自行部署网关，无平台订阅费。'),
    features: [
      t('支持自带上游供应商密钥'),
      t('基础用量分析和访问控制'),
      t('AGPL 社区版本可用'),
    ],
    cta: t('开源可用'),
  },
  {
    name: t('按量 AI 额度'),
    price: t('$0.002 / 1K tokens'),
    description: t('按模型调用消耗额度，使用前展示详细模型价格。'),
    features: [
      t('预设充值包可从 10 额度开始'),
      t('启用 Stripe 时最低充值 $1'),
      t('模型广场展示详细模型价格'),
    ],
    cta: t('默认费率'),
  },
  {
    name: t('托管服务与企业方案'),
    price: t('定制报价'),
    description: t('适合需要托管部署、专属路由、合规支持和团队入门的组织。'),
    features: [
      t('生产流量可协商阶梯价格'),
      t('优先支持和部署指导'),
      t('可按业务需求定制条款'),
    ],
    cta: t('团队适用'),
  },
];

const Landing = () => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const [homeContent, setHomeContent] = useState('');
  const [homeContentLoaded, setHomeContentLoaded] = useState(false);
  const status = statusState?.status || {};
  const systemName = getSystemName();
  const logo = getLogo();
  const supportEmail = getPublicSupportEmail(status);
  const supportMailto = getPublicSupportMailto(supportEmail);
  const canRegister =
    !status?.self_use_mode_enabled && status?.register_enabled !== false;

  const pricingRows = useMemo(() => {
    const configuredRows = parseLandingPricingTable(
      status?.landing_pricing_table,
    );
    return configuredRows.length > 0
      ? configuredRows
      : buildDefaultPricingRows(t);
  }, [status?.landing_pricing_table, t]);

  const featureItems = useMemo(
    () => [
      {
        title: t('统一模型路由'),
        desc: t('通过一个 OpenAI 兼容网关连接多个上游 AI 供应商。'),
        icon: <Route size={22} />,
      },
      {
        title: t('访问与预算控制'),
        desc: t('创建密钥、分配用户分组、设置倍率和限流，控制团队成本。'),
        icon: <ShieldCheck size={22} />,
      },
      {
        title: t('用量分析与计费可见性'),
        desc: t('集中查看请求日志、Token 用量、模型成本和充值记录。'),
        icon: <BarChart3 size={22} />,
      },
    ],
    [t],
  );

  useEffect(() => {
    let mounted = true;
    API.get('/api/home_page_content')
      .then((res) => {
        if (!mounted) return;
        const { success, data } = res.data || {};
        setHomeContent(success && typeof data === 'string' ? data.trim() : '');
      })
      .catch(() => {
        if (mounted) setHomeContent('');
      })
      .finally(() => {
        if (mounted) setHomeContentLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const renderCustomHomeContent = () => {
    if (!homeContentLoaded || !homeContent) return null;
    if (isValidUrl(homeContent)) {
      return (
        <iframe
          src={homeContent}
          title={t('自定义首页内容')}
          className='w-full h-[520px] rounded-lg border border-semi-color-border bg-white'
        />
      );
    }
    if (isHtmlContent(homeContent)) {
      return (
        <div
          className='landing-custom-content'
          dangerouslySetInnerHTML={{ __html: homeContent }}
        />
      );
    }
    return (
      <div className='landing-custom-content'>
        <LazyMarkdownRenderer content={homeContent} />
      </div>
    );
  };

  const customHomeContent = renderCustomHomeContent();

  return (
    <main className='classic-landing min-h-screen bg-semi-color-bg-0 pt-16'>
      <section className='px-4 py-16 md:py-20'>
        <div className='mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]'>
          <div>
            <div className='mb-5 flex items-center gap-3'>
              <img
                src={logo}
                alt={systemName}
                className='h-11 w-11 rounded-lg object-contain'
              />
              <Tag color='blue' shape='circle'>
                {t('AI API 网关')}
              </Tag>
            </div>
            <Title heading={1} className='!mb-4 !text-4xl md:!text-5xl'>
              {t('{{systemName}} 帮助团队可控地运营 AI API', {
                systemName,
              })}
            </Title>
            <Text className='block max-w-2xl !text-base !leading-7 !text-semi-color-text-1 md:!text-lg'>
              {t(
                '为开发者、AI 产品团队和平台运营者提供统一模型路由、API 密钥管理、访问控制、用量观测和计费可见性。',
              )}
            </Text>
            <div className='mt-8 flex flex-wrap gap-3'>
              {canRegister && (
                <Link to='/register'>
                  <Button type='primary' size='large'>
                    {t('注册账号')}
                  </Button>
                </Link>
              )}
              <a href={`#${PUBLIC_PRICING_ANCHOR}`}>
                <Button size='large'>{t('查看价格')}</Button>
              </a>
              <Link to='/login'>
                <Button theme='borderless' size='large'>
                  {t('登录')}
                </Button>
              </Link>
            </div>
            <div className='mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-semi-color-text-2'>
              <a
                href={supportMailto}
                className='inline-flex items-center gap-1.5 text-semi-color-primary hover:underline'
              >
                <Mail size={16} />
                {supportEmail}
              </a>
              <Link
                to='/privacy-policy'
                className='hover:text-semi-color-primary'
              >
                {t('隐私政策')}
              </Link>
              <Link
                to='/user-agreement'
                className='hover:text-semi-color-primary'
              >
                {t('用户协议')}
              </Link>
            </div>
          </div>

          <Card className='rounded-lg border border-semi-color-border shadow-sm'>
            <div className='space-y-5'>
              {featureItems.map((item) => (
                <div key={item.title} className='flex gap-4'>
                  <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-semi-color-primary-light-default text-semi-color-primary'>
                    {item.icon}
                  </div>
                  <div>
                    <div className='font-semibold text-semi-color-text-0'>
                      {item.title}
                    </div>
                    <div className='mt-1 text-sm leading-6 text-semi-color-text-2'>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section id={PUBLIC_PRICING_ANCHOR} className='px-4 py-14'>
        <div className='mx-auto max-w-6xl'>
          <div className='mb-8 max-w-2xl'>
            <Text className='!text-xs !font-semibold !uppercase !tracking-wider !text-semi-color-text-2'>
              {t('公开价格')}
            </Text>
            <Title heading={2} className='!mb-3 !mt-2'>
              {t('注册前即可查看价格')}
            </Title>
            <Text className='!text-base !leading-7 !text-semi-color-text-1'>
              {t(
                '平台支持自托管、按量额度和企业托管方案。管理员也可以在系统设置中配置入口页价格表。',
              )}
            </Text>
          </div>

          <div className='grid gap-4 md:grid-cols-3'>
            {pricingRows.map((row) => (
              <Card
                key={row.name}
                className='rounded-lg border border-semi-color-border'
              >
                <div className='flex h-full flex-col'>
                  <div>
                    <div className='flex items-start justify-between gap-3'>
                      <Title heading={4} className='!mb-1'>
                        {row.name}
                      </Title>
                      {row.cta && (
                        <Tag color='green' shape='circle'>
                          {row.cta}
                        </Tag>
                      )}
                    </div>
                    <div className='mt-3 font-mono text-2xl font-semibold text-semi-color-text-0'>
                      {row.price}
                    </div>
                    <Text className='mt-3 block !text-sm !leading-6 !text-semi-color-text-2'>
                      {row.description}
                    </Text>
                  </div>
                  <div className='mt-5 space-y-2'>
                    {row.features.map((feature) => (
                      <div key={feature} className='flex gap-2 text-sm'>
                        <CheckCircle2
                          size={16}
                          className='mt-0.5 shrink-0 text-green-500'
                        />
                        <span className='text-semi-color-text-1'>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className='px-4 py-14'>
        <div className='mx-auto grid max-w-6xl gap-4 md:grid-cols-3'>
          <Card className='rounded-lg border border-semi-color-border'>
            <KeyRound className='mb-3 text-semi-color-primary' size={24} />
            <Title heading={4}>{t('目标用户')}</Title>
            <Text className='block !text-sm !leading-6 !text-semi-color-text-2'>
              {t(
                '适合构建 AI 应用的开发者、管理多模型平台的运营者，以及关注成本和可靠性的团队。',
              )}
            </Text>
          </Card>
          <Card className='rounded-lg border border-semi-color-border'>
            <CreditCard className='mb-3 text-semi-color-primary' size={24} />
            <Title heading={4}>{t('注册方式')}</Title>
            <Text className='block !text-sm !leading-6 !text-semi-color-text-2'>
              {t(
                '点击右上角登录或注册。注册后可创建 API 密钥、选择模型并查看用量。',
              )}
            </Text>
          </Card>
          <Card className='rounded-lg border border-semi-color-border'>
            <Mail className='mb-3 text-semi-color-primary' size={24} />
            <Title heading={4}>{t('客服支持')}</Title>
            <Text className='block !text-sm !leading-6 !text-semi-color-text-2'>
              {t('如需协助选择方案或了解企业部署，请联系')}{' '}
              <a
                href={supportMailto}
                className='text-semi-color-primary hover:underline'
              >
                {supportEmail}
              </a>
              。
            </Text>
          </Card>
        </div>
      </section>

      {customHomeContent && (
        <section className='px-4 py-14'>
          <div className='mx-auto max-w-6xl'>
            <Card className='rounded-lg border border-semi-color-border'>
              {customHomeContent}
            </Card>
          </div>
        </section>
      )}
    </main>
  );
};

export default Landing;
