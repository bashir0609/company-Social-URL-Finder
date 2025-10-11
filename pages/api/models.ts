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
  isFree?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey } = req.query;

  // Use API key from query or environment variable
  const effectiveApiKey = apiKey || process.env.OPENROUTER_API_KEY;

  if (!effectiveApiKey) {
    return res.status(400).json({ error: 'API key required. Please provide it in the request or set OPENROUTER_API_KEY environment variable.' });
  }

  try {
    const response = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${effectiveApiKey}`,
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': 'Company Social Finder',
      },
    });

    // Filter and format models
    const allModels: Model[] = response.data.data
      .map((model: any) => {
        const isFree = model.pricing?.prompt === '0' || 
                       model.id.includes('free') ||
                       parseFloat(model.pricing?.prompt || '1') === 0;
        
        return {
          id: model.id,
          name: model.name || model.id,
          description: model.description,
          pricing: model.pricing,
          isFree: isFree,
        };
      });

    // Separate free and paid models
    const freeModels = allModels.filter(m => m.isFree);
    const paidModels = allModels
      .filter(m => !m.isFree)
      .filter(m => 
        m.id.includes('gpt') || 
        m.id.includes('claude') || 
        m.id.includes('gemini') ||
        m.id.includes('llama') ||
        m.id.includes('mistral')
      )
      .slice(0, 15);

    // Combine: Free models first, then popular paid models
    const models = [...freeModels, ...paidModels];

    return res.status(200).json({ models });
  } catch (error: any) {
    console.error('Error fetching models:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch models',
      message: error.response?.data?.error?.message || error.message 
    });
  }
}
