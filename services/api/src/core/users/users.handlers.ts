import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import {
  createManagedUser,
  getUserProfile,
  listCommercialUserOptions,
  listManagedUsers,
  parseCreateUserInput,
  parseProfileInput,
  parseResetPasswordInput,
  parseUpdateUserInput,
  resetManagedUserPassword,
  updateUserProfile,
  updateManagedUser,
  UserManagementError
} from "./users.service.js";

function actorFrom(request: Request) {
  if (!request.user) {
    throw new UserManagementError("NOT_FOUND");
  }
  return {
    id: request.user.id,
    organizationId: request.user.organizationId
  };
}

function routeParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function sendUserManagementError(response: Response, error: unknown) {
  if (error instanceof UserManagementError) {
    if (error.code === "NOT_FOUND") {
      return sendError(response, 404, "NOT_FOUND", "User not found.");
    }
    if (error.code === "EMAIL_TAKEN") {
      return sendError(response, 409, "EMAIL_TAKEN", "Email already exists.");
    }
    if (error.code === "SELF_DEACTIVATE") {
      return sendError(response, 400, "SELF_DEACTIVATE", "Current user cannot deactivate itself.");
    }
    return sendError(response, 400, "INVALID_INPUT", "Invalid user payload.");
  }

  throw error;
}

export async function listUsersHandler(request: Request, response: Response) {
  try {
    const users = await listManagedUsers(prisma, actorFrom(request));
    return sendOk(response, { users });
  } catch (error) {
    return sendUserManagementError(response, error);
  }
}

export async function getProfileHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await getUserProfile(prisma, actorFrom(request)));
  } catch (error) {
    return sendUserManagementError(response, error);
  }
}

export async function updateProfileHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await updateUserProfile(prisma, actorFrom(request), parseProfileInput(request.body)));
  } catch (error) {
    return sendUserManagementError(response, error);
  }
}

export async function listCommercialUserOptionsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listCommercialUserOptions(prisma, actorFrom(request)));
  } catch (error) {
    return sendUserManagementError(response, error);
  }
}

export async function createUserHandler(request: Request, response: Response) {
  try {
    const user = await createManagedUser(prisma, actorFrom(request), parseCreateUserInput(request.body));
    return sendOk(response, { user }, 201);
  } catch (error) {
    return sendUserManagementError(response, error);
  }
}

export async function updateUserHandler(request: Request, response: Response) {
  try {
    const user = await updateManagedUser(
      prisma,
      actorFrom(request),
      routeParam(request.params.userId),
      parseUpdateUserInput(request.body)
    );
    return sendOk(response, { user });
  } catch (error) {
    return sendUserManagementError(response, error);
  }
}

export async function resetUserPasswordHandler(request: Request, response: Response) {
  try {
    const user = await resetManagedUserPassword(
      prisma,
      actorFrom(request),
      routeParam(request.params.userId),
      parseResetPasswordInput(request.body).password
    );
    return sendOk(response, { user });
  } catch (error) {
    return sendUserManagementError(response, error);
  }
}
