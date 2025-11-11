const Course = require('../models/Course');
const GPTLog = require('../models/GPTLog');
const mongoose = require('mongoose');
const { callOpenAI } = require('../utils/openaiClient');

// Recommend courses using OpenAI
exports.recommendCourses = async (req, res) => {
  const startTime = Date.now();
  let logData = {
    userId: req.user?.id || null,
    prompt: '',
    promptLength: 0,
    maxSuggestions: 5,
    tokensUsed: 0,
    success: false,
    errorMessage: null,
    ipAddress: req.ip || req.connection.remoteAddress,
  };

  try {
    const { prompt, maxSuggestions = 5 } = req.body;

    // Validate prompt
    if (!prompt || typeof prompt !== 'string') {
      logData.errorMessage = 'Invalid prompt';
      await GPTLog.create(logData);
      return res.status(400).json({ message: 'Please provide a valid prompt' });
    }

    if (prompt.length < 5) {
      logData.prompt = prompt;
      logData.promptLength = prompt.length;
      logData.errorMessage = 'Prompt too short';
      await GPTLog.create(logData);
      return res.status(400).json({ message: 'Prompt must be at least 5 characters long' });
    }

    if (prompt.length > 500) {
      logData.prompt = prompt.substring(0, 100);
      logData.promptLength = prompt.length;
      logData.errorMessage = 'Prompt too long';
      await GPTLog.create(logData);
      return res.status(400).json({ message: 'Prompt must not exceed 500 characters' });
    }

    // Update log data
    logData.prompt = prompt.substring(0, 200); // Store first 200 chars
    logData.promptLength = prompt.length;
    logData.maxSuggestions = parseInt(maxSuggestions);

    // Validate maxSuggestions
    const maxSuggestionsNum = parseInt(maxSuggestions);
    if (maxSuggestionsNum < 1 || maxSuggestionsNum > 10) {
      logData.errorMessage = 'Invalid maxSuggestions';
      await GPTLog.create(logData);
      return res.status(400).json({ message: 'maxSuggestions must be between 1 and 10' });
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      logData.errorMessage = 'OpenAI API key not configured';
      await GPTLog.create(logData);
      return res.status(500).json({
        message: 'OpenAI API key not configured',
      });
    }

    // Prepare system prompt that give exactly n suggestions
    const systemPrompt = `You are a course recommendation assistant. Given a user's learning goal or interest, recommend EXACTLY ${maxSuggestionsNum} relevant courses.

Return your response as ONLY a valid JSON array of EXACTLY ${maxSuggestionsNum} objects with the following structure:
[
  {
    "title": "Course Title 1",
    "reason": "Brief explanation why this course is recommended"
  },
  {
    "title": "Course Title 2",
    "reason": "Brief explanation why this course is recommended"
  }
  // Continue with exactly ${maxSuggestionsNum} unique items. Do not output less or more.
]

Focus on practical, relevant courses that match the user's goal. Be specific and concise. NO additional text, introductions, explanations, or markdown outside the JSON array.`;

    // Call OpenAI API
    let openAIResponse;
    try {
      openAIResponse = await callOpenAI(prompt, {
        systemPrompt,
        model: 'gpt-3.5-turbo',
        maxTokens: 1500,  // Increased for more output
        temperature: 0.3,  // Lowered for less creativity, more adherence to "exactly n"
        jsonMode: true,
      });
    } catch (apiError) {
      console.error('OpenAI API Error:', apiError.message);
      logData.errorMessage = apiError.message;
      await GPTLog.create(logData);
      return res.status(500).json({
        message: 'Failed to get recommendations from OpenAI',
        error: apiError.message,
      });
    }

    const aiContent = openAIResponse.content;  
    const rawContent = openAIResponse.rawContent;
    const tokensUsed = openAIResponse.tokensUsed;
    logData.tokensUsed = tokensUsed;

    console.log('AI RAW RESPONSE:', rawContent);
    console.log('AI PARSED CONTENT:', aiContent);

    // Improved parsing of AI response
    let suggestions = [];
    try {
      if (Array.isArray(aiContent)) {
        suggestions = aiContent;
      } else if (typeof aiContent === 'string') {
        // Enhanced extraction of JSON array from string
        const jsonMatch = rawContent.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        } else {
          suggestions = JSON.parse(aiContent);
        }
      } else if (aiContent && typeof aiContent === 'object') {
        suggestions = Array.isArray(aiContent) ? aiContent : [aiContent];
      }

      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error('AI response is not a valid array');
      }

      // Enforce minimum length by adding generic suggestions if needed
      while (suggestions.length < maxSuggestionsNum) {
        suggestions.push({
          title: "General Introduction to the Topic",
          reason: "Foundational course to build basic understanding."
        });
      }

      // Limit to exact number
      suggestions = suggestions.slice(0, maxSuggestionsNum);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', rawContent);
      logData.errorMessage = 'Failed to parse AI response';
      await GPTLog.create(logData);
      return res.status(500).json({
        message: 'Failed to parse AI response',
        rawResponse: rawContent,
      });
    }

    // Match suggestions to actual courses in database
    const recommendations = await Promise.all(
      suggestions.map(async (suggestion) => {
        // Try to find matching course by title
        const matchedCourses = await Course.find({
          title: { $regex: suggestion.title, $options: 'i' },
        })
          .select('_id title description')
          .limit(3);

        if (matchedCourses.length > 0) {
          // Found matching courses
          return {
            suggested_title: suggestion.title,
            reason: suggestion.reason,
            matched: true,
            courses: matchedCourses.map((course) => ({
              id: course._id,
              title: course.title,
              description: course.description,
            })),
          };
        } else {
          // No matching course found
          return {
            suggested_title: suggestion.title,
            reason: suggestion.reason,
            matched: false,
            courses: [],
          };
        }
      })
    );

    // Mark as successful
    logData.success = true;

    // Save log to db
    await GPTLog.create(logData);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      recommendations,
      tokensUsed,
      totalSuggestions: recommendations.length,
      usageInfo: req.gptUsageInfo || null,
      processingTime: `${processingTime}ms`,
    });
  } catch (error) {
    console.error('Server error in recommendCourses:', error);
    
    logData.errorMessage = error.message;
    await GPTLog.create(logData);
    
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get GPT usage statistics (admin/user)
exports.getUsageStats = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Ensure userId is a valid ObjectId
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Get user's total calls
    const totalCalls = await GPTLog.countDocuments({ userId: userObjectId });

    // Get successful calls
    const successfulCalls = await GPTLog.countDocuments({
      userId: userObjectId,
      success: true,
    });

    // Get total tokens used
    const tokenStats = await GPTLog.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$tokensUsed' },
          avgTokens: { $avg: '$tokensUsed' },
        },
      },
    ]);

    // Get recent logs
    const recentLogs = await GPTLog.find({ userId: userObjectId })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('promptLength tokensUsed success timestamp');

    res.status(200).json({
      success: true,
      stats: {
        totalCalls,
        successfulCalls,
        failedCalls: totalCalls - successfulCalls,
        remainingCalls: Math.max(0, 250 - totalCalls),
        limit: 250,
        totalTokens: tokenStats[0]?.totalTokens || 0,
        avgTokens: Math.round(tokenStats[0]?.avgTokens || 0),
      },
      recentLogs,
    });
  } catch (error) {
    console.error('Error fetching GPT stats:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};