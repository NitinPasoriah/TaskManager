const asyncHandler = require('../utils/asyncHandler');
const { generateTaskDraft } = require('../services/aiService');

const generateDescription = asyncHandler(async (req, res) => {
  const description = await generateTaskDraft({
    title: req.body.title,
    context: req.body.context
  });

  res.json({
    success: true,
    message: 'Task draft generated successfully',
    data: { description }
  });
});

module.exports = { generateDescription };
