/**
 * `Request` in Express apps comes from `express-serve-static-core`; augmenting
 * `namespace Express` does not merge and breaks Vercel's backend typecheck.
 */
import "express";

declare module "express-serve-static-core" {
  interface Request {
    /** Set by `authRequired` after JWT verification */
    user?: { id: string; email: string };
  }
}

export {};
