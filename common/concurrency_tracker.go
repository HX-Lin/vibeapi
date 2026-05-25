package common

import (
	"sync"
	"time"
)

// UserConcurrencyTracker tracks per-user request counts within a sliding window
// to support concurrency-based quota multiplier.
type UserConcurrencyTracker struct {
	store map[int]*[]int64 // userId -> timestamps of requests
	mutex sync.Mutex
}

var globalConcurrencyTracker = &UserConcurrencyTracker{}

func init() {
	globalConcurrencyTracker.store = make(map[int]*[]int64)
	go globalConcurrencyTracker.cleanup()
}

// RecordRequest records a new request for the given user.
func RecordUserRequest(userId int) {
	globalConcurrencyTracker.mutex.Lock()
	defer globalConcurrencyTracker.mutex.Unlock()
	now := time.Now().Unix()
	queue, ok := globalConcurrencyTracker.store[userId]
	if !ok {
		s := make([]int64, 0, 64)
		s = append(s, now)
		globalConcurrencyTracker.store[userId] = &s
	} else {
		*queue = append(*queue, now)
	}
}

// GetUserRPM returns the number of requests the user made in the last 60 seconds.
func GetUserRPM(userId int) int {
	globalConcurrencyTracker.mutex.Lock()
	defer globalConcurrencyTracker.mutex.Unlock()
	queue, ok := globalConcurrencyTracker.store[userId]
	if !ok {
		return 0
	}
	cutoff := time.Now().Unix() - 60
	// Trim old entries
	trimIdx := 0
	for trimIdx < len(*queue) && (*queue)[trimIdx] < cutoff {
		trimIdx++
	}
	if trimIdx > 0 {
		*queue = (*queue)[trimIdx:]
	}
	return len(*queue)
}

// cleanup periodically removes expired entries to prevent memory leaks.
func (t *UserConcurrencyTracker) cleanup() {
	for {
		time.Sleep(5 * time.Minute)
		t.mutex.Lock()
		cutoff := time.Now().Unix() - 120 // keep 2 minutes of data
		for userId, queue := range t.store {
			trimIdx := 0
			for trimIdx < len(*queue) && (*queue)[trimIdx] < cutoff {
				trimIdx++
			}
			if trimIdx > 0 {
				*queue = (*queue)[trimIdx:]
			}
			if len(*queue) == 0 {
				delete(t.store, userId)
			}
		}
		t.mutex.Unlock()
	}
}
