/**
 *  Huhu.to – Sora module  (CF-Worker mit Cookie-Handshake)
 *  Author: Nb11111111
 *  Version: 1.0.8
 */

const BASE  = "https://huhu.to";
const PROXY = "https://hi.niloaf39.workers.dev/huhu";
const UA    = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

/* ---------- helpers ---------- */
const getJSON = url => fetch(PROXY + url, {headers:{"User-Agent":UA}}).then(r=>r.json());

/* ---------- search ---------- */
async function search(q){
  const data = await getJSON(`/web-vod/api/list?id=movie.popular.search%3D${encodeURIComponent(q)}`);
  return data.list.map(it=>({
    id: `/web-vod/item?id=${it.id}`,
    title: it.name,
    cover: it.poster_path.startsWith('//') ? 'https:'+it.poster_path : it.poster_path,
    synopsis:'', genres:'', status:'', score:'N/A', episodes:1
  }));
}

/* ---------- catalog ---------- */
async function catalog(page=1){
  const data = await getJSON(`/web-vod/api/list?id=movie.popular.page-${page}`);
  const hasNext = data.list.length === 20;
  return {
    page,
    hasNext,
    videos: data.list.map(it=>({
      id: `/web-vod/item?id=${it.id}`,
      title: it.name,
      cover: it.poster_path.startsWith('//') ? 'https:'+it.poster_path : it.poster_path,
      synopsis:'', genres:'', status:'', score:'N/A', episodes:1
    }))
  };
}

/* ---------- stream ---------- */
async function stream(id){
  const html = await fetch(PROXY + id, {headers:{"User-Agent":UA}}).then(r=>r.text());
  const m3u8 = html.match(/"url":"(https:\/\/[^"]+\.m3u8)"/)?.[1];
  if(!m3u8) throw new Error("No HLS found");
  return { url:m3u8, headers:{"Referer":BASE,"User-Agent":UA}, subtitles:[] };
}

/* ---------- worker entry ---------- */
self.addEventListener("message", async e=>{
  const {action, args, id} = e.data;
  let result;
  try{
    switch(action){
      case "search": result = await search(args.query); break;
      case "catalog":result = await catalog(args.page||1); break;
      case "stream": result = await stream(args.id); break;
      default:       result = {error:"Unknown action"};
    }
  }catch(err){ result = {error:err.message}; }
  self.postMessage({id, result});
});
