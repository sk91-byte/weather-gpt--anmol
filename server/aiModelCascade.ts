import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export interface ModelMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ModelCallOptions {
  messages: ModelMessage[];
  systemPrompt: string;
  role?: string;
  language?: string;
  requestedModel?: string; // e.g. 'auto', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant', etc.
  getGeminiClient: () => GoogleGenAI | null;
}

export interface ModelResponse {
  text: string;
  modelUsed: string;
  provider: string;
  latencyMs: number;
}

// User-specified cascade priority
export const MODEL_CASCADE_PRIORITY = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'qwen/qwen3.6-27b',
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'gemini-fallback'
] as const;

export type CascadeModelName = (typeof MODEL_CASCADE_PRIORITY)[number] | 'auto';

/**
 * Configure max tokens and strict concise instructions based on user role
 */
export function getRoleConstraints(role: string = 'citizen') {
  const normalizedRole = role.toLowerCase();

  if (normalizedRole === 'researcher' || normalizedRole === 'meteorologist') {
    return {
      maxTokens: 550,
      temperature: 0.2,
      roleDirective: `[ROLE: RESEARCHER & METEOROLOGIST]
Provide deep, authoritative meteorological analysis. Include barometric pressure trends, dewpoint depression, convective instability indices, precipitation accumulation curves, and comparison between NWP models (GFS vs ECMWF vs IMD WRF). Use clean markdown.`
    };
  }

  if (normalizedRole === 'agricultural-advisor' || normalizedRole === 'farmer') {
    return {
      maxTokens: 160,
      temperature: 0.2,
      roleDirective: `[ROLE: FARMER ADVISOR]
Keep it practical and action-oriented for farmers (under 75 words, 2-3 bullet points). Highlight:
1. Rain forecast & probability today
2. Irrigation advice (hold or irrigate)
3. Pesticide/fertilizer spraying suitability.`
    };
  }

  if (normalizedRole === 'commute-concierge' || normalizedRole === 'traveller') {
    return {
      maxTokens: 160,
      temperature: 0.2,
      roleDirective: `[ROLE: COMMUTE CONCIERGE]
Keep it fast and commuter-focused (under 70 words, 2-3 bullet points). Highlight:
1. Road & commute safety index
2. Waterlogging risk on key underpasses
3. Best departure window.`
    };
  }

  if (normalizedRole === 'disaster-strategist') {
    return {
      maxTokens: 180,
      temperature: 0.1,
      roleDirective: `[ROLE: DISASTER & FLOOD RESILIENCE STRATEGIST]
Prioritize life-safety and emergency protocol. Highlight immediate warning severity, safe zones, helpline (NDMA 1078 / 112), and flood mitigation.`
    };
  }

  // DEFAULT FOR EVERYDAY CITIZENS (AAM NAGRIK)
  return {
    maxTokens: 110,
    temperature: 0.2,
    roleDirective: `[ROLE: CITIZEN - EVERYDAY COMMUTE & WEATHER]
CRITICAL MANDATE FOR CITIZEN:
- BE ULTRA-CONCISE, FAST, AND DIRECT.
- DO NOT WRITE LONG ESSAYS OR SCIENTIFIC METEOROLOGY ESSAYS.
- MAXIMUM 2 TO 3 SHORT CONVERSATIONAL SENTENCES (OR 2 SNAPPY BULLET POINTS), UNDER 50 WORDS TOTAL.
- Immediately answer the user's specific question first (e.g. will it rain, carry umbrella, temperature, safe to go out).
- Talk in friendly, natural everyday spoken phrasing.`
  };
}

/**
 * Call OpenAI-compatible Chat Completion API (OpenRouter, Groq, or custom endpoint)
 */
async function callOpenAICompatible(
  model: string,
  systemPrompt: string,
  messages: ModelMessage[],
  maxTokens: number,
  temperature: number,
  timeoutMs: number = 3200
): Promise<{ text: string; provider: string } | null> {
  // Determine provider & credentials
  const isGroqNative = model.startsWith('llama-3.1') || model.startsWith('llama-3.3');
  const groqApiKey = process.env.GROQ_API_KEY;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const genericOpenAiKey = process.env.OPENAI_API_KEY;
  const customBaseUrl = process.env.OPENAI_BASE_URL;

  let endpoint = '';
  let apiKey = '';
  let providerName = '';
  let requestModel = model;

  if (isGroqNative && groqApiKey) {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    apiKey = groqApiKey;
    providerName = 'Groq';
    requestModel = model; // e.g. 'llama-3.1-8b-instant'
  } else if (openRouterApiKey) {
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    apiKey = openRouterApiKey;
    providerName = 'OpenRouter';
    requestModel = model; // OpenRouter supports 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b', 'meta-llama/llama-3.1-8b-instruct', etc.
  } else if (customBaseUrl && genericOpenAiKey) {
    endpoint = `${customBaseUrl.replace(/\/+$/, '')}/chat/completions`;
    apiKey = genericOpenAiKey;
    providerName = 'Custom-OpenAI';
    requestModel = model;
  } else if (genericOpenAiKey) {
    endpoint = 'https://api.openai.com/v1/chat/completions';
    apiKey = genericOpenAiKey;
    providerName = 'OpenAI';
    requestModel = model;
  } else if (groqApiKey) {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    apiKey = groqApiKey;
    providerName = 'Groq';
    requestModel = model.includes('llama') ? model : 'llama-3.1-8b-instant';
  } else {
    // No compatible key configured
    return null;
  }

  const payload = {
    model: requestModel,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-6).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    ],
    max_tokens: maxTokens,
    temperature: temperature,
    stream: false
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://ai.studio/build',
        'X-Title': 'WeatherGPT'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.warn(`[${providerName}] ${requestModel} error (${res.status}):`, errBody.slice(0, 160));
      return null;
    }

    const json = (await res.json()) as any;
    const reply = json.choices?.[0]?.message?.content?.trim();
    if (reply) {
      return { text: reply, provider: providerName };
    }
  } catch (err: any) {
    clearTimeout(timer);
    console.warn(`[${providerName || 'API'}] ${requestModel} request failed or timed out (${err.message})`);
  }

  return null;
}

/**
 * Call Gemini fallback (ultra-fast flash-lite)
 */
async function callGeminiFallback(
  getGeminiClient: () => GoogleGenAI | null,
  systemPrompt: string,
  messages: ModelMessage[],
  maxTokens: number,
  timeoutMs: number = 3500
): Promise<{ text: string; provider: string } | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const contents = messages.slice(-6).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // If contents is empty or only system, add a dummy user prompt
    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'Current weather inquiry' }] });
    }

    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents,
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        maxOutputTokens: maxTokens,
        temperature: 0.2
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini call exceeded timeout')), timeoutMs)
    );

    const response = await Promise.race([aiPromise, timeoutPromise]);
    clearTimeout(timer);

    const text = response.text?.trim();
    if (text) {
      return { text, provider: 'Google Gemini (3.1 Flash Lite)' };
    }
  } catch (err: any) {
    clearTimeout(timer);
    console.warn('[Gemini Fallback] call failed or timed out:', err.message);
  }

  return null;
}

/**
 * Execute the multi-model cascade with fast timeouts
 */
export async function executeModelCascade(options: ModelCallOptions): Promise<ModelResponse | null> {
  const startTime = Date.now();
  const { messages, systemPrompt, role = 'citizen', requestedModel = 'auto', getGeminiClient } = options;

  const { maxTokens, temperature, roleDirective } = getRoleConstraints(role);
  const fullSystemPrompt = `${systemPrompt}\n\n${roleDirective}`;

  // If a specific model was requested by the user, test it first
  const modelsToAttempt: string[] = [];

  if (requestedModel && requestedModel !== 'auto') {
    modelsToAttempt.push(requestedModel);
  }

  // Add the user's priority cascade list
  for (const m of MODEL_CASCADE_PRIORITY) {
    if (!modelsToAttempt.includes(m)) {
      modelsToAttempt.push(m);
    }
  }

  // Iterate through cascade
  for (const modelName of modelsToAttempt) {
    if (modelName === 'gemini-fallback' || modelName.startsWith('gemini')) {
      const geminiRes = await callGeminiFallback(getGeminiClient, fullSystemPrompt, messages, maxTokens);
      if (geminiRes) {
        return {
          text: geminiRes.text,
          modelUsed: 'gemini-3.1-flash-lite',
          provider: geminiRes.provider,
          latencyMs: Date.now() - startTime
        };
      }
      continue;
    }

    // Attempt OpenAI/Groq/OpenRouter model with strict 2.8s timeout
    const result = await callOpenAICompatible(
      modelName,
      fullSystemPrompt,
      messages,
      maxTokens,
      temperature,
      2800
    );

    if (result) {
      return {
        text: result.text,
        modelUsed: modelName,
        provider: result.provider,
        latencyMs: Date.now() - startTime
      };
    }
  }

  return null;
}
