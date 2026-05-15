declare global {
  namespace Express {
    interface Request {
      /** Set by `authRequired` after JWT verification */
      user?: { id: string; email: string };
    }
  }
}

export {};
