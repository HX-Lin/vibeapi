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

import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import DocumentRenderer from '../../components/common/DocumentRenderer';
import { getSystemName } from '../../helpers';
import { StatusContext } from '../../context/Status';
import { getPublicSupportEmail } from '../../lib/publicCompliance';

const UserAgreement = () => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const systemName = getSystemName();
  const supportEmail = getPublicSupportEmail(statusState?.status);
  const fallbackContent = `# ${t('用户协议')}

${t('最后更新：2026 年 6 月 6 日')}

## ${t('服务说明')}

${systemName} ${t('提供 AI API 网关能力，包括模型路由、API 密钥管理、用户访问控制、用量分析、额度管理和计费可见性。')}

## ${t('账号和凭据')}

${t('你有责任保护账号、密码、API 密钥和访问令牌的安全，并确保提供的信息准确且及时更新。')}

## ${t('可接受使用')}

${t('你必须遵守适用法律、上游供应商政策和本协议，不得将服务用于违法活动、滥用、攻击、未授权访问、恶意软件、垃圾信息或破坏服务可用性的行为。')}

## ${t('价格和计费')}

${t('自托管平台访问为 $0/月。默认用量计费参考 $0.002 / 1K tokens。实际费用取决于所选模型、供应商配置、用户分组倍率、支付方式设置和管理员配置。')}

${t('公开价格可在首页价格表查看；登录后也可在模型广场或使用前查看详细模型价格。')}

## ${t('服务可用性和变更')}

${t('服务可能依赖第三方上游供应商、支付处理方、基础设施和网络可用性。功能、模型、价格和限制可能随供应商或管理员配置调整而变化。')}

## ${t('免责声明和限制')}

${t('服务按当前配置提供，可能并非无错误或不中断。AI 模型输出可能不准确或不适当，用户应在依赖输出前自行审查。')}

## ${t('隐私和支持')}

${t('请查看隐私政策了解我们如何处理数据。如需支持，请联系：')} ${supportEmail}
`;

  return (
    <DocumentRenderer
      apiEndpoint='/api/user-agreement'
      title={t('用户协议')}
      cacheKey='user_agreement'
      emptyMessage={t('加载用户协议内容失败...')}
      fallbackContent={fallbackContent}
    />
  );
};

export default UserAgreement;
