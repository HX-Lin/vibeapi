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

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Card, Steps, Toast, Tag, Collapsible } from '@douyinfe/semi-ui';
import { Code2, Copy, Check, AlertTriangle, Settings } from 'lucide-react';

const { Title, Paragraph, Text } = Typography;

const CodeBlock = ({ children, language = 'json' }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      Toast.success({ content: t('已复制'), duration: 1.5 });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className='relative group my-3'>
      <pre className='bg-zinc-900 dark:bg-zinc-950 text-green-400 rounded-lg p-4 pr-12 overflow-x-auto text-sm font-mono leading-relaxed'>
        <code>{children}</code>
      </pre>
      <button
        onClick={handleCopy}
        className='absolute top-3 right-3 p-1.5 rounded-md bg-zinc-700/50 hover:bg-zinc-600/80 transition-colors duration-200 opacity-0 group-hover:opacity-100'
        title='Copy'
      >
        {copied ? (
          <Check size={14} className='text-green-400' />
        ) : (
          <Copy size={14} className='text-zinc-400' />
        )}
      </button>
    </div>
  );
};

const VscodeGuide = () => {
  const { t } = useTranslation();
  const apiBaseUrl = window.location.origin;

  return (
    <div className='mt-[60px] px-2 max-w-4xl mx-auto pb-12'>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center'>
            <Code2 size={24} className='text-blue-500' />
          </div>
          <div>
            <Title heading={3} className='!mb-0'>
              {t('VSCode 配置教程')}
            </Title>
            <Text type='tertiary' className='text-sm'>
              {t('在 VSCode 中配置 Claude 扩展连接到本平台')}
            </Text>
          </div>
        </div>
      </div>

      {/* Prerequisites */}
      <Card
        className='mb-6'
        title={
          <div className='flex items-center gap-2'>
            <AlertTriangle size={16} className='text-amber-500' />
            <span>{t('前提条件')}</span>
          </div>
        }
      >
        <ul className='list-disc list-inside space-y-2 text-sm'>
          <li>{t('已安装 VSCode 1.90 或更高版本')}</li>
          <li>{t('已在本平台创建 API 令牌（前往令牌管理页面创建）')}</li>
          <li>{t('稳定的网络连接')}</li>
        </ul>
      </Card>

      {/* Copilot Section */}
      <Title heading={4} className='!mb-4 !mt-8'>
        {t('方案一：配置 GitHub Copilot 使用本平台')}
      </Title>

      <Steps direction='vertical' className='mb-8'>
        <Steps.Step
          title={t('第一步：安装 GitHub Copilot 扩展')}
          status='process'
          description={
            <div className='mt-3'>
              <Paragraph className='text-sm mb-2'>
                {t('在 VSCode 扩展市场中搜索并安装以下扩展：')}
              </Paragraph>
              <ul className='list-disc list-inside space-y-1 text-sm ml-2'>
                <li><Text code>GitHub Copilot</Text></li>
                <li><Text code>GitHub Copilot Chat</Text></li>
              </ul>
            </div>
          }
        />

        <Steps.Step
          title={t('第二步：配置自定义 API 端点')}
          status='process'
          description={
            <div className='mt-3'>
              <Paragraph className='text-sm mb-2'>
                {t('打开 VSCode 设置（Ctrl+Shift+P → Preferences: Open User Settings JSON），添加以下配置：')}
              </Paragraph>
              <CodeBlock>{`{
  "github.copilot.advanced": {
    "debug.overrideEngine": "claude-sonnet-4-20250514",
    "debug.chatOverrideProxyUrl": "${apiBaseUrl}/v1",
    "authProvider": "none"
  }
}`}</CodeBlock>
            </div>
          }
        />

        <Steps.Step
          title={t('第三步：配置 API 密钥')}
          status='process'
          description={
            <div className='mt-3'>
              <Paragraph className='text-sm mb-2'>
                {t('设置环境变量（建议添加到系统环境变量或 shell 配置文件）：')}
              </Paragraph>
              <CodeBlock>{`# macOS / Linux
export GITHUB_COPILOT_API_KEY="sk-your-api-key-here"

# Windows PowerShell
$env:GITHUB_COPILOT_API_KEY="sk-your-api-key-here"`}</CodeBlock>
            </div>
          }
        />
      </Steps>

      {/* Continue Section */}
      <Title heading={4} className='!mb-4 !mt-8'>
        {t('方案二：配置 Continue 扩展')}
      </Title>

      <Steps direction='vertical' className='mb-8'>
        <Steps.Step
          title={t('第一步：安装 Continue 扩展')}
          status='process'
          description={
            <div className='mt-3'>
              <Paragraph className='text-sm mb-2'>
                {t('在 VSCode 扩展市场中搜索并安装：')}
              </Paragraph>
              <ul className='list-disc list-inside space-y-1 text-sm ml-2'>
                <li><Text code>Continue - Codestral, Claude, and more</Text></li>
              </ul>
            </div>
          }
        />

        <Steps.Step
          title={t('第二步：配置 Continue')}
          status='process'
          description={
            <div className='mt-3'>
              <Paragraph className='text-sm mb-2'>
                {t('打开 Continue 配置文件（~/.continue/config.json），添加以下配置：')}
              </Paragraph>
              <CodeBlock>{`{
  "models": [
    {
      "title": "Claude via VibeAPI",
      "provider": "openai",
      "model": "claude-sonnet-4-20250514",
      "apiBase": "${apiBaseUrl}/v1",
      "apiKey": "sk-your-api-key-here"
    }
  ]
}`}</CodeBlock>
            </div>
          }
        />

        <Steps.Step
          title={t('第三步：验证连接')}
          status='process'
          description={
            <div className='mt-3'>
              <Paragraph className='text-sm'>
                {t('重启 VSCode，打开 Continue 侧边栏面板，尝试发送一条消息验证是否正常工作。')}
              </Paragraph>
            </div>
          }
        />
      </Steps>

      {/* Cline Section */}
      <Title heading={4} className='!mb-4 !mt-8'>
        {t('方案三：配置 Cline 扩展')}
      </Title>

      <Steps direction='vertical' className='mb-8'>
        <Steps.Step
          title={t('第一步：安装 Cline 扩展')}
          status='process'
          description={
            <div className='mt-3'>
              <Paragraph className='text-sm mb-2'>
                {t('在 VSCode 扩展市场中搜索并安装：')}
              </Paragraph>
              <ul className='list-disc list-inside space-y-1 text-sm ml-2'>
                <li><Text code>Cline</Text></li>
              </ul>
            </div>
          }
        />

        <Steps.Step
          title={t('第二步：配置 Cline')}
          status='process'
          description={
            <div className='mt-3'>
              <Paragraph className='text-sm mb-2'>
                {t('打开 Cline 设置面板，选择 "OpenAI Compatible" 作为 API Provider，然后填入以下信息：')}
              </Paragraph>
              <div className='space-y-3 mt-3'>
                <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg'>
                  <Text className='text-sm'>API Provider</Text>
                  <Tag color='blue'>OpenAI Compatible</Tag>
                </div>
                <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg'>
                  <Text className='text-sm'>Base URL</Text>
                  <Tag color='green'>{apiBaseUrl}/v1</Tag>
                </div>
                <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg'>
                  <Text className='text-sm'>API Key</Text>
                  <Tag color='orange'>sk-your-api-key-here</Tag>
                </div>
                <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg'>
                  <Text className='text-sm'>Model ID</Text>
                  <Tag color='purple'>claude-sonnet-4-20250514</Tag>
                </div>
              </div>
            </div>
          }
        />
      </Steps>

      {/* API Info */}
      <Card
        className='mb-6'
        title={t('平台 API 信息')}
      >
        <div className='space-y-3'>
          <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg'>
            <Text className='text-sm'>{t('API 基地址')}</Text>
            <Tag color='green' size='large'>{apiBaseUrl}</Tag>
          </div>
          <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg'>
            <Text className='text-sm'>{t('兼容格式')}</Text>
            <Tag color='blue' size='large'>OpenAI API Compatible</Tag>
          </div>
        </div>
      </Card>

      {/* Troubleshooting */}
      <Card title={t('常见问题')}>
        <div className='space-y-4'>
          <div>
            <Text strong className='text-sm'>
              {t('Q: 扩展没有响应或提示连接失败？')}
            </Text>
            <Paragraph className='text-sm mt-1 !text-semi-color-text-2'>
              {t('A: 请确认 API 基地址末尾需要包含 /v1 路径（例如：{{url}}）。', { url: `${apiBaseUrl}/v1` })}
            </Paragraph>
          </div>
          <div>
            <Text strong className='text-sm'>
              {t('Q: 提示 "model not found"？')}
            </Text>
            <Paragraph className='text-sm mt-1 !text-semi-color-text-2'>
              {t('A: 请前往模型广场确认所选模型是否可用，并检查你的令牌是否有该模型的访问权限。')}
            </Paragraph>
          </div>
          <div>
            <Text strong className='text-sm'>
              {t('Q: 如何查看可用模型列表？')}
            </Text>
            <Paragraph className='text-sm mt-1 !text-semi-color-text-2'>
              {t('A: 前往本平台的模型广场页面可以查看所有可用模型及其定价信息。')}
            </Paragraph>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VscodeGuide;
