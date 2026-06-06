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

import React from 'react';
import { useTranslation } from 'react-i18next';
import DocumentRenderer from '../../components/common/DocumentRenderer';
import { getSystemName } from '../../helpers';
import { PUBLIC_SUPPORT_EMAIL } from '../../lib/publicCompliance';

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const systemName = getSystemName();
  const fallbackContent = `# ${t('隐私政策')}

${t('最后更新：2026 年 6 月 6 日')}

## ${t('我们是谁')}

${systemName} ${t('是一个 AI API 网关，用于模型请求路由、API 访问管理、用量监控和计费信息展示。')}

## ${t('我们处理的信息')}

${t('我们可能会处理账号标识、用户名、邮箱地址、认证和会话数据、用户创建的 API 密钥、使用日志、请求元数据、充值和账单记录，以及客服沟通内容。')}

## ${t('我们如何使用信息')}

${t('我们使用这些信息来提供服务、验证用户身份、路由 API 流量、计算用量和费用、防止滥用、提升可靠性、响应支持请求并履行法律义务。')}

## ${t('共享和第三方服务')}

${t('我们不会出售个人信息。为运行服务，我们可能与上游 AI 服务商、支付处理方、基础设施供应商、监控工具或专业顾问共享必要数据。')}

## ${t('保留和安全')}

${t('我们会在运营服务、维护账单记录、解决争议、执行条款和满足法律要求所需的期间保留信息，并采取合理的技术和组织措施保护服务数据。')}

## ${t('你的选择')}

${t('在服务和适用法律支持的范围内，你可以访问、更新、导出或请求删除账号信息。出于安全、防欺诈、账单或法律合规原因，部分记录可能需要保留。')}

## ${t('联系我们')}

${t('如有隐私相关问题，请联系客户支持：')} ${PUBLIC_SUPPORT_EMAIL}
`;

  return (
    <DocumentRenderer
      apiEndpoint='/api/privacy-policy'
      title={t('隐私政策')}
      cacheKey='privacy_policy'
      emptyMessage={t('加载隐私政策内容失败...')}
      fallbackContent={fallbackContent}
    />
  );
};

export default PrivacyPolicy;
