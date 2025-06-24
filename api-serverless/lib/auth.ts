// Simple auth middleware for serverless functions
export function requireAuth(handler: (req: any, res: any) => Promise<any>) {
  return async (req: any, res: any) => {
    try {
      // For now, implement basic auth check
      // In a real app, this would verify JWT tokens or session
      
      // Allow all requests for now (you can implement proper auth later)
      return await handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ message: 'Authentication error' });
    }
  };
} 