// Cloudflare Pages Function to handle all routes
// This catches all paths and serves index.html for client-side routing

export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // If requesting a static file (has extension), let it through
  if (url.pathname.match(/\.[a-zA-Z0-9]+$/)) {
    return context.next();
  }
  
  // Special handling for /admin - don't redirect to /admin/
  if (url.pathname === '/admin') {
    const response = await context.env.ASSETS.fetch(new URL('/index.html', url.origin));
    return new Response(response.body, {
      status: 200,
      headers: response.headers
    });
  }
  
  // For all other routes, serve index.html
  const response = await context.env.ASSETS.fetch(new URL('/index.html', url.origin));
  
  // Return a new response with the original URL
  return new Response(response.body, {
    status: 200,
    headers: response.headers
  });
}
