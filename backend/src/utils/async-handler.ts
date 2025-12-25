import { Request, Response, NextFunction } from 'express';

/**
 * Async handler wrapper to properly handle promises in Express routes
 * This prevents the @typescript-eslint/no-misused-promises error
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => 
  (req: Request, res: Response, next: NextFunction): void => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
