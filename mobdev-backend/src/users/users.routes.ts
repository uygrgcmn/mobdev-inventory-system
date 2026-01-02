import { Router } from "express";
import { requireRole } from "../middleware/roleGuard";
import { listUsers, createUser, updateUser, deleteUser } from "./users.controller";
import { authRequired } from "../auth/auth.middleware";

const r = Router();

r.use(authRequired); // önce kimlik
r.get("/", requireRole(["Admin"]), listUsers);
r.post("/", requireRole(["Admin"]), createUser);
r.put("/:id", requireRole(["Admin"]), updateUser);
r.delete("/:id", requireRole(["Admin"]), deleteUser);

export default r;
