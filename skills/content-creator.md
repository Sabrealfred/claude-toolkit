---
name: content-creator
description: Content creation expert for blogs, articles, marketing copy, social media. Includes research, tone analysis, SEO optimization, and multi-language support. Use for any content writing needs.
---

# Content Creator Skill

Professional content creation with research, tone matching, and SEO optimization.

## Available AI Tools

### Groq MCP (Fast AI)
- `mcp__groq__chat_completion` - Fast content generation
- `mcp__groq__compound_tool` - Web search + content creation

### Gemini MCP
- `mcp__gemini__gemini_chat` - High-quality writing
- `mcp__gemini__gemini_explain` - Explain complex topics simply

### Multi-Agent (Parallel Research)
- `mcp__multi-agent__spawn_agents` - Research multiple topics simultaneously
- `mcp__multi-agent__smart_spawn` - Auto-select best model per task

### OpenRouter
- `mcp__openrouter__chat_with_model` - Access to many writing models
- `mcp__openrouter__compare_models` - Compare outputs from different models

## Content Creation Workflow

### Step 1: Research Phase
```
Use multi-agent for parallel research:

spawn_agents({
  tasks: [
    { id: "research-1", task: "Research latest trends in [TOPIC]" },
    { id: "research-2", task: "Find statistics and data about [TOPIC]" },
    { id: "research-3", task: "Identify key influencers/sources on [TOPIC]" },
    { id: "research-4", task: "Find competitor content on [TOPIC]" },
    { id: "research-5", task: "Identify common questions about [TOPIC]" }
  ],
  model: "devstral-free",  // Fast and free for research
  systemPrompt: "You are a research assistant. Provide factual, well-sourced information."
})
```

### Step 2: Outline Creation
```
Based on research, create outline:

1. Hook/Introduction (grab attention)
2. Problem Statement (why this matters)
3. Main Points (3-5 sections)
4. Supporting Evidence (stats, quotes, examples)
5. Conclusion/CTA (actionable takeaway)
```

### Step 3: Draft Content
```
Use Gemini for high-quality first draft:

mcp__gemini__gemini_chat({
  prompt: `Write a [CONTENT TYPE] about [TOPIC].

  Target Audience: [AUDIENCE]
  Tone: [TONE]
  Length: [WORD COUNT]
  Key Points to Cover:
  - Point 1
  - Point 2
  - Point 3

  Include: [specific elements like stats, quotes, examples]
  Avoid: [what not to include]`,
  model: "3-pro"  // Best quality
})
```

### Step 4: Optimize & Polish
```
Use Groq for fast iterations:

mcp__groq__chat_completion({
  messages: [
    { role: "system", content: "You are an expert editor and SEO specialist." },
    { role: "user", content: `Improve this content for [GOAL]:

    [DRAFT CONTENT]

    Optimize for:
    - Readability (short paragraphs, clear language)
    - SEO (keywords: [KEYWORDS])
    - Engagement (hooks, transitions)
    - CTA (clear call to action)` }
  ]
})
```

## Tone Guidelines

### Professional/Corporate
- Formal language
- Third person
- Data-driven
- Industry terminology
- Confident but not arrogant

### Casual/Friendly
- Conversational
- Second person (you/your)
- Relatable examples
- Humor when appropriate
- Contractions OK

### Technical/Educational
- Clear explanations
- Step-by-step format
- Code examples if relevant
- Definitions for jargon
- Visual aids mentioned

### Persuasive/Marketing
- Benefit-focused
- Emotional triggers
- Social proof
- Urgency/scarcity
- Strong CTAs

## Content Types & Templates

### Blog Post (1500-2000 words)
```markdown
# [Compelling Title with Keyword]

[Hook - surprising stat, question, or bold statement]

[Introduction - 100-150 words setting up the problem]

## [Section 1 Title]
[Content with examples]

## [Section 2 Title]
[Content with data/stats]

## [Section 3 Title]
[Content with actionable tips]

## Conclusion
[Summary + CTA]

---
*[Author bio and links]*
```

### Landing Page Copy
```markdown
# [Headline - Clear Value Proposition]

## [Subheadline - Supporting benefit]

[Hero paragraph - 2-3 sentences explaining what you offer]

### Why [Product/Service]?

**[Benefit 1]** - [Explanation]
**[Benefit 2]** - [Explanation]
**[Benefit 3]** - [Explanation]

### How It Works

1. [Step 1]
2. [Step 2]
3. [Step 3]

### What Our Customers Say

> "[Testimonial]" - [Name, Title]

### [CTA Button Text]
[Supporting text under CTA]
```

### Social Media Posts

**LinkedIn:**
```
[Hook - first line is crucial]

[Story or insight - 2-3 short paragraphs]

[Key takeaway]

[Question to encourage engagement]

#hashtag1 #hashtag2 #hashtag3
```

**Twitter/X Thread:**
```
1/ [Hook - grab attention] 🧵

2/ [Context - why this matters]

3/ [Point 1]

4/ [Point 2]

5/ [Point 3]

6/ [Conclusion + CTA]

Like this? Follow for more on [topic]
```

### Email Newsletter
```markdown
Subject: [Curiosity-inducing subject line]
Preview: [First 50 chars that appear in inbox]

Hey [Name],

[Personal opening or hook]

[Main content - valuable insight or news]

[Actionable takeaway]

[CTA]

[Sign-off]
[Name]

P.S. [Additional hook or offer]
```

## SEO Optimization

### Title Tags
- Include primary keyword
- Under 60 characters
- Front-load important words
- Use power words (Ultimate, Complete, Proven)

### Meta Descriptions
- 150-160 characters
- Include keyword naturally
- Clear value proposition
- Call to action

### Headers (H1, H2, H3)
- One H1 per page
- Include keywords in H2s
- Logical hierarchy
- Scannable structure

### Content Body
- Keyword in first 100 words
- LSI keywords throughout
- Internal links to related content
- External links to authoritative sources
- Alt text on images

## Research Tools Integration

### Web Search
```
mcp__groq__compound_tool({
  messages: [
    { role: "user", content: "Research the latest trends in [TOPIC] and provide a summary with sources" }
  ],
  model: "compound-beta"  // Has web search capability
})
```

### Competitor Analysis
```
Use WebFetch to analyze competitor content:
- What topics do they cover?
- What's their tone?
- What keywords do they target?
- What's missing (content gaps)?
```

## Multi-Language Support

### Translation Workflow
```
1. Create content in primary language
2. Use Gemini for translation:

mcp__gemini__gemini_chat({
  prompt: `Translate this content to [LANGUAGE].

  Maintain:
  - Tone and voice
  - Cultural relevance
  - SEO keywords (localized)

  Content:
  [CONTENT]`
})
```

### Localization Tips
- Adapt idioms and expressions
- Use local examples/references
- Adjust date/number formats
- Consider cultural sensitivities

## Quality Checklist

### Before Publishing
- [ ] Spelling and grammar checked
- [ ] Facts verified with sources
- [ ] Links tested and working
- [ ] Images have alt text
- [ ] SEO elements complete (title, meta, headers)
- [ ] CTA is clear and visible
- [ ] Mobile-friendly formatting
- [ ] Tone matches brand voice

### Engagement Elements
- [ ] Compelling headline
- [ ] Hook in first paragraph
- [ ] Subheadings for scanning
- [ ] Bullet points for lists
- [ ] Visual breaks (images, quotes)
- [ ] Question to encourage comments
- [ ] Social sharing easy

## Integration with Other Skills

- **seo-audit**: Verify content SEO before publishing
- **ui-designer**: Create visual assets for content
- **multi-agent-patterns**: Scale content research
- **devops**: Deploy content to production