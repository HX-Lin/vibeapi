import React, { useMemo, useState } from 'react';
import CardTable from '../../common/ui/CardTable';
import EmptyState from '../../common/ui/EmptyState';
import { getSubscriptionRedemptionsColumns } from './SubscriptionRedemptionsColumnDefs';
import DeleteSubscriptionRedemptionModal from './modals/DeleteSubscriptionRedemptionModal';

const SubscriptionRedemptionsTable = (redemptionsData) => {
  const {
    redemptions,
    loading,
    activePage,
    pageSize,
    tokenCount,
    compactMode,
    plans,
    handlePageChange,
    rowSelection,
    handleRow,
    manageRedemption,
    copyText,
    setEditingRedemption,
    setShowEdit,
    refresh,
    t,
  } = redemptionsData;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);

  const showDeleteRedemptionModal = (record) => {
    setDeletingRecord(record);
    setShowDeleteModal(true);
  };

  const columns = useMemo(() => {
    return getSubscriptionRedemptionsColumns({
      t,
      plans,
      manageRedemption,
      copyText,
      setEditingRedemption,
      setShowEdit,
      showDeleteRedemptionModal,
    });
  }, [t, plans, manageRedemption, copyText, setEditingRedemption, setShowEdit]);

  const tableColumns = useMemo(() => {
    return compactMode
      ? columns.map((col) => {
          if (col.dataIndex === 'operate') {
            const { fixed, ...rest } = col;
            return rest;
          }
          return col;
        })
      : columns;
  }, [compactMode, columns]);

  return (
    <>
      <CardTable
        columns={tableColumns}
        dataSource={redemptions}
        scroll={compactMode ? undefined : { x: 'max-content' }}
        pagination={{
          currentPage: activePage,
          pageSize: pageSize,
          total: tokenCount,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          onPageSizeChange: redemptionsData.handlePageSizeChange,
          onPageChange: handlePageChange,
        }}
        hidePagination={true}
        loading={loading}
        rowSelection={rowSelection}
        onRow={handleRow}
        empty={
          <EmptyState
            preset='noResult'
            size='medium'
            description={t('搜索无结果')}
          />
        }
        className='rounded-xl overflow-hidden'
        size='middle'
      />

      <DeleteSubscriptionRedemptionModal
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        record={deletingRecord}
        manageRedemption={manageRedemption}
        refresh={refresh}
        redemptions={redemptions}
        activePage={activePage}
        t={t}
      />
    </>
  );
};

export default SubscriptionRedemptionsTable;
