import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // No additional routes needed for now
  // All API functionality is handled by the Local LLM API at 127.0.0.1:5000

  return httpServer;
}