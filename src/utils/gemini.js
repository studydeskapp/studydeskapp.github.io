// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  GEMINI AI UTILITIES                                                         │
// │  Functions for interacting with Google's Gemini AI API.                     │
// └──────────────────────────────────────────────────────────────────────────────┘

const GEMINI_KEY = process.env.REACT_APP_GEMINI_KEY;

export async function callGeminiStream(prompt, systemPrompt="You are a helpful study assistant for high school students. Be concise and friendly.", onChunk, history=[]){
  const contents = [
    ...history.map(m=>({role:m.role==="ai"?"model":"user", parts:[{text:m.text}]})),
    {role:"user", parts:[{text:prompt}]}
  ];
  const model = "gemini-2.5-flash-lite";
  try{
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), 30000);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`,{
      method:"POST",
      signal:controller.signal,
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        system_instruction:{parts:[{text:systemPrompt}]},
        contents,
        generationConfig:{maxOutputTokens:2048,temperature:0.7}
      })
    });
    clearTimeout(timeout);
    if(!res.ok){
      const e = await res.json();
      const msg = e.error?.message||"";
      if(res.status===429){
        const numMatch = msg.match(/(\d+)\.\d+s/);
        const secs = numMatch ? Math.ceil(parseInt(numMatch[1])) + 2 : 60;
        return `⏳ Rate limited — you've hit the 20 requests/min limit. Please wait about ${secs} seconds and try again.`;
      }
      return "Error: "+msg;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buffer = "";
    while(true){
      const {done,value} = await reader.read();
      if(done) break;
      buffer += decoder.decode(value,{stream:true});
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for(const line of lines){
        if(!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        try{
          const parsed = JSON.parse(json);
          const delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if(delta){ full+=delta; onChunk(full); await new Promise(r=>setTimeout(r,18)); }
        }catch(e){}
      }
    }
    return full || "Sorry, I couldn't get a response.";
  }catch(e){
    if(e.name==="AbortError") return "Request timed out. Please try again.";
    return "Network error: "+e.message;
  }
}

export async function callGemini(prompt, systemPrompt="You are a helpful study assistant for high school students. Be concise and friendly."){
  return callGeminiStream(prompt, systemPrompt, ()=>{});
}
