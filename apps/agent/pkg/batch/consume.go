package batch

import (
	"context"
	"time"
)

// Process batches items and flushes them in a new goroutine.
// flush is called when the batch is full or the interval has elapsed and needs to be implemented by the caller.
// it must handle all errors itself and must not panic.
//
// Process returns a channel that can be used to send items to be batched.
func Process[T any](flush func(ctx context.Context, batch []T), size int, interval time.Duration) chan<- T {

	c := make(chan T)

	batch := make([]T, 0, size)
	ticker := time.NewTicker(interval)

	flushAndReset := func() {
		flush(context.Background(), batch)
		ticker.Reset(interval)
		batch = batch[:0]
	}

	go func() {
		for {
			select {
			case e, ok := <-c:
				if !ok {
					// channel closed
					flushAndReset()
					continue
				}
				batch = append(batch, e)
				if len(batch) >= size {
					flushAndReset()

				}
			case <-ticker.C:
				flushAndReset()
			}
		}
	}()

	return c
}
