import { useState, useEffect } from 'react';
import { API, showError, showSuccess, copy } from '../../helpers';
import { ITEMS_PER_PAGE } from '../../constants';
import {
  REDEMPTION_ACTIONS,
  REDEMPTION_STATUS,
} from '../../constants/redemption.constants';
import { Modal } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { useTableCompactMode } from '../common/useTableCompactMode';

export const useSubscriptionRedemptionsData = () => {
  const { t } = useTranslation();

  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [tokenCount, setTokenCount] = useState(0);
  const [selectedKeys, setSelectedKeys] = useState([]);

  const [editingRedemption, setEditingRedemption] = useState({
    id: undefined,
  });
  const [showEdit, setShowEdit] = useState(false);

  const [formApi, setFormApi] = useState(null);

  const [compactMode, setCompactMode] = useTableCompactMode(
    'subscription-redemptions',
  );

  // Subscription plans for dropdown
  const [plans, setPlans] = useState([]);

  const formInitValues = {
    searchKeyword: '',
  };

  const getFormValues = () => {
    const formValues = formApi ? formApi.getValues() : {};
    return {
      searchKeyword: formValues.searchKeyword || '',
    };
  };

  const setRedemptionFormat = (redemptions) => {
    setRedemptions(redemptions);
  };

  // Load subscription plans
  const loadPlans = async () => {
    try {
      const res = await API.get('/api/subscription/admin/plans');
      const { success, data } = res.data;
      if (success) {
        setPlans(data.map((item) => item.plan));
      }
    } catch (error) {
      console.error('Failed to load subscription plans:', error);
    }
  };

  const loadRedemptions = async (page = 1, size) => {
    setLoading(true);
    try {
      const res = await API.get(
        `/api/subscription_redemption/?p=${page}&page_size=${size}`,
      );
      const { success, message, data } = res.data;
      if (success) {
        const newPageData = data.items;
        setActivePage(data.page <= 0 ? 1 : data.page);
        setTokenCount(data.total);
        setRedemptionFormat(newPageData);
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    }
    setLoading(false);
  };

  const searchRedemptions = async () => {
    const { searchKeyword } = getFormValues();
    if (searchKeyword === '') {
      await loadRedemptions(1, pageSize);
      return;
    }

    setSearching(true);
    try {
      const res = await API.get(
        `/api/subscription_redemption/search?keyword=${searchKeyword}&p=1&page_size=${pageSize}`,
      );
      const { success, message, data } = res.data;
      if (success) {
        const newPageData = data.items;
        setActivePage(data.page || 1);
        setTokenCount(data.total);
        setRedemptionFormat(newPageData);
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    }
    setSearching(false);
  };

  const manageRedemption = async (id, action, record) => {
    setLoading(true);
    let data = { id };
    let res;

    try {
      switch (action) {
        case REDEMPTION_ACTIONS.DELETE:
          res = await API.delete(`/api/subscription_redemption/${id}/`);
          break;
        case REDEMPTION_ACTIONS.ENABLE:
          data.status = REDEMPTION_STATUS.UNUSED;
          res = await API.put(
            '/api/subscription_redemption/?status_only=true',
            data,
          );
          break;
        case REDEMPTION_ACTIONS.DISABLE:
          data.status = REDEMPTION_STATUS.DISABLED;
          res = await API.put(
            '/api/subscription_redemption/?status_only=true',
            data,
          );
          break;
        default:
          throw new Error('Unknown operation type');
      }

      const { success, message } = res.data;
      if (success) {
        showSuccess(t('操作成功完成！'));
        let redemption = res.data.data;
        let newRedemptions = [...redemptions];
        if (action !== REDEMPTION_ACTIONS.DELETE) {
          record.status = redemption.status;
        }
        setRedemptions(newRedemptions);
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    }
    setLoading(false);
  };

  const refresh = async (page = activePage) => {
    const { searchKeyword } = getFormValues();
    if (searchKeyword === '') {
      await loadRedemptions(page, pageSize);
    } else {
      await searchRedemptions();
    }
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    const { searchKeyword } = getFormValues();
    if (searchKeyword === '') {
      loadRedemptions(page, pageSize);
    } else {
      searchRedemptions();
    }
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setActivePage(1);
    const { searchKeyword } = getFormValues();
    if (searchKeyword === '') {
      loadRedemptions(1, size);
    } else {
      searchRedemptions();
    }
  };

  const rowSelection = {
    onSelect: (record, selected) => {},
    onSelectAll: (selected, selectedRows) => {},
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedKeys(selectedRows);
    },
  };

  const handleRow = (record, index) => {
    const isExpired = (rec) => {
      return (
        rec.status === REDEMPTION_STATUS.UNUSED &&
        rec.expired_time !== 0 &&
        rec.expired_time < Math.floor(Date.now() / 1000)
      );
    };

    if (record.status !== REDEMPTION_STATUS.UNUSED || isExpired(record)) {
      return {
        style: {
          background: 'var(--semi-color-disabled-border)',
        },
      };
    } else {
      return {};
    }
  };

  const copyText = async (text) => {
    if (await copy(text)) {
      showSuccess('已复制到剪贴板！');
    } else {
      Modal.error({
        title: '无法复制到剪贴板，请手动复制',
        content: text,
        size: 'large',
      });
    }
  };

  const batchCopyRedemptions = async () => {
    if (selectedKeys.length === 0) {
      showError(t('请至少选择一个兑换码！'));
      return;
    }

    let keys = '';
    for (let i = 0; i < selectedKeys.length; i++) {
      keys += selectedKeys[i].name + '    ' + selectedKeys[i].key + '\n';
    }
    await copyText(keys);
  };

  const batchDeleteRedemptions = async () => {
    Modal.confirm({
      title: t('确定清除所有失效订阅兑换码？'),
      content: t('将删除已使用、已禁用及过期的订阅兑换码，此操作不可撤销。'),
      onOk: async () => {
        setLoading(true);
        const res = await API.delete('/api/subscription_redemption/invalid');
        const { success, message, data } = res.data;
        if (success) {
          showSuccess(
            t('已删除 {{count}} 条失效订阅兑换码', { count: data }),
          );
          await refresh();
        } else {
          showError(message);
        }
        setLoading(false);
      },
    });
  };

  const closeEdit = () => {
    setShowEdit(false);
    setTimeout(() => {
      setEditingRedemption({
        id: undefined,
      });
    }, 500);
  };

  const removeRecord = (key) => {
    let newDataSource = [...redemptions];
    if (key != null) {
      let idx = newDataSource.findIndex((data) => data.key === key);
      if (idx > -1) {
        newDataSource.splice(idx, 1);
        setRedemptions(newDataSource);
      }
    }
  };

  useEffect(() => {
    loadRedemptions(1, pageSize).catch((reason) => {
      showError(reason);
    });
    loadPlans();
  }, [pageSize]);

  return {
    redemptions,
    loading,
    searching,
    activePage,
    pageSize,
    tokenCount,
    selectedKeys,
    plans,

    editingRedemption,
    showEdit,

    formApi,
    formInitValues,

    compactMode,
    setCompactMode,

    loadRedemptions,
    searchRedemptions,
    manageRedemption,
    refresh,
    copyText,
    removeRecord,

    setActivePage,
    setPageSize,
    setSelectedKeys,
    setEditingRedemption,
    setShowEdit,
    setFormApi,
    setLoading,

    handlePageChange,
    handlePageSizeChange,
    rowSelection,
    handleRow,
    closeEdit,
    getFormValues,

    batchCopyRedemptions,
    batchDeleteRedemptions,

    t,
  };
};
