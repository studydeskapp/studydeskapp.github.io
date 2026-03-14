// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  GEMINI AI UTILITIES                                                         │
// │  Functions for interacting with Google's Gemini AI API.                     │
// └──────────────────────────────────────────────────────────────────────────────┘

export const getGeminiKey = () => process.env.REACT_APP_GEMINI_KEY;

// Upload file to Gemini Files API
export async function uploadFileToGemini(file) {
  const key = getGeminiKey();
  if (!key) throw new Error("Gemini API key not configured. Set REACT_APP_GEMINI_KEY in .env");

  try {
    // First, get the upload URL
    const initResponse = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
      },
      body: JSON.stringify({
        file: {
          display_name: file.name,
          mime_type: file.type
        }
      })
    });

    if (!initResponse.ok) {
      const error = await initResponse.json();
      throw new Error(`Upload initialization failed: ${error.error?.message || 'Unknown error'}`);
    }

    const uploadUrl = initResponse.headers.get('X-Goog-Upload-URL');
    if (!uploadUrl) {
      throw new Error('No upload URL received');
    }

    // Upload the actual file
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': file.type,
        'X-Goog-Upload-Command': 'upload, finalize',
        'X-Goog-Upload-Offset': '0'
      },
      body: file
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(`File upload failed: ${error.error?.message || 'Unknown error'}`);
    }

    const result = await uploadResponse.json();
    return result.file;
  } catch (error) {
    console.error('Gemini file upload error:', error);
    throw error;
  }
}

// Call Gemini with uploaded file
export async function callGeminiWithFile(prompt, file, systemPrompt = "You are a helpful study assistant for high school students. Be concise and friendly.") {
  const key = getGeminiKey();
  if (!key) throw new Error("Gemini API key not configured. Set REACT_APP_GEMINI_KEY in .env");

  const contents = [
    {
      role: "user",
      parts: [
        { file_data: { mime_type: file.mime_type, file_uri: file.uri } },
        { text: prompt }
      ]
    }
  ];

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      const msg = error.error?.message || "";
      if (response.status === 429) {
        const numMatch = msg.match(/(\d+)\.\d+s/);
        const secs = numMatch ? Math.ceil(parseInt(numMatch[1])) + 2 : 60;
        return `⏳ Rate limited — you've hit the 20 requests/min limit. Please wait about ${secs} seconds and try again.`;
      }
      console.error("Gemini API error:", error);
      return "Error: " + msg;
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
  } catch (error) {
    console.error("Gemini file analysis error:", error);
    if (error.name === "AbortError") return "Request timed out. Please try again.";
    return "Network error: " + error.message;
  }
}

// Delete uploaded file (cleanup)
export async function deleteGeminiFile(file) {
  const key = getGeminiKey();
  if (!key) return;

  try {
    await fetch(`https://generativelanguage.googleapis.com/v1beta/files/${file.name}?key=${key}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.warn('Failed to delete Gemini file:', error);
  }
}

export async function callGeminiStream(prompt, systemPrompt="You are a helpful study assistant for high school students. Be concise and friendly.", onChunk, history=[]){
  const contents = [
    ...history.map(m=>({role:m.role==="ai"?"model":"user", parts:[{text:m.text}]})),
    {role:"user", parts:[{text:prompt}]}
  ];
  const model = "gemini-2.5-flash";
  try{
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), 30000);
    const key = getGeminiKey();
    if (!key) throw new Error("Gemini API key not configured. Set REACT_APP_GEMINI_KEY in .env");
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`,{
      method:"POST",
      signal:controller.signal,
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        system_instruction:{parts:[{text:systemPrompt}]},
        contents,
        generationConfig:{maxOutputTokens:4096,temperature:0.7}
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
      console.error("Gemini API error:", e);
      return "Error: "+msg;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buffer = "";
    while(true){
      const {done,value} = await reader.read();
      if(done) {
        // Process any remaining buffer content
        if(buffer.trim()){
          const lines = buffer.split("\n");
          for(const line of lines){
            if(!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if(json === "[DONE]") break; // Stop at completion marker
            try{
              const parsed = JSON.parse(json);
              const delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if(delta){ full+=delta; onChunk(full); }
            }catch(e){console.error("Parse error:", e);}
          }
        }
        break;
      }
      buffer += decoder.decode(value,{stream:true});
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for(const line of lines){
        if(!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if(json === "[DONE]") break; // Stop at completion marker
        try{
          const parsed = JSON.parse(json);
          const delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if(delta){ full+=delta; onChunk(full); await new Promise(r=>setTimeout(r,18)); }
        }catch(e){console.error("Parse error:", e);}
      }
    }
    // Clean up any trailing whitespace or artifacts
    full = full.trim();
    if(!full) console.warn("Empty response from Gemini");
    return full || "Sorry, I couldn't get a response.";
  }catch(e){
    console.error("Gemini stream error:", e);
    if(e.name==="AbortError") return "Request timed out. Please try again.";
    return "Network error: "+e.message;
  }
}

export async function callGemini(prompt, systemPrompt="You are a helpful study assistant for high school students. Be concise and friendly."){
  return callGeminiStream(prompt, systemPrompt, ()=>{});
}
