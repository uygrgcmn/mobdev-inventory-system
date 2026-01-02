import { runExecute, runQuery } from "../db/db";

export type DbUser = {
  id: number;
  username: string;
  role: string; // DB'de string saklıyoruz (CHECK ile kısıtlı)
};

export async function registerUser(
  username: string,
  password: string,
  role: "Admin" | "Manager" | "Staff"
) {
  await runExecute(
    `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
    [username, password, role]
  );
}

export async function loginUser(
  username: string,
  password: string
): Promise<DbUser> {
  const rows = await runQuery<DbUser>(
    `SELECT id, username, role FROM users WHERE username = ? AND password = ? LIMIT 1`,
    [username, password]
  );
  if (!rows[0]) {
    throw new Error("Geçersiz kullanıcı adı/şifre");
  }
  return rows[0]; // role: string
}

export async function listUsers(): Promise<DbUser[]> {
  return runQuery<DbUser>(`SELECT id, username, role FROM users ORDER BY createdAt DESC`);
}

export async function deleteUser(id: number) {
  await runExecute(`DELETE FROM users WHERE id = ?`, [id]);
}
