import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { HfInference } from '@huggingface/inference';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

console.log('\n🔍 Checking environment variables...');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('VITE_SUPABASE_SERVICE_KEY:', process.env.VITE_SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing');
console.log('VITE_HUGGINGFACE_API_KEY:', process.env.VITE_HUGGINGFACE_API_KEY ? '✅ Set' : '❌ Missing');

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_SERVICE_KEY || !process.env.VITE_HUGGINGFACE_API_KEY) {
  console.error('❌ ERROR: Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY
);

const hf = new HfInference(process.env.VITE_HUGGINGFACE_API_KEY);

console.log('✅ Supabase client initialized');
console.log('✅ Hugging Face AI initialized (Qwen 2.5 - FREE)\n');

app.post('/api/search', async (req, res) => {
  const { query } = req.body;

  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: 'Query is required' });
  }

  console.log(`\n🔍 Searching for: "${query}"`);

  try {
    // Check cache first
    const { data: existingResults } = await supabase
      .from('providers')
      .select('*')
      .or(`name.ilike.%${query}%,tags.cs.{${query.toLowerCase()}}`)
      .limit(10);

    if (existingResults && existingResults.length > 0) {
      console.log(`✅ Found ${existingResults.length} cached results`);
      return res.status(200).json({
        results: existingResults,
        source: 'cache',
        message: `Found ${existingResults.length} cached alternatives`
      });
    }

    console.log('🤖 Asking Hugging Face AI (FREE) to search...');

    const prompt = `Find 5-8 truly free or open-source alternatives to "${query}".

CRITICAL REQUIREMENTS:
- Must be 100% FREE (no trials, no freemium, no subscriptions, no paid tiers)
- Must be actively maintained
- Must have a real, accessible website
- Only PERMANENTLY free or open-source software

Return ONLY valid JSON array, nothing else:
[
  {
    "name": "Tool Name",
    "url": "https://example.com",
    "category": "Category Name",
    "description": "Brief description under 100 chars",
    "tags": ["tag1", "tag2", "tag3"]
  }
]`;

    let fullResponse = '';
    
    for await (const chunk of hf.chatCompletionStream({
      model: "Qwen/Qwen2.5-Coder-32B-Instruct",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that finds free and open-source software. Always respond with valid JSON only, no markdown, no extra text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    })) {
      if (chunk.choices && chunk.choices[0]?.delta?.content) {
        fullResponse += chunk.choices[0].delta.content;
      }
    }

    console.log('📝 Hugging Face Response received');
    
    // Clean response
    let jsonText = fullResponse.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('❌ No valid JSON found');
      console.log('Response preview:', fullResponse.substring(0, 200));
      return res.status(200).json({
        results: [],
        source: 'ai',
        message: 'No free alternatives found'
      });
    }

    const alternatives = JSON.parse(jsonMatch[0]);
    console.log(`✅ Found ${alternatives.length} alternatives`);

    if (alternatives.length === 0) {
      return res.status(200).json({
        results: [],
        source: 'ai',
        message: 'No free alternatives found'
      });
    }

    const records = alternatives.map(alt => ({
      name: alt.name,
      url: alt.url,
      category: alt.category,
      short_description: alt.description,
      tags: [...(alt.tags || []), query.toLowerCase()]
    }));

    console.log('💾 Saving to database...');
    const { data: savedData, error: saveError } = await supabase
      .from('providers')
      .upsert(records, {
        onConflict: 'name',
        ignoreDuplicates: false
      })
      .select();

    if (saveError) {
      console.error('❌ Error saving to DB:', saveError);
    } else {
      console.log('✅ Saved to database');
    }

    return res.status(200).json({
      results: savedData || alternatives,
      source: 'ai',
      message: `Found ${alternatives.length} new alternatives`
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    return res.status(500).json({
      error: 'Search failed',
      details: error.message
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    ai: 'Hugging Face Qwen 2.5 (FREE)'
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/search`);
  console.log(`🤖 AI Model: Hugging Face Qwen 2.5 Coder (100% FREE)\n`);
});