async function generateTaskDraft({ title, context }) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You write concise, practical task descriptions for project management software.'
          },
          {
            role: 'user',
            content: `Create a clear task description for the following title: ${title}. Context: ${context || 'No additional context provided.'}`
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI request failed: ${errorText}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || '';
  }

  const summary = [
    `Task: ${title}`,
    context ? `Context: ${context}` : 'Context: none provided',
    '',
    'Suggested description:',
    `- Objective: complete ${title.toLowerCase()}`,
    '- Scope: clarify deliverables, dependencies, and acceptance criteria',
    '- Outcome: produce a trackable task with a clear definition of done'
  ];

  return summary.join('\n');
}

module.exports = { generateTaskDraft };
