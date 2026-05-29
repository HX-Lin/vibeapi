package service

import (
	"fmt"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
)

var clusterLeaderOnce sync.Once

func StartClusterLeaderManager() {
	if !common.ClusterLeaderEnabled {
		return
	}
	clusterLeaderOnce.Do(func() {
		if err := model.EnsureClusterLease(common.ClusterLeaderLeaseName); err != nil {
			common.FatalLog("failed to initialize cluster leader lease: " + err.Error())
		}
		renewClusterLeaderLease()
		go func() {
			ticker := time.NewTicker(common.ClusterLeaseRenewInterval())
			defer ticker.Stop()
			for range ticker.C {
				renewClusterLeaderLease()
			}
		}()
	})
}

func renewClusterLeaderLease() {
	ok, err := model.AcquireClusterLease(common.ClusterLeaderLeaseName, common.ClusterNodeID, common.ClusterLeaseTTL())
	if err != nil {
		if common.SetClusterLeader(false) {
			common.SysLog(fmt.Sprintf("cluster node %s lost leadership: %v", common.ClusterNodeID, err))
		} else {
			common.SysError(fmt.Sprintf("cluster leader lease renew failed: %v", err))
		}
		return
	}
	if ok {
		if common.SetClusterLeader(true) {
			common.SysLog(fmt.Sprintf("cluster node %s became leader", common.ClusterNodeID))
		}
		return
	}
	if common.SetClusterLeader(false) {
		common.SysLog(fmt.Sprintf("cluster node %s lost leadership", common.ClusterNodeID))
	}
}

func ReleaseClusterLeaderLease() {
	if !common.ClusterLeaderEnabled || !common.IsClusterLeader() {
		return
	}
	if err := model.ReleaseClusterLease(common.ClusterLeaderLeaseName, common.ClusterNodeID); err != nil {
		common.SysError("failed to release cluster leader lease: " + err.Error())
	}
	common.SetClusterLeader(false)
}
