import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT || 5000),
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h", // session token ömrü
  SESSION_IDLE_MINUTES: Number(process.env.SESSION_IDLE_MINUTES || 30), // idle timeout
};
