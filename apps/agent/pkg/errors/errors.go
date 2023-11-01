package errors

import (
	"errors"
)

// Reexported from "errors"
func As(err error, target any) bool {
	return errors.As(err, target)
}

// Reexported from "errors"
func Is(err error, target error) bool {
	return errors.Is(err, target)
}

var (
	ErrNotFound            = errors.New("NOT_FOUND")
	ErrBadRequest          = errors.New("BAD_REQUEST")
	ErrUnauthorized        = errors.New("UNAUTHORIZED")
	ErrInternalServerError = errors.New("INTERNAL_SERVER_ERROR")
	ErrRatelimited         = errors.New("RATELIMITED")
	ErrForbidden           = errors.New("FORBIDDEN")
	ErrKeyUsageExceeded    = errors.New("KEY_USAGE_EXCEEDED")
	ErrInvalidKeyType      = errors.New("INVALID_KEY_TYPE")
	ErrNotUnique           = errors.New("NOT_UNIQUE")
)

type Error struct {
	CodeError    error
	ServiceError error
}

func (e Error) Error() string {
	return errors.Join(e.CodeError, e.ServiceError).Error()
}

func New(code error, service error) error {
	return Error{
		CodeError:    code,
		ServiceError: service,
	}

}
