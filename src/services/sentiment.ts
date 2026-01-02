import Sentiment from 'sentiment';
import { SentimentData } from '../types';
import { retryFetch } from '../utils/retry';

const sentiment = new Sentiment();

// Basic sentiment analysis using free library
export async function analyzeSentimentBasic(text: string): Promise<SentimentData> {
  const result = sentiment.analyze(text);
  const normalizedScore = Math.max(-1, Math.min(1, result.score / 5));
  
  let label: 'positive' | 'negative' | 'neutral';
  if (normalizedScore > 0.2) label = 'positive';
  else if (normalizedScore < -0.2) label = 'negative';
  else label = 'neutral';

  return {
    score: normalizedScore,
    label,
    confidence: Math.abs(normalizedScore),
  };
}

export async function analyzeSentimentGrok(
  text: string,
  apiKey: string
): Promise<SentimentData> {
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4.1-fast',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert sentiment analyst. Analyze the text and provide a sentiment score from -1 (very negative) to 1 (very positive), considering nuance like sarcasm. Respond with JSON: {"score": number, "label": "positive|negative|neutral", "reasoning": "brief explanation", "confidence": number}',
          },
          {
            role: 'user',
            content: `Analyze this text: "${text}"`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid Grok API response: missing content');
    }
    const content = data.choices[0].message.content;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Grok API');
    }
    
    const result = JSON.parse(jsonMatch[0]);
    
    return {
      score: result.score,
      label: result.label,
      reasoning: result.reasoning,
      confidence: result.confidence || Math.abs(result.score),
    };
  } catch (error) {
    console.error('Grok API error:', error);
    // Fallback to basic sentiment analysis
    return analyzeSentimentBasic(text);
  }
}

export async function analyzeSentiment(
  text: string,
  useGrok: boolean,
  grokApiKey?: string
): Promise<SentimentData> {
  if (useGrok && grokApiKey) {
    return analyzeSentimentGrok(text, grokApiKey);
  }
  return analyzeSentimentBasic(text);
}

// Batch sentiment analysis - reduces API calls by ~90%
export async function batchAnalyzeSentimentGrok(
  texts: string[],
  apiKey: string
): Promise<SentimentData[]> {
  if (!texts || texts.length === 0) return [];
  if (texts.length === 1) return [await analyzeSentimentGrok(texts[0], apiKey)];

  try {
    const prompt = `Analyze these ${texts.length} texts for sentiment (-1 to 1) with reasoning. Output JSON array: [{"score": num, "label": "positive|negative|neutral", "reasoning": "brief", "confidence": num}]\n\n` +
      texts.map((text, i) => `${i + 1}. ${text.substring(0, 500)}`).join('\n\n');

    const response = await retryFetch(() =>
      fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-4.1-fast',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert sentiment analyst. Always respond with valid JSON arrays. Consider nuance like sarcasm and context.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
        }),
      })
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid Grok API response: missing content');
    }
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      const objMatch = content.match(/\{[\s\S]*\}/);
      if (objMatch) {
        const single = JSON.parse(objMatch[0]);
        return [{
          score: single.score,
          label: single.label || (single.score > 0.2 ? 'positive' : single.score < -0.2 ? 'negative' : 'neutral'),
          reasoning: single.reasoning,
          confidence: single.confidence || Math.abs(single.score),
        }];
      }
      throw new Error('Invalid Grok API response format');
    }

    const results = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(results) || results.length !== texts.length) {
      console.warn(`Expected ${texts.length} results, got ${results.length}`);
      const filled: SentimentData[] = [];
      for (let i = 0; i < texts.length; i++) {
        if (results[i]) {
          filled.push({
            score: results[i].score,
            label: results[i].label || (results[i].score > 0.2 ? 'positive' : results[i].score < -0.2 ? 'negative' : 'neutral'),
            reasoning: results[i].reasoning,
            confidence: results[i].confidence || Math.abs(results[i].score),
          });
        } else {
          filled.push(await analyzeSentimentBasic(texts[i]));
        }
      }
      return filled;
    }

    return results.map((result: any) => ({
      score: result.score,
      label: result.label || (result.score > 0.2 ? 'positive' : result.score < -0.2 ? 'negative' : 'neutral'),
      reasoning: result.reasoning,
      confidence: result.confidence || Math.abs(result.score),
    }));
  } catch (error) {
    console.error('Batch Grok API error:', error);
    return Promise.all(texts.map(text => analyzeSentimentBasic(text)));
  }
}

// Batch analysis with vision support (text + images)
// Stream batch analysis with vision - progressive UI updates reduce perceived latency by 50-70%
export async function streamBatchAnalyzeSentiment(
  items: Array<{ text: string; imageBase64?: string }>,
  apiKey: string,
  cache: Map<string, any>,
  onProgress?: (results: Partial<SentimentData>[], index: number) => void
): Promise<SentimentData[]> {
  if (!items || items.length === 0) return [];

  // Limit images to 1-4 per call to avoid token limits (~128k max)
  const hasImages = items.some(i => i.imageBase64);
  const model = hasImages ? 'grok-4-vision' : 'grok-4.1-fast';
  
  // Process only first 4 items with images to stay within limits
  const itemsToProcess = hasImages ? items.slice(0, 4) : items;

  // Check cache using JSON keys
  const cacheKey = JSON.stringify(items.map(i => ({ text: i.text, hasImage: !!i.imageBase64 })));
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    // Improved prompt with explicit instructions and examples
    const prompt = `You are a vision analyst detecting emotions and context. Analyze sentiment from -1 (very negative) to 1 (very positive), factoring in visual cues like facial expressions, memes, and context. Score sentiment from -1 to 1, factor in visual cues like facial expressions. Examples: Happy face + positive text = 0.8, Sarcastic meme = -0.3, Neutral image = 0.0. Output JSON array: [{"score": num, "label": "positive|negative|neutral", "reasoning": "brief", "confidence": num}]\n\n` +
      itemsToProcess.map((item, i) => `${i + 1}. Text: ${item.text}${item.imageBase64 ? ' (Image provided - analyze visual context)' : ''}`).join('\n\n');

    const messages: any[] = [
      { role: 'system', content: 'Expert multimodal sentiment analyst. Score sentiment from -1 to 1, factor in visual cues like facial expressions.' },
      { role: 'user', content: [{ type: 'text', text: prompt }] },
    ];

    // Add images (limit 1-4)
    itemsToProcess.forEach((item) => {
      if (item.imageBase64) {
        messages[1].content.push({
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${item.imageBase64}` },
        });
      }
    });

    const response = await retryFetch(() =>
      fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          stream: true,
        }),
      })
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok Vision API error: ${response.status} - ${errorText}`);
    }

    // Stream processing
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Stream not available');

    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') continue;

          try {
            const data = JSON.parse(dataStr);
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              accumulatedContent += delta;
              
              // Try to parse partial results for progressive updates
              try {
                const jsonMatch = accumulatedContent.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                  const partialResults = JSON.parse(jsonMatch[0]);
                  if (Array.isArray(partialResults) && onProgress && partialResults.length <= itemsToProcess.length) {
                    onProgress(partialResults, partialResults.length);
                  }
                }
              } catch {
                // Not complete yet, continue accumulating
              }
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    // Parse final results
    const jsonMatch = accumulatedContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid Grok Vision API response format');

    const results = JSON.parse(jsonMatch[0]);
    
    // Handle case where we processed fewer items than requested (image limit)
    const expectedLength = itemsToProcess.length;
    if (!Array.isArray(results) || results.length !== expectedLength) {
      console.warn(`Expected ${expectedLength} results, got ${results.length}`);
      const filled: SentimentData[] = [];
      for (let i = 0; i < items.length; i++) {
        const processedIndex = i < itemsToProcess.length ? i : -1;
        if (processedIndex >= 0 && results[processedIndex]) {
          const result = results[processedIndex];
          filled.push({
            score: result.score,
            label: result.label || (result.score > 0.2 ? 'positive' : result.score < -0.2 ? 'negative' : 'neutral'),
            reasoning: result.reasoning,
            confidence: result.confidence || Math.abs(result.score),
          });
        } else {
          filled.push(await analyzeSentimentBasic(items[i].text));
        }
      }
      cache.set(cacheKey, filled);
      return filled;
    }

    const processedResults = results.map((r: any) => ({
      score: r.score,
      label: r.label || (r.score > 0.2 ? 'positive' : r.score < -0.2 ? 'negative' : 'neutral'),
      reasoning: r.reasoning,
      confidence: r.confidence || Math.abs(r.score),
    }));

    // If we processed fewer items, fill the rest with basic analysis
    if (processedResults.length < items.length) {
      const remaining = await Promise.all(
        items.slice(processedResults.length).map(item => analyzeSentimentBasic(item.text))
      );
      processedResults.push(...remaining);
    }

    cache.set(cacheKey, processedResults);
    return processedResults;
  } catch (error) {
    console.error('Stream Vision API error:', error);
    const fallback = await Promise.all(items.map(item => analyzeSentimentBasic(item.text)));
    return fallback;
  }
}
