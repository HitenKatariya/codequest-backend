import { callOpenAIJson, callOpenAIText } from '../services/openai.js';

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function improveQuestion(req, res) {
  try {
    const title = normalizeText(req.body?.title);
    const body = normalizeText(req.body?.body);

    if (!title && !body) {
      return res.status(400).json({ message: 'title or body is required' });
    }

    const result = await callOpenAIJson({
      system:
        'You are a senior software engineer helping users write high-quality Stack Overflow style questions. Improve clarity, grammar, and structure. Do not change the technical meaning. Keep it concise.',
      user:
        `Improve this question.\n\nTITLE:\n${title}\n\nBODY:\n${body}`,
      schemaHint:
        '{"improvedTitle":"string","improvedBody":"string","notes":"string"}',
    });

    return res.status(200).json({
      improvedTitle: normalizeText(result.improvedTitle) || title,
      improvedBody: normalizeText(result.improvedBody) || body,
      notes: normalizeText(result.notes),
    });
  } catch (error) {
    console.error('AI improveQuestion error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'AI request failed',
    });
  }
}

export async function suggestTags(req, res) {
  try {
    const title = normalizeText(req.body?.title);
    const body = normalizeText(req.body?.body);

    if (!title && !body) {
      return res.status(400).json({ message: 'title or body is required' });
    }

    const result = await callOpenAIJson({
      system:
        'You suggest 3-5 short, lowercase programming tags. Use hyphens when helpful. Return only tags, no explanations.',
      user:
        `Suggest relevant tags for this question.\n\nTITLE:\n${title}\n\nBODY:\n${body}`,
      schemaHint: '{"tags":["string"]}',
    });

    const tags = Array.isArray(result.tags) ? result.tags : [];
    const normalized = tags
      .map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
      .filter(Boolean)
      .slice(0, 5);

    return res.status(200).json({ tags: normalized });
  } catch (error) {
    console.error('AI suggestTags error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'AI request failed',
    });
  }
}

export async function generateAnswer(req, res) {
  try {
    const title = normalizeText(req.body?.title);
    const body = normalizeText(req.body?.body);

    if (!title && !body) {
      return res.status(400).json({ message: 'title or body is required' });
    }

    const answer = await callOpenAIText({
      system:
        'You are a helpful programming assistant. Provide a clear, actionable answer. If details are missing, state assumptions and offer next steps. Use markdown.',
      user:
        `Generate a helpful answer for this question.\n\nTITLE:\n${title}\n\nBODY:\n${body}`,
    });

    return res.status(200).json({ answer });
  } catch (error) {
    console.error('AI generateAnswer error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'AI request failed',
    });
  }
}
