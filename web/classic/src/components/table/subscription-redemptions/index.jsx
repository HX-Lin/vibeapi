import React from 'react';
import CardPro from '../../common/ui/CardPro';
import SubscriptionRedemptionsTable from './SubscriptionRedemptionsTable';
import SubscriptionRedemptionsActions from './SubscriptionRedemptionsActions';
import SubscriptionRedemptionsFilters from './SubscriptionRedemptionsFilters';
import SubscriptionRedemptionsDescription from './SubscriptionRedemptionsDescription';
import EditSubscriptionRedemptionModal from './modals/EditSubscriptionRedemptionModal';
import { useSubscriptionRedemptionsData } from '../../../hooks/subscription-redemptions/useSubscriptionRedemptionsData';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import { createCardProPagination } from '../../../helpers/utils';

const SubscriptionRedemptionsPage = () => {
  const redemptionsData = useSubscriptionRedemptionsData();
  const isMobile = useIsMobile();

  const {
    // Edit state
    showEdit,
    editingRedemption,
    closeEdit,
    refresh,
    plans,

    // Actions state
    selectedKeys,
    setEditingRedemption,
    setShowEdit,
    batchCopyRedemptions,
    batchDeleteRedemptions,

    // Filters state
    formInitValues,
    setFormApi,
    searchRedemptions,
    loading,
    searching,

    // UI state
    compactMode,
    setCompactMode,

    // Translation
    t,
  } = redemptionsData;

  return (
    <>
      <EditSubscriptionRedemptionModal
        refresh={refresh}
        editingRedemption={editingRedemption}
        visiable={showEdit}
        handleClose={closeEdit}
        plans={plans}
      />

      <CardPro
        type='type1'
        descriptionArea={
          <SubscriptionRedemptionsDescription
            compactMode={compactMode}
            setCompactMode={setCompactMode}
            t={t}
          />
        }
        actionsArea={
          <div className='flex flex-col md:flex-row justify-between items-center gap-2 w-full'>
            <SubscriptionRedemptionsActions
              selectedKeys={selectedKeys}
              setEditingRedemption={setEditingRedemption}
              setShowEdit={setShowEdit}
              batchCopyRedemptions={batchCopyRedemptions}
              batchDeleteRedemptions={batchDeleteRedemptions}
              t={t}
            />

            <div className='w-full md:w-full lg:w-auto order-1 md:order-2'>
              <SubscriptionRedemptionsFilters
                formInitValues={formInitValues}
                setFormApi={setFormApi}
                searchRedemptions={searchRedemptions}
                loading={loading}
                searching={searching}
                t={t}
              />
            </div>
          </div>
        }
        paginationArea={createCardProPagination({
          currentPage: redemptionsData.activePage,
          pageSize: redemptionsData.pageSize,
          total: redemptionsData.tokenCount,
          onPageChange: redemptionsData.handlePageChange,
          onPageSizeChange: redemptionsData.handlePageSizeChange,
          isMobile: isMobile,
          t: redemptionsData.t,
        })}
        t={redemptionsData.t}
      >
        <SubscriptionRedemptionsTable {...redemptionsData} />
      </CardPro>
    </>
  );
};

export default SubscriptionRedemptionsPage;
