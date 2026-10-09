// API Client Utility

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // In the browser, use relative path so Next.js rewrites proxy to backend without CORS or host mismatch
  let baseUrl = '';
  if (typeof window === 'undefined') {
    baseUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:5060';
  }

  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Only set Content-Type for requests with body (avoids unnecessary CORS preflight on GET requests)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({ success: false, message: 'Invalid response from server' }));
  
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}
