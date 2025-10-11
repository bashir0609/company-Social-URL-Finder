import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
}
