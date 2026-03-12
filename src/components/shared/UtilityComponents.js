import React, { useState } from 'react';

export function CopyBtn({text}){
  const [copied,setCopied]=useState(false);
  return(
    <button onClick={()=>{navigator.clipboard.writeText(text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});}}
      style={{position:"absolute",top:5,right:5,background:copied?"#16a34a":"#4338ca",color:"#fff",border:"none",borderRadius:5,padding:"3px 8px",fontSize:".65rem",fontWeight:700,cursor:"pointer",fontFamily:"sans-serif"}}>
      {copied?"✅ Copied!":"📋 Copy"}
    </button>
  );
}

export function FetcherCopyBox({html}){
  const [copied,setCopied]=useState(false);
  return(
    <div style={{marginBottom:14}}>
      <div style={{position:"relative"}}>
        <textarea readOnly value={html}
          style={{width:"100%",height:90,fontFamily:"monospace",fontSize:".62rem",borderRadius:9,border:"1.5px solid #c7d2fe",padding:"8px 10px",background:"#f8f8ff",color:"#333",resize:"none",boxSizing:"border-box"}}/>
        <button onClick={()=>{navigator.clipboard.writeText(html).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),3000);});}}
          style={{position:"absolute",top:6,right:6,background:copied?"#16a34a":"#4338ca",color:"#fff",border:"none",borderRadius:6,padding:"4px 10px",fontSize:".72rem",fontWeight:700,cursor:"pointer"}}>
          {copied?"✅ Copied!":"📋 Copy All"}
        </button>
      </div>
      <div style={{fontSize:".72rem",color:"#888",marginTop:6,lineHeight:1.6}}>
        1. Click <b>Copy All</b> above<br/>
        2. Open <b>Notepad</b> (Windows) or <b>TextEdit</b> (Mac)<br/>
        3. Paste and save as <b>agenda-fetcher.html</b><br/>
        4. Open that file in Chrome/Edge while logged into Google
      </div>
    </div>
  );
}
