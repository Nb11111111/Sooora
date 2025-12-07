/**
 *  anix.com.pl – Sora module
 *  Author: niio
 *  Version: 1.0.0
 */

const BASE = "https://anix.com.pl";
const UA   = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

/* ---------- helpers ---------- */
const text = url => fetch(url,{headers:{"User-Agent":UA}}).then(r=>r.text());

/* ---------- search ---------- */
async function search(q){
  const html = await text(`${BASE}/search?keyword=${encodeURIComponent(q)}`);
  const rows = [...html.matchAll(
    /<article[^>]*>.*?<a[^>]*\bhref="(\/anime\/[^"]+)"[^>]*>.*?<img[^>]*\bsrc="([^"]+)"[^>]*\balt="([^"]+)"/gs
  )];
  return rows.map(m=>({
    id: m[1],
    title: m[3].trim(),
    cover: m[2].startsWith('//') ? 'https:'+m[2] : m[2],
    synopsis:'', genres:'', status:'', score:'N/A', episodes:1
  }));
}

/* ---------- catalog ---------- */
async function catalog(page=1){
  const html = await text(`${BASE}/anime?page=${page}`);
  const rows = [...html.matchAll(
    /<article[^>]*>.*?<a[^>]*\bhref="(\/anime\/[^"]+)"[^>]*>.*?<img[^>]*\bsrc="([^"]+)"[^>]*\balt="([^"]+)"/gs
  )];
  const hasNext = html.includes(`?page=${page+1}`);
  return {
    page,
    hasNext,
    videos: rows.map(m=>({
      id: m[1],
      title: m[3].trim(),
      cover: m[2].startsWith('//') ? 'https:'+m[2] : m[2],
      synopsis:'', genres:'', status:'', score:'N/A', episodes:1
    }))
  };
}

/* ---------- stream ---------- */
async function stream(id){
  const html = await text(BASE+id);
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
