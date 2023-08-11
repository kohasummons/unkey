// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.20.0
// source: decrement_key_remaining.sql

package database

import (
	"context"
)

const decrementKeyRemaining = `-- name: DecrementKeyRemaining :exec
UPDATE
    ` + "`" + `keys` + "`" + `
SET
    remaining_requests = remaining_requests - 1
WHERE
    id = ?
`

func (q *Queries) DecrementKeyRemaining(ctx context.Context, id string) error {
	_, err := q.db.ExecContext(ctx, decrementKeyRemaining, id)
	return err
}