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
import { Typography, Card, Steps, Toast, Tag } from '@douyinfe/semi-ui';
import { Terminal, Copy, Check, ExternalLink, AlertTriangle } from 'lucide-react';

const { Title, Paragraph, Text } = Typography;

const CodeBlock = ({ children, language = 'bash' }) => {
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

const ClaudeCliGuide = () => {
  const { t } = useTranslation();
  const apiBaseUrl = window.location.origin;

  return (
    <div className='mt-[60px] px-2 max-w-4xl mx-auto pb-12'>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center'>
            <Terminal size={24} className='text-orange-500' />
          </div>
          <div>
            <Title heading={3} className='!mb-0'>
              {t('Claude Code CLI 配置教程')}
            </Title>
            <Text type='tertiary' className='text-sm'>
              {t('通过命令行使用 Claude Code 连接到本平台')}
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
          <li>{t('已安装 Node.js 18 或更高版本')}</li>
          <li>{t('已在本平台创建 API 令牌（前往令牌管理页面创建）')}</li>
          <li>{t('操作系统：macOS、Linux 或 Windows (WSL)')}</li>
        </ul>
      </Card>

      {/* Steps */}
      <Steps direction='vertical' className='mb-8'>
        {/* Step 1 */}
        <Steps.Step
          title={t('第一步：安装 Claude Code CLI')}
          status='process'
          description={
            <div className='mt-3'>
              <Paragraph className='text-sm mb-2'>
                {t('使用 npm 全局安装 Claude Code CLI：')}
              </Paragraph>
              <CodeBlock>npm install -g @anthropic-ai/claude-code</CodeBlock>
            </div>
          }
        />

        {/* Step 2 */}
        <Steps.Step
          title={t('第二步：配置环境变量')}
          status='process'
          description={
            <div className='mt-3'>
              <Paragraph className='text-sm mb-2'>
                {t('设置 API 密钥和自定义 API 基地址，将以下内容添加到你的 shell 配置文件中（如 ~/.bashrc 或 ~/.zshrc）：')}
              </Paragraph>
              <CodeBlock>{`# Claude Code CLI 配置
export ANTHROPIC_API_KEY="sk-your-api-key-here"
export ANTHROPIC_BASE_URL="${apiBaseUrl}"
export DISABLE_PROMPT_CACHING=1`}</CodeBlock>
              <Paragraph className='text-sm mt-2'>
                {t('然后运行以下命令使配置生效：')}
              </Paragraph>
              <CodeBlock>source ~/.bashrc  # 或 source ~/.zshrc</CodeBlock>
              <div className='mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                <Text className='text-sm'>
                  <strong>{t('提示：')}</strong>
                  {t('请将 sk-your-api-key-here 替换为你在本平台创建的实际 API 令牌。')}
                </Text>
              </div>
            </div>
          }
        />

        {/* Step 3 */}
        <Steps.Step
          title={t('第三步：验证配置')}
          status='process'
          description={
            <div className='mt-3'>
              <Paragraph className='text-sm mb-2'>
                {t('运行以下命令验证 CLI 是否正确配置：')}
              </Paragraph>
              <CodeBlock>claude --version</CodeBlock>
              <Paragraph className='text-sm mt-2'>
                {t('确认版本号输出后，启动 Claude Code 交互会话：')}
              </Paragraph>
              <CodeBlock>claude</CodeBlock>
            </div>
          }
        />

        {/* Step 4 */}
        <Steps.Step
          title={t('第四步：常用命令')}
          status='process'
          description={
            <div className='mt-3'>
              <div className='space-y-3'>
                <div>
                  <Text strong className='text-sm'>{t('启动交互式对话：')}</Text>
                  <CodeBlock>claude</CodeBlock>
                </div>
                <div>
                  <Text strong className='text-sm'>{t('直接提问（非交互模式）：')}</Text>
                  <CodeBlock>claude -p "你的问题"</CodeBlock>
                </div>
                <div>
                  <Text strong className='text-sm'>{t('在项目目录中使用（代码辅助）：')}</Text>
                  <CodeBlock>{`cd /your/project/path
claude`}</CodeBlock>
                </div>
                <div>
                  <Text strong className='text-sm'>{t('查看帮助信息：')}</Text>
                  <CodeBlock>claude --help</CodeBlock>
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
            <Text className='text-sm'>{t('支持模型')}</Text>
            <Tag color='blue' size='large'>claude-sonnet-4-20250514, claude-opus-4-20250514 ...</Tag>
          </div>
        </div>
      </Card>

      {/* Troubleshooting */}
      <Card title={t('常见问题')}>
        <div className='space-y-4'>
          <div>
            <Text strong className='text-sm'>
              {t('Q: 提示 "connection refused" 或 "timeout"？')}
            </Text>
            <Paragraph className='text-sm mt-1 !text-semi-color-text-2'>
              {t('A: 请检查 ANTHROPIC_BASE_URL 是否正确设置。确保地址末尾不要有多余的斜杠。')}
            </Paragraph>
          </div>
          <div>
            <Text strong className='text-sm'>
              {t('Q: 提示 "invalid API key"？')}
            </Text>
            <Paragraph className='text-sm mt-1 !text-semi-color-text-2'>
              {t('A: 请前往本平台的令牌管理页面，确认令牌状态正常且未过期。')}
            </Paragraph>
          </div>
          <div>
            <Text strong className='text-sm'>
              {t('Q: 如何切换不同的模型？')}
            </Text>
            <Paragraph className='text-sm mt-1 !text-semi-color-text-2'>
              {t('A: 启动 claude 后输入 /model 命令查看和切换可用模型。')}
            </Paragraph>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ClaudeCliGuide;
