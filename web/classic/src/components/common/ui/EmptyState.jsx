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

import React, { lazy, Suspense } from 'react';
import { Empty, Button } from '@douyinfe/semi-ui';

const LazyIllustrationConstruction = lazy(() => import('@douyinfe/semi-illustrations').then(m => ({ default: m.IllustrationConstruction })));
const LazyIllustrationConstructionDark = lazy(() => import('@douyinfe/semi-illustrations').then(m => ({ default: m.IllustrationConstructionDark })));
const LazyIllustrationNoResult = lazy(() => import('@douyinfe/semi-illustrations').then(m => ({ default: m.IllustrationNoResult })));
const LazyIllustrationNoResultDark = lazy(() => import('@douyinfe/semi-illustrations').then(m => ({ default: m.IllustrationNoResultDark })));
const LazyIllustrationNotFound = lazy(() => import('@douyinfe/semi-illustrations').then(m => ({ default: m.IllustrationNotFound })));
const LazyIllustrationNotFoundDark = lazy(() => import('@douyinfe/semi-illustrations').then(m => ({ default: m.IllustrationNotFoundDark })));

/**
 * 预设插图映射
 * key: 预设名称
 * value: { light, dark } 组件（懒加载）
 */
const ILLUSTRATION_PRESETS = {
  construction: {
    light: LazyIllustrationConstruction,
    dark: LazyIllustrationConstructionDark,
  },
  noResult: {
    light: LazyIllustrationNoResult,
    dark: LazyIllustrationNoResultDark,
  },
  notFound: {
    light: LazyIllustrationNotFound,
    dark: LazyIllustrationNotFoundDark,
  },
};

/**
 * 预设尺寸映射
 */
const SIZE_MAP = {
  small: { width: 100, height: 100 },
  medium: { width: 150, height: 150 },
  large: { width: 200, height: 200 },
};

/**
 * 统一空状态组件
 *
 * 封装 Semi UI 的 Empty 组件，提供：
 * - 预设插图（construction / noResult / notFound）
 * - 自动暗色模式适配
 * - 可配置尺寸（small / medium / large）
 * - 可选操作按钮
 * - 自定义 Lucide 图标替代插图
 *
 * @param {Object} props
 * @param {string} [props.preset='construction'] - 预设插图类型
 * @param {string} [props.size='medium'] - 插图尺寸
 * @param {string} [props.title] - 标题文本
 * @param {string} [props.description] - 描述文本
 * @param {React.ReactNode} [props.icon] - 自定义图标（替代预设插图）
 * @param {string} [props.actionText] - 操作按钮文本
 * @param {Function} [props.onAction] - 操作按钮点击回调
 * @param {string} [props.className] - 额外 CSS 类名
 * @param {Object} [props.style] - 额外内联样式
 */
const EmptyState = ({
  preset = 'construction',
  size = 'medium',
  title,
  description,
  icon,
  actionText,
  onAction,
  className = '',
  style,
}) => {
  const dimensions = SIZE_MAP[size] || SIZE_MAP.medium;
  const illustrationPreset = ILLUSTRATION_PRESETS[preset];

  // 构建图片属性
  let imageProps = {};
  if (icon) {
    // 使用自定义图标
    imageProps.image = (
      <div
        className='empty-state-custom-icon'
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: dimensions.width,
          height: dimensions.height,
        }}
      >
        {icon}
      </div>
    );
  } else if (illustrationPreset) {
    const LightIllustration = illustrationPreset.light;
    const DarkIllustration = illustrationPreset.dark;
    const fallback = <div style={dimensions} />;
    imageProps.image = <Suspense fallback={fallback}><LightIllustration style={dimensions} /></Suspense>;
    imageProps.darkModeImage = <Suspense fallback={fallback}><DarkIllustration style={dimensions} /></Suspense>;
  }

  return (
    <div
      className={`empty-state-wrapper ${className}`.trim()}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 0',
        ...style,
      }}
    >
      <Empty
        {...imageProps}
        title={title}
        description={description}
      >
        {actionText && onAction && (
          <Button
            type='primary'
            theme='solid'
            onClick={onAction}
            style={{ marginTop: 12 }}
          >
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
};

export default EmptyState;
