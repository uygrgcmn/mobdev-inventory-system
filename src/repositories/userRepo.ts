import { apiFetch } from "../services/api";

export type UserRole = "Admin" | "Manager" | "Staff";

export type DbUser = {
  id: number;
  username: string;
  role: UserRole;
  confirmed?: boolean;
};

// Backend does login/register separately in auth.controller, 
// but this repo manages the "User Management" part (Admin managing others).

export async function createUser(
  username: string,
  role: UserRole,
  password?: string
) {
  // POST /users requires Admin role
  return apiFetch("/users", {
    method: "POST",
    body: JSON.stringify({ username, password: password || "123456", role }),
  });
}

export async function listUsers(): Promise<DbUser[]> {
  return apiFetch("/users");
}

export async function deleteUser(id: number) {
  await apiFetch(`/users/${id}`, { method: "DELETE" });
}

export async function updateUser(id: number, data: Partial<DbUser> & { password?: string }) {
  await apiFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
