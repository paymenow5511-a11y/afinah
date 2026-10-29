import assets from './assets.generated.js';
import legacy from './legacy-site.js';
export default {
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === '/api/health') return Response.json({ok:true,service:'afinah',version:'0.3.0',storage:'on-device'});
    if (path === '/about-afinah') return legacy.fetch(request);
    if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
    const asset=assets[path==='/'?'/index.html':path];
    if (!asset) return new Response('Not found',{status:404});
    const body=request.method==='HEAD'?null:Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0));
    return new Response(body,{headers:{'content-type':asset.type,'cache-control':'no-cache','x-content-type-options':'nosniff','referrer-policy':'same-origin','permissions-policy':'camera=(), microphone=(), geolocation=()','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"}});
  }
};
