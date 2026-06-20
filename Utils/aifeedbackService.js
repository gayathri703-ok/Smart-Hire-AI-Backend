const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate AI-powered resume feedback comparing resume text to a job description
 */
async function generateAIFeedback(resumeText, jobDescription, atsScore) {
  const prompt = `You are an expert resume reviewer and career coach. Analyze this resume against the job description and provide actionable, specific feedback.

RESUME:
${resumeText.slice(0, 3000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 1500)}

CALCULATED ATS SCORE: ${atsScore}/100

Respond ONLY with valid JSON in this exact structure, no markdown, no extra text:
{
  "summary": "A 2-3 sentence overall assessment of fit for this role",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": [
    {"area": "short title", "suggestion": "specific actionable advice", "priority": "high|medium|low"}
  ],
  "rewriteSuggestions": [
    {"original": "a weak phrase or bullet point pattern found in the resume", "improved": "a stronger rewritten version"}
  ],
  "missingKeywords": ["keyword1", "keyword2"],
  "overallVerdict": "one punchy sentence verdict"
}

Keep strengths to 3 items, improvements to 4 items, rewriteSuggestions to 2 items, missingKeywords to 6 items max. Be specific and reference actual content from the resume, not generic advice.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a precise, helpful resume reviewer. Always respond with valid JSON only, no markdown formatting, no code fences.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 1200,
      response_format: { type: 'json_object' }
    });

    const raw = completion.choices[0].message.content;
    const parsed = JSON.parse(raw);
    return { success: true, data: parsed };
  } catch (err) {
    console.error('❌ AI feedback error:', err.message);
    return {
      success: false,
      message: err.message.includes('API key')
        ? 'OpenAI API key is invalid or missing'
        : 'AI feedback temporarily unavailable, please try again'
    };
  }
}

module.exports = { generateAIFeedback };