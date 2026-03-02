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
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography } from '@douyinfe/semi-ui';
import { StatusContext } from '../../context/Status';
import MarkdownRenderer from '../../components/common/markdown/MarkdownRenderer';

const { Title, Text } = Typography;

const HelpDocPage = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);

  const doc = useMemo(() => {
    const helpDocs = statusState?.status?.help_docs;
    if (!Array.isArray(helpDocs)) return null;
    return helpDocs.find((d) => d.slug === slug);
  }, [statusState?.status?.help_docs, slug]);

  if (!doc) {
    return (
      <div className='mt-[60px] px-2 max-w-4xl mx-auto pb-12'>
        <div className='flex flex-col items-center justify-center py-20'>
          <Title heading={3}>{t('页面未找到')}</Title>
          <Text type='tertiary'>{t('暂无帮助文档')}</Text>
        </div>
      </div>
    );
  }

  return (
    <div className='mt-[60px] px-2 max-w-4xl mx-auto pb-12'>
      <MarkdownRenderer content={doc.content} />
    </div>
  );
};

export default HelpDocPage;
