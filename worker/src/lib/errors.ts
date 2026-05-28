export type AppRole = "client" | "sales" | "manager";

export class AppError extends Error {
  constructor(
    public readonly key: string,
    public readonly status: number,
  ) {
    super(key);
    this.name = "AppError";
  }
}

export function errorResponse(key: string, status: number) {
  return Response.json({ error: key }, { status });
}
