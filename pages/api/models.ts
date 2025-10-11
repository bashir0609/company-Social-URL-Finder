import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface Model {
  id: string;
  name: string;
  description?: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey } = req.query;

  if (!apiKey) {
    return res.status(400).json({ error: 'API key required' });
  }

  try {
    const response = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': 'Company Social Finder',
      },
    });

    // Filter and format models for easier use
    const models: Model[] = response.data.data
      .filter((model: any) => !model.id.includes('free') && model.id.includes('gpt') || model.id.includes('claude') || model.id.includes('gemini'))
      .map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        description: model.description,
        pricing: model.pricing,
      }))
      .slice(0, 20); // Limit to top 20 models

    return res.status(200).json({ models });
  } catch (error: any) {
    console.error('Error fetching models:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch models',
      message: error.response?.data?.error?.message || error.message 
    });
  }
}
