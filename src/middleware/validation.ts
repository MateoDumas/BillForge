import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate = (schema: ZodSchema) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = (error as any).errors || (error as any).issues || [];
      return res.status(400).json({
        error: "Validation Error",
        details: errors.map((e: any) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    }
    console.error("Internal validation error:", error);
    return res.status(500).json({ error: "Internal Validation Error" });
  }
};
