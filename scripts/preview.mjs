import {createServer} from 'node:http';
import worker from '../src/index.js';
createServer(async(req,res)=>{try{const response=await worker.fetch(new Request('http://localhost:8787'+req.url,{method:req.method}));res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(error){console.error(error);res.writeHead(500);res.end('Preview error');}}).listen(8787,'127.0.0.1',()=>console.log('Afinah preview: http://localhost:8787'));
