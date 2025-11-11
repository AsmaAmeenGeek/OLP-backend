const dotenv = require('dotenv');
dotenv.config();

//the key is expired so tried this to find, and after some time, so just to make sure it's loaded
console.log("OPENAI_API_KEY loaded:", process.env.OPENAI_API_KEY ? "Yes" : "No");

const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 seconds timeout
  maxRetries: 2,
});

/**
 * Call OpenAI Chat Completions API
 * @param {string} prompt - User prompt
 * @param {object} options - Configuration options
 * @param {string} options.systemPrompt - System prompt for the AI
 * @param {string} options.model - Model to use (default: gpt-3.5-turbo)
 * @param {number} options.maxTokens - Maximum tokens in response (default: 1000)
 * @param {number} options.temperature - Temperature for randomness (default: 0.7)
 * @param {boolean} options.jsonMode - Enable JSON mode (default: false)
 * @returns {Promise<object>} - Parsed response with content and metadata
 */
const callOpenAI = async (prompt, options = {}) => {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured in environment variables');
    }

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Invalid prompt: must be a non-empty string');
    }

    // Extract options with defaults
    const {
      systemPrompt = 'You are a helpful assistant.',
      model = 'gpt-3.5-turbo',
      maxTokens = 1000,
      temperature = 0.7,
      jsonMode = false,
    } = options;

    // Validate maxTokens
    if (maxTokens < 1 || maxTokens > 4000) {
      throw new Error('maxTokens must be between 1 and 4000');
    }

    // Validate temperature
    if (temperature < 0 || temperature > 2) {
      throw new Error('temperature must be between 0 and 2');
    }

    // Prepare messages
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    // Prepare request parameters
    const requestParams = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    // Enable JSON mode if requested (only for gpt-4-turbo-preview and later)
    if (jsonMode) {
      requestParams.response_format = { type: 'json_object' };
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create(requestParams);

    // Extract response
    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenAI API');
    }

    // Parse JSON if expected
    let parsedContent = content;
    if (jsonMode || content.trim().startsWith('{') || content.trim().startsWith('[')) {
      try {
        parsedContent = JSON.parse(content);
      } catch (parseError) {
        console.warn('Failed to parse OpenAI response as JSON:', content);
        // Return raw content if JSON parsing fails
        parsedContent = content;
      }
    }

    // Return response with metadata
    return {
      content: parsedContent,
      rawContent: content,
      tokensUsed: completion.usage?.total_tokens || 0,
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      model: completion.model,
      finishReason: completion.choices[0]?.finish_reason,
    };
  } catch (error) {
    // Handle OpenAI-specific errors
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || 'Unknown OpenAI API error';

      if (status === 401) {
        throw new Error('OpenAI API authentication failed: Invalid API key');
      } else if (status === 429) {
        throw new Error('OpenAI API rate limit exceeded: Too many requests');
      } else if (status === 500) {
        throw new Error('OpenAI API server error: Please try again later');
      } else {
        throw new Error(`OpenAI API error (${status}): ${message}`);
      }
    }

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      throw new Error('OpenAI API request timeout: Request took too long');
    }

    // throw with clear error message
    throw new Error(`OpenAI API call failed: ${error.message}`);
  }
};

module.exports = { callOpenAI };