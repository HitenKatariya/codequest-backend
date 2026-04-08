function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    const error = new Error(`Missing required env var: ${name}`);
    error.statusCode = 500;
    throw error;
  }
  return value;
}

function buildHeaders() {
  const apiKey = requiredEnv('OPENAI_API_KEY');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
}

export async function callOpenAIJson({ system, user, schemaHint, model }) {
  const usedModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const body = {
    model: usedModel,
    temperature: 0.2,
    messages: [
      { role: 'system', content: system },
      {
        role: 'user',
        content: schemaHint ? `${user}\n\nReturn JSON only. Schema: ${schemaHint}` : user,
      },
    ],
    // Works on many OpenAI-compatible endpoints; if unsupported, server will ignore.
    response_format: { type: 'json_object' },
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const error = new Error(`OpenAI API error (${response.status}): ${text || response.statusText}`);
    error.statusCode = 502;
    throw error;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    const error = new Error('OpenAI API returned empty response');
    error.statusCode = 502;
    throw error;
  }

  try {
    return JSON.parse(content);
  } catch {
    const error = new Error('OpenAI response was not valid JSON');
    error.statusCode = 502;
    error.raw = content;
    throw error;
  }
}

export async function callOpenAIText({ system, user, model }) {
  const usedModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model: usedModel,
      temperature: 0.3,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const error = new Error(`OpenAI API error (${response.status}): ${text || response.statusText}`);
    error.statusCode = 502;
    throw error;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    const error = new Error('OpenAI API returned empty response');
    error.statusCode = 502;
    throw error;
  }

  return content;
}
