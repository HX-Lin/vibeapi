package common

import (
	"sync/atomic"
	"time"
)

const (
	MigrationModeAuto       = "auto"
	MigrationModeDisabled   = "disabled"
	MigrationModeRunAndExit = "run-and-exit"
)

var (
	ClusterLeaderEnabled              bool
	ClusterNodeID                     string
	ClusterLeaderLeaseName            = "vibeapi-leader"
	ClusterLeaseTTLSeconds            = 30
	ClusterLeaseRenewIntervalSeconds  = 10
	MigrationMode                     = MigrationModeAuto
	clusterLeaderState                atomic.Bool
)

func ClusterLeaseTTL() time.Duration {
	return time.Duration(ClusterLeaseTTLSeconds) * time.Second
}

func ClusterLeaseRenewInterval() time.Duration {
	return time.Duration(ClusterLeaseRenewIntervalSeconds) * time.Second
}

func SetClusterLeader(isLeader bool) bool {
	old := clusterLeaderState.Swap(isLeader)
	return old != isLeader
}

func IsClusterLeader() bool {
	return clusterLeaderState.Load()
}

func ShouldRunLeaderTasks() bool {
	if ClusterLeaderEnabled {
		return IsClusterLeader()
	}
	return IsMasterNode
}

func ShouldRunMigrations() bool {
	switch MigrationMode {
	case MigrationModeDisabled:
		return false
	case MigrationModeRunAndExit:
		return true
	default:
		return IsMasterNode
	}
}
