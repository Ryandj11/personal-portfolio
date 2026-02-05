import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import portfolioData from '../../backend/portfolio-data.json';

// ============================================
// CONFIGURATION
// ============================================
const CACHE_TTL = 86400; // 24 hour in seconds
const CACHE_PREFIX = 'search:';

// ============================================
// INITIALIZE CLIENTS
// ============================================

// Initialize Upstash Redis
const redis = Redis.fromEnv();

// Initialize rate limiter with sliding window
const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
    analytics: true,
    prefix: 'ratelimit:search:',
});

// Initialize Google Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ============================================
// CACHE TYPES
// ============================================
interface CacheEntry {
    query: string;
    answer: string;
    results: any[];
    timestamp: number;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Normalize query for cache key (lowercase, trim, remove extra spaces/punctuation)
function normalizeQuery(query: string): string {
    return query
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ');   // Normalize whitespace
}

// Generate cache key from query
function getCacheKey(query: string): string {
    return `${CACHE_PREFIX}${normalizeQuery(query)}`;
}

// ============================================
// CONTEXT BUILDING (Keyword-based selection)
// ============================================

// Keyword patterns for each context section
const CONTEXT_PATTERNS = {
    experience: ['experience', 'work', 'job', 'career', 'intern', 'company', 'role', 'linkedin', 'automatic', 'sjsu', 'employed'],
    projects: ['project', 'portfolio', 'built', 'created', 'developed', 'fusion', 'studybuddy', 'vivi', 'app', 'application'],
    skills: ['skill', 'technolog', 'language', 'framework', 'database', 'tool', 'python', 'java', 'react', 'swift', 'typescript'],
    education: ['education', 'school', 'university', 'college', 'degree', 'student', 'study', 'studying', 'sjsu', 'san jose'],
    contact: ['contact', 'email', 'reach', 'connect', 'linkedin', 'github', 'message', 'hire'],
    interests: ['interest', 'hobby', 'fun', 'free time', 'enjoy', 'like to do', 'outside work'],
    about: ['who', 'about', 'tell me', 'introduce', 'background', 'summary', 'overview'],
};

// Build contextual prompt based on query keywords
function buildContextualPrompt(query: string, data: typeof portfolioData): string {
    const lowerQuery = query.toLowerCase();

    // Detect which sections are relevant
    const relevantSections = new Set<string>();

    for (const [section, keywords] of Object.entries(CONTEXT_PATTERNS)) {
        if (keywords.some(kw => lowerQuery.includes(kw))) {
            relevantSections.add(section);
        }
    }

    // If no specific sections detected, include core sections
    if (relevantSections.size === 0) {
        relevantSections.add('about');
        relevantSections.add('experience');
        relevantSections.add('skills');
    }

    // Always include basic personal info
    let context = `You are a search engine answering questions about Ryan Johnson. Use the following verified information:

PERSONAL INFO:
- Name: ${data.personal.name}
- Title: ${data.personal.title}
- Location: ${data.personal.location}
- Bio: ${data.personal.bio}`;

    // Add contact info if relevant
    if (relevantSections.has('contact') || relevantSections.has('about')) {
        context += `
- Email: ${data.personal.email}
- LinkedIn: ${data.personal.linkedin}
- GitHub: ${data.personal.github}`;
    }

    // Add education if relevant
    if (relevantSections.has('education') || relevantSections.has('about')) {
        context += `

EDUCATION:
- ${data.education.degree} at ${data.education.institution}
- Status: ${data.education.status}`;
    }

    // Add experience if relevant
    if (relevantSections.has('experience') || relevantSections.has('about')) {
        context += `

EXPERIENCE:
${data.experience.map(exp => `- ${exp.role} at ${exp.company} (${exp.period}): ${exp.description}`).join('\n')}`;
    }

    // Add projects if relevant
    if (relevantSections.has('projects')) {
        context += `

PROJECTS:
${data.projects.map(proj => `- ${proj.title}: ${proj.description} [${proj.technologies.slice(0, 3).join(', ')}]`).join('\n')}`;
    }

    // Add skills if relevant
    if (relevantSections.has('skills') || relevantSections.has('about')) {
        context += `

SKILLS:
- Languages: ${data.skills.languages.join(', ')}
- Frameworks: ${data.skills.frameworks.join(', ')}
- AI/ML: ${data.skills.aiml.join(', ')}`;
    }

    // Add interests if relevant
    if (relevantSections.has('interests')) {
        context += `

INTERESTS: ${data.interests.join(', ')}`;
    }

    // Add instructions
    context += `

RESPONSE FORMAT:
1. Answer directly in the first sentence. No introductions or filler.
2. Write in flowing prose, not bullet points. Connect ideas naturally.
3. Include specific details: dates, company names, technologies used, and key achievements.
4. Keep your answers to the point and don't ramble.
5. Write with authority - no "I believe" or "It appears".
6. Stay on topic. Only answer about Ryan Johnson and redirect if asked about something else.
7. Use only the information provided above.`;





    // Log which sections were included
    console.log(`   Context sections: [${Array.from(relevantSections).join(', ')}]`);

    return context;
}

// ============================================
// REDIS CACHE FUNCTIONS
// ============================================

// Check for exact match in Redis cache
async function getFromCache(query: string): Promise<CacheEntry | null> {
    try {
        const key = getCacheKey(query);
        console.log(`🔍 Checking cache for: "${query}" (key: ${key})`);

        const cached = await redis.get<CacheEntry>(key);

        if (cached) {
            console.log(`✅ CACHE HIT`);
            return cached;
        }

        console.log(`❌ CACHE MISS`);
        return null;
    } catch (error) {
        console.error('Redis cache lookup error:', error);
        return null;
    }
}

// Store entry in Redis cache
async function storeInCache(
    query: string,
    answer: string,
    results: any[]
): Promise<void> {
    try {
        const entry: CacheEntry = {
            query,
            answer,
            results,
            timestamp: Date.now(),
        };

        const key = getCacheKey(query);

        // Store with TTL
        await redis.set(key, entry, { ex: CACHE_TTL });
        console.log(`💾 Cached: "${query}" (TTL: ${CACHE_TTL}s)`);
    } catch (error) {
        console.error('Redis cache store error:', error);
    }
}

// ============================================
// API ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest) {
    try {
        // Get client IP for rate limiting
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // Check rate limit using Upstash Ratelimit
        const { success, limit, remaining, reset } = await ratelimit.limit(ip);

        if (!success) {
            console.log(`⚠️ Rate limit exceeded for IP: ${ip}`);
            return NextResponse.json(
                {
                    error: 'Too many requests. Please try again later.',
                    retryAfter: Math.ceil((reset - Date.now()) / 1000)
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': reset.toString(),
                        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
                    }
                }
            );
        }

        // Parse request body
        const { query } = await request.json();

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { error: 'Query is required and must be a string' },
                { status: 400 }
            );
        }

        // Validate query length
        if (query.length < 2 || query.length > 500) {
            return NextResponse.json(
                { error: 'Query must be between 2 and 500 characters' },
                { status: 400 }
            );
        }

        console.log(`\n📝 Processing search: "${query}"`);
        console.log(`   Rate limit: ${remaining}/${limit} remaining`);

        // Check Redis cache (exact match)
        const cached = await getFromCache(query);
        if (cached) {
            return NextResponse.json({
                success: true,
                query,
                answer: cached.answer,
                results: cached.results,
                cached: true,
            }, {
                headers: {
                    'X-RateLimit-Remaining': remaining.toString(),
                    'X-Cache-Status': 'HIT',
                }
            });
        }

        // Build dynamic context based on query keywords
        const systemPrompt = buildContextualPrompt(query, portfolioData);

        // Call Google Gemini API
        const result = await chatModel.generateContent({
            contents: [{
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUser Question: ${query}` }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
            },
        });

        const answer = result.response.text() || 'Sorry, I could not generate a response.';

        // Generate search results based on the query and answer
        const results = generateSearchResults(query, answer, portfolioData);

        // Store in Redis cache
        await storeInCache(query, answer, results);

        return NextResponse.json({
            success: true,
            query,
            answer,
            results,
            cached: false,
        }, {
            headers: {
                'X-RateLimit-Remaining': remaining.toString(),
                'X-Cache-Status': 'MISS',
            }
        });

    } catch (error: any) {
        console.error('Search API Error:', error);

        return NextResponse.json(
            {
                error: 'Failed to process search query',
                message: error.message || 'Unknown error occurred'
            },
            { status: 500 }
        );
    }
}

// Helper function to generate relevant search results
function generateSearchResults(query: string, answer: string, data: typeof portfolioData) {
    const lowerQuery = query.toLowerCase();
    const results: any[] = [];

    // Add AI-generated answer as the first result
    results.push({
        id: 'ai-answer',
        title: 'AI Answer',
        url: 'ryan://search',
        description: answer,
        type: 'answer'
    });

    // Add relevant page links based on query keywords
    if (lowerQuery.includes('about') || lowerQuery.includes('who') || lowerQuery.includes('ryan')) {
        results.push({
            id: 'about-page',
            title: 'About Me - Ryan Johnson',
            url: 'ryan://about',
            description: data.personal.bio,
            type: 'page'
        });
    }

    if (lowerQuery.includes('experience') || lowerQuery.includes('work') || lowerQuery.includes('job') || lowerQuery.includes('career') || lowerQuery.includes('intern')) {
        results.push({
            id: 'experience-page',
            title: 'Work Experience & Resume',
            url: 'ryan://experience',
            description: `Professional experience including roles at ${data.experience.map(e => e.company).join(', ')}. Expertise in full-stack development, iOS development, and AI systems.`,
            type: 'page'
        });

        // Add individual experience entries
        data.experience.forEach((exp, idx) => {
            if (lowerQuery.includes(exp.company.toLowerCase()) || idx < 2) {
                results.push({
                    id: `exp-${idx}`,
                    title: `${exp.role} at ${exp.company}`,
                    url: 'ryan://experience',
                    description: `${exp.description} (${exp.period})`,
                    type: 'page'
                });
            }
        });
    }

    if (lowerQuery.includes('project') || lowerQuery.includes('portfolio') || lowerQuery.includes('built') || lowerQuery.includes('fusion') || lowerQuery.includes('studybuddy') || lowerQuery.includes('vivi')) {
        results.push({
            id: 'projects-page',
            title: 'Projects & Portfolio',
            url: 'ryan://projects',
            description: 'Explore a collection of recent projects, featuring AI-powered applications, web development, and innovative prototypes.',
            type: 'page'
        });

        // Add individual projects
        data.projects.forEach((proj, idx) => {
            if (lowerQuery.includes(proj.title.toLowerCase()) || idx < 2) {
                results.push({
                    id: `project-${idx}`,
                    title: proj.title,
                    url: proj.demo || 'ryan://projects',
                    description: `${proj.description} Built with ${proj.technologies.slice(0, 3).join(', ')}.`,
                    type: proj.demo ? 'external' : 'page'
                });
            }
        });
    }

    if (lowerQuery.includes('skill') || lowerQuery.includes('technolog') || lowerQuery.includes('language') || lowerQuery.includes('framework')) {
        results.push({
            id: 'skills-info',
            title: 'Technical Skills & Technologies',
            url: 'ryan://about',
            description: `Languages: ${data.skills.languages.slice(0, 5).join(', ')}. Frameworks: ${data.skills.frameworks.slice(0, 4).join(', ')}. AI/ML: ${data.skills.aiml.join(', ')}.`,
            type: 'page'
        });
    }

    if (lowerQuery.includes('contact') || lowerQuery.includes('email') || lowerQuery.includes('reach')) {
        results.push({
            id: 'contact-info',
            title: 'Contact Ryan Johnson',
            url: 'ryan://about',
            description: `Email: ${data.personal.email}. Connect on LinkedIn: ${data.personal.linkedin}`,
            type: 'page'
        });
    }

    // If no specific results, add home and about pages
    if (results.length === 1) {
        results.push({
            id: 'home',
            title: 'Ryan Johnson - Portfolio Home',
            url: 'ryan://home',
            description: 'Welcome to my interactive portfolio. Navigate through my experience, projects, and skills using this browser-like interface.',
            type: 'page'
        });
        results.push({
            id: 'about-fallback',
            title: 'About Me',
            url: 'ryan://about',
            description: data.personal.bio,
            type: 'page'
        });
    }

    return results;
}
