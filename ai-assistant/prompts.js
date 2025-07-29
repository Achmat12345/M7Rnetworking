
// M7Rnetworking AI Assistant Prompt Templates
module.exports = {
  // Product Description Generation
  productDescription: (productName, category, features) => `
    Create a compelling product description for "${productName}", a ${category} product.
    
    Key features: ${features.join(', ')}
    
    Requirements:
    - Write in an engaging, sales-oriented tone
    - Highlight unique selling points
    - Include emotional triggers for South African creators
    - Keep it between 100-200 words
    - Focus on benefits, not just features
    - Make it SEO-friendly with relevant keywords
  `,

  // Store Branding
  storeBranding: (storeName, niche, targetAudience) => `
    Create a complete brand identity for "${storeName}", targeting ${targetAudience} in the ${niche} niche.
    
    Provide:
    1. Brand mission statement (1-2 sentences)
    2. Brand voice description
    3. Key brand values (3-5 points)
    4. Unique value proposition
    5. Brand personality traits
    6. Suggested tagline options (3-5 options)
    
    Context: This is for a South African creator building their online store.
  `,

  // Marketing Copy Generation
  marketingCopy: (product, platform, goal) => `
    Write marketing copy for "${product}" to be used on ${platform}.
    
    Goal: ${goal}
    
    Requirements:
    - Platform-specific tone and format
    - Include relevant hashtags if applicable
    - Call-to-action that drives ${goal}
    - Localized for South African audience
    - Engaging and shareable content
  `,

  // SEO Content
  seoContent: (topic, keywords, contentType) => `
    Create ${contentType} about "${topic}" optimized for these keywords: ${keywords.join(', ')}.
    
    Requirements:
    - Natural keyword integration
    - Informative and valuable content
    - Proper heading structure
    - Meta description (150-160 characters)
    - Focus on South African market context
  `,

  // Product Ideas Generation
  productIdeas: (niche, budget, audience) => `
    Generate 10 creative product ideas for the ${niche} market.
    
    Parameters:
    - Target audience: ${audience}
    - Budget range: ${budget}
    - Focus on digital and physical products
    - Consider South African market trends
    - Include brief descriptions and profit potential
    - Suggest pricing strategies
  `,

  // Store Design Suggestions
  storeDesign: (brand, products, style) => `
    Suggest store design elements for "${brand}" selling ${products.join(', ')}.
    
    Preferred style: ${style}
    
    Provide:
    1. Color palette (primary, secondary, accent colors)
    2. Typography suggestions
    3. Layout recommendations
    4. Visual elements and imagery style
    5. User experience improvements
    6. Mobile optimization tips
  `,

  // Social Media Strategy
  socialStrategy: (brand, platforms, goals) => `
    Create a 30-day social media strategy for "${brand}".
    
    Platforms: ${platforms.join(', ')}
    Goals: ${goals.join(', ')}
    
    Include:
    1. Content pillars (4-5 themes)
    2. Posting frequency per platform
    3. Content types and formats
    4. Engagement strategies
    5. Hashtag strategies
    6. Growth tactics specific to South African audience
  `,

  // Email Marketing
  emailMarketing: (purpose, audience, product) => `
    Write an email for ${purpose} targeting ${audience} about "${product}".
    
    Requirements:
    - Compelling subject line (50 characters max)
    - Personal and conversational tone
    - Clear call-to-action
    - Mobile-friendly format
    - South African cultural context
  `,

  // Business Strategy
  businessStrategy: (businessType, goals, timeline) => `
    Create a business strategy for a ${businessType} business.
    
    Goals: ${goals.join(', ')}
    Timeline: ${timeline}
    
    Provide:
    1. Market analysis for South Africa
    2. Revenue stream suggestions
    3. Growth milestones
    4. Risk assessment
    5. Action plan with priorities
    6. Resource requirements
  `,

  // Content Calendar
  contentCalendar: (brand, period, themes) => `
    Create a ${period} content calendar for "${brand}".
    
    Content themes: ${themes.join(', ')}
    
    Include:
    1. Daily content ideas
    2. Content types (posts, stories, videos)
    3. Platform-specific adaptations
    4. Seasonal/cultural events (South African calendar)
    5. Hashtag suggestions
    6. Engagement prompts
  `,

  // Pricing Strategy
  pricingStrategy: (product, market, competition) => `
    Develop a pricing strategy for "${product}" in the ${market} market.
    
    Competition analysis: ${competition}
    
    Consider:
    1. Cost-plus pricing model
    2. Value-based pricing
    3. Competitor analysis
    4. Psychological pricing tactics
    5. South African economic factors
    6. Profit margin optimization
  `,

  // Custom Business Advice
  businessAdvice: (situation, challenge, goals) => `
    Provide business advice for this situation: "${situation}"
    
    Challenge: ${challenge}
    Goals: ${goals}
    
    Give:
    1. Problem analysis
    2. Actionable solutions (3-5 options)
    3. Implementation steps
    4. Success metrics
    5. Potential obstacles and mitigation
    6. Resources and tools needed
    
    Context: South African creator economy
  `,

  // Analytics Insights
  analyticsInsights: (data, timeframe, goals) => `
    Analyze this performance data and provide insights:
    ${JSON.stringify(data)}
    
    Timeframe: ${timeframe}
    Goals: ${goals.join(', ')}
    
    Provide:
    1. Key performance indicators
    2. Trends and patterns
    3. Areas for improvement
    4. Actionable recommendations
    5. Benchmarking insights
    6. Next steps for optimization
  `
};
