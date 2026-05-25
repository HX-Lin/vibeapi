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

import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusContext } from '../../context/Status';
import { getLogo, getSystemName } from '../../helpers';
import {
  Layers,
  Shield,
  Zap,
  Globe,
  Command,
  Scale,
  ExternalLink,
} from 'lucide-react';

const About = () => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);

  const systemName = getSystemName() || 'vibeapi';
  const logo = getLogo();
  const version = statusState?.status?.version || '';
  const docsLink = localStorage.getItem('docs_link') || '';

  const features = useMemo(
    () => [
      {
        icon: <Layers size={20} strokeWidth={2} />,
        title: t('多供应商聚合'),
        desc: t('支持 40+ 主流 AI 供应商，统一 API 接口调用'),
      },
      {
        icon: <Shield size={20} strokeWidth={2} />,
        title: t('安全可靠'),
        desc: t('JWT 认证、WebAuthn 无密码登录、细粒度权限控制'),
      },
      {
        icon: <Zap size={20} strokeWidth={2} />,
        title: t('高性能'),
        desc: t('内置缓存、速率限制、流式响应，保障服务稳定运行'),
      },
      {
        icon: <Globe size={20} strokeWidth={2} />,
        title: t('国际化'),
        desc: t('支持多语言界面，包括中文、英文、日文等'),
      },
    ],
    [t],
  );

  const shortcuts = useMemo(
    () => [
      {
        keys: navigator.platform.includes('Mac') ? '⌘ K' : 'Ctrl+K',
        label: t('全局搜索'),
      },
      { keys: '↑ ↓', label: t('导航') },
      { keys: '↵', label: t('跳转') },
      { keys: 'ESC', label: t('关闭') },
    ],
    [t],
  );

  return (
    <div className='mt-[60px] flex justify-center px-4 py-8'>
      <div className='max-w-2xl w-full'>
        {/* Hero Section */}
        <div className='text-center mb-10'>
          {logo && (
            <div className='mb-6 flex justify-center'>
              <img
                src={logo}
                alt={systemName}
                className='h-20 w-20 object-contain rounded-2xl'
                style={{
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                }}
              />
            </div>
          )}

          <h1
            className='text-3xl font-bold mb-2'
            style={{ color: 'var(--semi-color-text-0)' }}
          >
            {systemName}
          </h1>

          {version && (
            <p
              className='text-sm mb-4 inline-block px-3 py-1 rounded-full'
              style={{
                color: 'var(--semi-color-text-2)',
                backgroundColor: 'var(--semi-color-fill-0)',
              }}
            >
              v{version}
            </p>
          )}

          <p
            className='text-base leading-relaxed max-w-md mx-auto'
            style={{ color: 'var(--semi-color-text-1)' }}
          >
            {t('AI API 聚合管理平台，支持多种主流 AI 服务提供商。')}
          </p>
        </div>

        {/* Feature Highlights */}
        <div className='mb-10'>
          <h2
            className='text-lg font-semibold mb-4'
            style={{ color: 'var(--semi-color-text-0)' }}
          >
            {t('核心特性')}
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {features.map((feature, idx) => (
              <div
                key={idx}
                className='about-feature-card p-4 rounded-xl'
                style={{
                  backgroundColor: 'var(--semi-color-fill-0)',
                  border: '1px solid var(--semi-color-border)',
                }}
              >
                <div
                  className='mb-2'
                  style={{ color: 'var(--semi-color-primary)' }}
                >
                  {feature.icon}
                </div>
                <h3
                  className='text-sm font-semibold mb-1'
                  style={{ color: 'var(--semi-color-text-0)' }}
                >
                  {feature.title}
                </h3>
                <p
                  className='text-xs leading-relaxed'
                  style={{ color: 'var(--semi-color-text-2)' }}
                >
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className='mb-10'>
          <h2
            className='text-lg font-semibold mb-4 flex items-center gap-2'
            style={{ color: 'var(--semi-color-text-0)' }}
          >
            <Command size={18} strokeWidth={2} />
            {t('快捷键')}
          </h2>
          <div
            className='p-4 rounded-xl'
            style={{
              backgroundColor: 'var(--semi-color-fill-0)',
              border: '1px solid var(--semi-color-border)',
            }}
          >
            <div className='flex flex-wrap gap-x-8 gap-y-3'>
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} className='flex items-center gap-2'>
                  <kbd
                    className='px-2 py-0.5 rounded text-xs font-mono'
                    style={{
                      backgroundColor: 'var(--semi-color-bg-2)',
                      border: '1px solid var(--semi-color-border)',
                      color: 'var(--semi-color-text-1)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                  >
                    {shortcut.keys}
                  </kbd>
                  <span
                    className='text-sm'
                    style={{ color: 'var(--semi-color-text-2)' }}
                  >
                    {shortcut.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* License & Links */}
        <div
          className='pt-6 border-t'
          style={{ borderColor: 'var(--semi-color-border)' }}
        >
          <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
            <div className='flex items-center gap-2'>
              <Scale
                size={14}
                strokeWidth={2}
                style={{ color: 'var(--semi-color-text-3)' }}
              />
              <span
                className='text-xs'
                style={{ color: 'var(--semi-color-text-3)' }}
              >
                AGPL-3.0 License
              </span>
            </div>
            <div className='flex items-center gap-4'>
              {docsLink && (
                <a
                  href={docsLink}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='about-link flex items-center gap-1 text-xs'
                  style={{ color: 'var(--semi-color-primary)' }}
                >
                  <ExternalLink size={12} strokeWidth={2} />
                  {t('文档')}
                </a>
              )}
              <span
                className='text-xs'
                style={{ color: 'var(--semi-color-text-3)' }}
              >
                Powered by vibeapi
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
