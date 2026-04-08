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

async function parseOpenAIError(response) {
  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const apiError = payload?.error;
  const code = apiError?.code;
  const type = apiError?.type;
  const message = apiError?.message;

  // Provide friendlier messages for common production issues.
  if (response.status === 429 && (code === 'insufficient_quota' || type === 'insufficient_quota')) {
    return {
      statusCode: 402,
      message:
        'OpenAI quota exceeded for this API key. Add billing/credits in OpenAI, or use an API key from a project with available quota.',
      details: { code, type },
    };
  }

  if (response.status === 401) {
    return {
      statusCode: 401,
      message:
        'OpenAI authentication failed. Verify OPENAI_API_KEY is correct and active on the server environment.',
      details: { code, type },
    };
  }

  if (response.status === 403) {
    return {
      statusCode: 403,
      message:
        'OpenAI request was forbidden. Check your OpenAI project permissions and allowed models.',
      details: { code, type },
    };
  }

  return {
    statusCode: 502,
    message: `OpenAI API error (${response.status}): ${message || response.statusText}`,
    details: { code, type },
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
    const parsed = await parseOpenAIError(response);
    const error = new Error(parsed.message);
    error.statusCode = parsed.statusCode;
    error.details = parsed.details;
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
    const parsed = await parseOpenAIError(response);
    const error = new Error(parsed.message);
    error.statusCode = parsed.statusCode;
    error.details = parsed.details;
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
