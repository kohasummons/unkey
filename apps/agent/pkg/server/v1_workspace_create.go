package server

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	workspacesv1 "github.com/unkeyed/unkey/apps/agent/gen/proto/workspaces/v1"
	"github.com/unkeyed/unkey/apps/agent/pkg/database"
)

type CreateWorkspaceRequestV1 struct {
	Name     string `json:"name" validate:"required"`
	TenantId string `json:"tenantId" validate:"required"`
}

type CreateWorkspaceResponseV1 struct {
	Id string `json:"id"`
}

func (s *Server) v1CreateWorkspace(c *fiber.Ctx) error {
	ctx, span := s.tracer.Start(c.UserContext(), "server.v1.workspace.createWorkspace")
	defer span.End()
	req := CreateWorkspaceRequestV1{}

	err := c.BodyParser(&req)
	if err != nil {
		return newHttpError(c, BAD_REQUEST, err.Error())
	}

	err = s.validator.Struct(req)
	if err != nil {
		return newHttpError(c, BAD_REQUEST, err.Error())
	}

	err = s.authorizeStaticKey(ctx, c.Get("Authorization"))
	if err != nil {
		return newHttpError(c, UNAUTHORIZED, err.Error())
	}

	ws, err := s.workspaceService.CreateWorkspace(ctx, &workspacesv1.CreateWorkspaceRequest{
		Name:     req.Name,
		TenantId: req.TenantId,
		Plan:     workspacesv1.Plan_PLAN_FREE,
	})
	if err != nil {
		if errors.Is(err, database.ErrNotUnique) {
			return newHttpError(c, NOT_UNIQUE, err.Error())

		}
		return newHttpError(c, INTERNAL_SERVER_ERROR, err.Error())
	}

	return c.JSON(CreateWorkspaceResponseV1{
		Id: ws.WorkspaceId,
	})
}
