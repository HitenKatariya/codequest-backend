function requiredEnv(name) {
  let value = process.env[name];
  if (!value) {
    const error = new Error(`Missing required env var: ${name}`);
    error.statusCode = 500;
    throw error;
  }
  value = String(value).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

function buildHeaders() {
  const apiKey = requiredEnv('GROQ_API_KEY');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
}

async function parseGroqError(response) {
  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const message =
    payload?.error?.message ||
    payload?.message ||
    response.statusText ||
    'Groq API request failed';

  if (response.status === 401) {
    return {
      statusCode: 401,
      message: 'Groq authentication failed. Verify GROQ_API_KEY is correct and active.',
    };
  }

  if (response.status === 429) {
    return {
      statusCode: 429,
      message: 'Groq rate limit exceeded. Please try again later.',
    };
  }

  const statusCode =
    typeof response.status === 'number' && response.status >= 400 && response.status <= 599
      ? response.status
      : 502;

  return { statusCode, message: `Groq API error (${response.status}): ${message}` };
}

export async function callGroqText({ system, user, model }) {
  const usedModel = model || process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
    const parsed = await parseGroqError(response);
    const error = new Error(parsed.message);
    error.statusCode = parsed.statusCode;
    throw error;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    const error = new Error('Groq API returned empty response');
    error.statusCode = 502;
    throw error;
  }

  return String(content).trim();
}

export async function callGroqJson({ system, user, schemaHint, model }) {
  // Groq is OpenAI-compatible; we can try response_format json_object where supported.
  const usedModel = model || process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

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
    response_format: { type: 'json_object' },
  };

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const parsed = await parseGroqError(response);
    const error = new Error(parsed.message);
    error.statusCode = parsed.statusCode;
    throw error;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    const error = new Error('Groq API returned empty response');
    error.statusCode = 502;
    throw error;
  }

  try {
    return JSON.parse(content);
  } catch {
    // Fallback: try to extract a JSON object from extra text.
    const s = String(content).trim();
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(s.slice(start, end + 1));
    }
    const error = new Error('Groq returned invalid JSON. Please try again.');
    error.statusCode = 502;
    throw error;
  }
}
