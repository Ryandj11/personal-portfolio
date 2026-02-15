import { NextRequest, NextResponse } from 'next/server';

// ============================================
// Known malicious bot User-Agent patterns
// ============================================
const BLOCKED_BOT_PATTERNS = [
    /python-requests/i,
    /scrapy/i,
    /httpclient/i,
    /java\//i,
    /libwww-perl/i,
    /wget/i,
    /curl/i,
    /php\//i,
    /go-http-client/i,
    /node-fetch/i,
    /axios/i,
    /undici/i,
];

// Simple in-memory sliding window for global API protection
// Resets on cold start, which is acceptable for edge middleware
const globalRequestLog: number[] = [];
const GLOBAL_WINDOW_MS = 60_000; // 1 minute window
const GLOBAL_MAX_REQUESTS = 60;  // Max 60 API requests per minute across all users

function isGloballyRateLimited(): boolean {
    const now = Date.now();
    // Remove entries older than the window
    while (globalRequestLog.length > 0 && globalRequestLog[0] < now - GLOBAL_WINDOW_MS) {
        globalRequestLog.shift();
    }
    if (globalRequestLog.length >= GLOBAL_MAX_REQUESTS) {
        return true;
    }
    globalRequestLog.push(now);
    return false;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only apply protections to API routes
    if (!pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // --- Bot detection via User-Agent ---
    const userAgent = request.headers.get('user-agent') || '';

    // Block requests with no User-Agent (likely scripts)
    if (!userAgent) {
        console.log('🤖 Blocked request with empty User-Agent');
        return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
        );
    }

    // Block known malicious bot patterns
    if (BLOCKED_BOT_PATTERNS.some(pattern => pattern.test(userAgent))) {
        console.log(`🤖 Blocked bot: ${userAgent.slice(0, 80)}`);
        return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
        );
    }

    // --- Global rate limit ---
    if (isGloballyRateLimited()) {
        console.log('🌐 Global rate limit reached');
        return NextResponse.json(
            { error: 'Service is temporarily busy. Please try again shortly.' },
            { status: 503 }
        );
    }

    // --- Security headers ---
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

export const config = {
    matcher: '/api/:path*',
};
