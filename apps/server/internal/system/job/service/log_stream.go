package service

import (
	"sync"
	"sync/atomic"

	"github.com/starter-kit-fe/admin/internal/system/job/types"
)

// logStreamHub maintains SSE subscribers per job log and broadcasts step events.
type logStreamHub struct {
	mu          sync.RWMutex
	nextID      uint64
	subscribers map[int64]map[uint64]chan *types.StepEvent
}

func newLogStreamHub() *logStreamHub {
	return &logStreamHub{subscribers: make(map[int64]map[uint64]chan *types.StepEvent)}
}

// Subscribe registers a new subscriber for the given job log ID.
// It returns a receive-only channel for events and a cleanup function.
func (h *logStreamHub) Subscribe(jobLogID int64) (<-chan *types.StepEvent, func()) {
	if h == nil {
		return nil, func() {}
	}

	ch := make(chan *types.StepEvent, 32)
	subscriberID := atomic.AddUint64(&h.nextID, 1)

	h.mu.Lock()
	if _, ok := h.subscribers[jobLogID]; !ok {
		h.subscribers[jobLogID] = make(map[uint64]chan *types.StepEvent)
	}
	h.subscribers[jobLogID][subscriberID] = ch
	h.mu.Unlock()

	cleanup := func() {
		h.mu.Lock()
		if subs, ok := h.subscribers[jobLogID]; ok {
			if c, exists := subs[subscriberID]; exists {
				close(c)
				delete(subs, subscriberID)
			}
			if len(subs) == 0 {
				delete(h.subscribers, jobLogID)
			}
		}
		h.mu.Unlock()
	}

	return ch, cleanup
}

// Publish fan-outs an event to all subscribers of the given log ID.
func (h *logStreamHub) Publish(jobLogID int64, event *types.StepEvent) {
	if h == nil || event == nil {
		return
	}

	h.mu.RLock()
	subs := h.subscribers[jobLogID]
	for _, ch := range subs {
		select {
		case ch <- event:
		default:
			// Skip slow consumers to avoid blocking
		}
	}
	h.mu.RUnlock()
}

// Close drains and removes all subscribers for a log ID.
func (h *logStreamHub) Close(jobLogID int64) {
	if h == nil {
		return
	}

	h.mu.Lock()
	if subs, ok := h.subscribers[jobLogID]; ok {
		for id, ch := range subs {
			close(ch)
			delete(subs, id)
		}
		delete(h.subscribers, jobLogID)
	}
	h.mu.Unlock()
}
