import React, { useState } from 'react';
import { FB_FS, FB_KEY } from '../../utils/firebase';

function PhoneUploadPage({uploadId}){
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [darkMode] = useState(()=>{try{return localStorage.getItem("sd-dark")==="1";}catch{return false;}});

  async function handleUpload(e){
    const file = e.target.files?.[0];
    if(!file) return;
    
    setUploading(true);
    
    // Compress the image before uploading
    const img = new Image();
    img.onload = async () => {
      // Create canvas to resize/compress
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Resize if too large (max 1200px on longest side)
      const maxSize = 1200;
      if(width > maxSize || height > maxSize){
        if(width > height){
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with compression (quality 0.7 = ~70% quality)
      const compressedData = canvas.toDataURL('image/jpeg', 0.7);
      setPreview(compressedData);
      
      // Check size (base64 is ~1.37x the actual size)
      const sizeInBytes = compressedData.length * 0.75; // rough estimate
      console.log("Compressed image size:", Math.round(sizeInBytes / 1024), "KB");
      
      try{
        console.log("Uploading to Firestore with ID:", uploadId);
        
        // Save to Firestore
        const response = await fetch(`${FB_FS}/uploads?documentId=${uploadId}&key=${FB_KEY}`, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({
            fields: {
              image: {stringValue: compressedData},
              timestamp: {integerValue: String(Date.now())}
            }
          })
        });
        
        console.log("Upload response status:", response.status);
        
        if(!response.ok){
          const errorText = await response.text();
          console.error("Upload error response:", errorText);
          throw new Error(`Upload failed: ${response.status}`);
        }
        
        console.log("Upload successful!");
        setUploading(false);
        setUploaded(true);
      }catch(err){
        console.error("Upload error:", err);
        setUploading(false);
        alert("Upload failed: " + err.message + "\n\nTry taking a smaller photo or reducing quality.");
      }
    };
    
    img.onerror = () => {
      setUploading(false);
      alert("Failed to load image. Please try again.");
    };
    
    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.readAsDataURL(file);
  }

  const bg=darkMode?"#0F1117":"#F5F2EC";
  const card=darkMode?"#161921":"#FFFFFF";
  const bd=darkMode?"#262B3C":"#E2DDD6";
  const txt=darkMode?"#DDE2F5":"#1B1F3B";
  const txt3=darkMode?"#5C6480":"#888888";
  const acc=darkMode?"#7B83F7":"#1B1F3B";

  return(
    <div style={{minHeight:"100vh",background:bg,padding:20,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>
      
      <div style={{maxWidth:500,margin:"0 auto",paddingTop:40}}>
        <div style={{textAlign:"center",marginBottom:30}}>
          <div style={{width:64,height:64,borderRadius:16,overflow:"hidden",margin:"0 auto 16px",background:card,border:`1.5px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem"}}>📚</div>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:"1.5rem",fontWeight:700,color:txt,marginBottom:6}}>Study Desk</div>
          <div style={{fontSize:".85rem",color:txt3}}>Upload your homework</div>
        </div>

        {!uploaded?(
          <div style={{background:card,border:`1.5px solid ${bd}`,borderRadius:20,padding:24}}>
            <div style={{fontSize:"1.1rem",fontWeight:700,color:txt,marginBottom:16,textAlign:"center"}}>
              📸 Take or select a photo
            </div>
            
            {preview?(
              <div>
                <div style={{marginBottom:16,borderRadius:12,overflow:"hidden",border:`1.5px solid ${bd}`}}>
                  <img src={preview} alt="Preview" style={{width:"100%",display:"block"}}/>
                </div>
                {uploading?(
                  <div style={{textAlign:"center",padding:20,color:txt3}}>
                    <div style={{fontSize:"2rem",marginBottom:10}}>⏳</div>
                    <div>Uploading...</div>
                  </div>
                ):(
                  <label style={{display:"block",padding:"12px",background:acc,color:"#fff",borderRadius:12,textAlign:"center",fontWeight:700,cursor:"pointer"}}>
                    <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleUpload}/>
                    📷 Take Another Photo
                  </label>
                )}
              </div>
            ):(
              <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:"40px 20px",border:`2px dashed ${bd}`,borderRadius:16,cursor:"pointer",background:darkMode?"#1C1F2B":"#F8F8F8"}}>
                <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleUpload}/>
                <div style={{fontSize:"3rem"}}>📷</div>
                <div style={{fontSize:".9rem",fontWeight:600,color:txt}}>Tap to take a photo</div>
                <div style={{fontSize:".75rem",color:txt3,textAlign:"center",lineHeight:1.5}}>
                  Your photo will be sent to your computer automatically
                </div>
              </label>
            )}
          </div>
        ):(
          <div style={{background:card,border:`1.5px solid ${bd}`,borderRadius:20,padding:24,textAlign:"center"}}>
            <div style={{fontSize:"3rem",marginBottom:16}}>✅</div>
            <div style={{fontSize:"1.2rem",fontWeight:700,color:txt,marginBottom:8}}>Upload successful!</div>
            <div style={{fontSize:".85rem",color:txt3,lineHeight:1.6,marginBottom:20}}>
              Your homework photo has been sent to your computer. You can close this page and return to your PC.
            </div>
            <div style={{marginBottom:16,borderRadius:12,overflow:"hidden",border:`1.5px solid ${bd}`}}>
              <img src={preview} alt="Uploaded" style={{width:"100%",display:"block"}}/>
            </div>
            <button onClick={()=>{setUploaded(false);setPreview(null);}}
              style={{padding:"10px 20px",background:"transparent",border:`1.5px solid ${bd}`,borderRadius:10,color:txt,fontWeight:600,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              Upload Another
            </button>
          </div>
        )}

        <div style={{marginTop:20,textAlign:"center",fontSize:".75rem",color:txt3}}>
          Upload ID: {uploadId}
        </div>
      </div>
    </div>
  );
}

export default PhoneUploadPage;
