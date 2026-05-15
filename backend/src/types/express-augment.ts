/** Loaded from `index.ts` so CI/Vercel typechecks pick up `Express.Request.user`. */
export {};

declare global {
  namespace Express {
    interface Request {
      /** Set by `authRequired` after JWT verification */
      user?: { id: string; email: string };
    }
  }
}
