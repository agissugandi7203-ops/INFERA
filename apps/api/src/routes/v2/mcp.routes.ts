import { Router } from 'express';
import { handleMcpRequest } from '../../controllers/v2/mcp.controller.js';
import { optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

/**
 * POST /api/v2/mcp
 * Serves Model Context Protocol (MCP) Streamable JSON-RPC 2.0 requests
 * Used by OpenAI Responses API (type: "mcp") or Secure MCP Tunnel
 */
router.post('/', optionalAuth, handleMcpRequest);

export default router;
