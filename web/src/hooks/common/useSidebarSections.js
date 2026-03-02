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

import { useState, useCallback } from 'react';

const KEY = 'sidebar_collapsed_sections';

/**
 * 管理侧边栏各区域的展开/折叠状态，持久化到 localStorage。
 * 返回: { isSectionCollapsed, toggleSection }
 */
export const useSidebarSections = () => {
  const [collapsedSections, setCollapsedSections] = useState(() => {
    try {
      const stored = localStorage.getItem(KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const isSectionCollapsed = useCallback(
    (sectionKey) => collapsedSections[sectionKey] === true,
    [collapsedSections],
  );

  const toggleSection = useCallback((sectionKey) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [sectionKey]: !prev[sectionKey] };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { isSectionCollapsed, toggleSection };
};
