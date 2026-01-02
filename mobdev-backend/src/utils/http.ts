export function ok<T>(data: T) { return { ok: true, data }; }
export function fail(message: string, code = 400) { return { ok: false, message, code }; }
