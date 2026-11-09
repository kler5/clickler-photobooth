const $ = id => document.getElementById(id);
const state = { stream:null, photos:[], currentResult:null, selectedSlot:0, template:null, logo:null, gifUrl:null, cloud:{url:"",key:""} };
const palettes = {
 classic:{bg:"#eee5d8",ink:"#44372f",accent:"#a77c62",frame:"#fffaf3"},
 pink:{bg:"#f8e8ed",ink:"#553541",accent:"#d88fa8",frame:"#fffafd"},
 mono:{bg:"#f2f2f2",ink:"#191919",accent:"#777",frame:"#fff"},
 blue:{bg:"#eaf3fb",ink:"#102d4f",accent:"#4b86bd",frame:"#fff"}
};
let slotAdjust = {};
let currentCanvasBlob = null;

function toast(message){const t=$("toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function showPage(name){
 document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
 $("page-"+name).classList.add("active");
 document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===name));
 if(name==="gallery") renderGallery();
}
document.querySelectorAll(".nav-btn").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
$("quickGallery").onclick=()=>showPage("gallery");
$("galleryStart").onclick=()=>{showPage("booth");startStudio()};
$("startBtn").onclick=startStudio;
$("backWelcome").onclick=()=>{stopCamera();$("studio").classList.add("hidden");$("welcome").classList.remove("hidden")};
$("newSession").onclick=()=>{state.photos=[];state.currentResult=null;state.gifUrl=null;$("results").classList.add("hidden");$("studio").classList.remove("hidden");$("takeBtn").disabled=!state.stream;drawTemplatePreview()};
function startStudio(){$("welcome").classList.add("hidden");$("results").classList.add("hidden");$("studio").classList.remove("hidden");drawTemplatePreview();refreshCameras()}

async function refreshCameras(){
 try{
  const devices=await navigator.mediaDevices.enumerateDevices();const cams=devices.filter(d=>d.kind==="videoinput");const sel=$("cameraSelect");const previous=sel.value;sel.innerHTML='<option value="">Choose camera</option>';
  cams.forEach((c,i)=>{const o=document.createElement("option");o.value=c.deviceId;o.textContent=c.label||`Camera ${i+1}`;sel.appendChild(o)});
  if(previous&&cams.some(c=>c.deviceId===previous))sel.value=previous;
  if(!cams.length)$("cameraStatus").textContent="No camera detected";
 }catch(e){$("cameraStatus").textContent="Camera permission required"}
}
async function connectCamera(){
 try{
  stopCamera();
  const id=$("cameraSelect").value;
  const constraints={audio:false,video:id?{deviceId:{exact:id},width:{ideal:1920},height:{ideal:1080}}:{facingMode:"user",width:{ideal:1920},height:{ideal:1080}}};
  state.stream=await navigator.mediaDevices.getUserMedia(constraints);
  $("video").srcObject=state.stream;$("video").classList.remove("hidden");$("cameraPlaceholder").classList.add("hidden");
  $("cameraDot").classList.add("on");$("cameraStatus").textContent="Camera connected";$("takeBtn").disabled=false;
  await refreshCameras();
 }catch(e){toast("Camera could not connect. Check browser permission and camera use.");$("cameraStatus").textContent="Camera connection failed"}
}
function stopCamera(){if(state.stream){state.stream.getTracks().forEach(t=>t.stop());state.stream=null} $("video").srcObject=null;$("video").classList.add("hidden");$("cameraPlaceholder").classList.remove("hidden");$("cameraDot").classList.remove("on");$("takeBtn").disabled=true}
$("connectCamera").onclick=connectCamera;
$("cameraSelect").onchange=()=>{if(state.stream)connectCamera()};
if(navigator.mediaDevices?.addEventListener)navigator.mediaDevices.addEventListener("devicechange",refreshCameras);

function delay(ms){return new Promise(r=>setTimeout(r,ms))}
async function takeSession(){
 if(!state.stream)return;
 const count=Number($("photoCount").value),timer=Number($("timerSelect").value);state.photos=[];
 $("takeBtn").disabled=true;
 for(let i=0;i<count;i++){
  if(timer){for(let n=timer;n>0;n--){$("countdown").textContent=n;$("countdown").classList.remove("hidden");await delay(1000)}$("countdown").classList.add("hidden")}
  const v=$("video"),c=document.createElement("canvas");c.width=v.videoWidth||1280;c.height=v.videoHeight||960;
  const cx=c.getContext("2d");cx.translate(c.width,0);cx.scale(-1,1);cx.drawImage(v,0,0,c.width,c.height);
  const data=c.toDataURL("image/jpeg",.92);state.photos.push(data);
  $("flash").classList.remove("go");void $("flash").offsetWidth;$("flash").classList.add("go");
  toast(`Captured ${i+1} of ${count}`);
  if(i<count-1)await delay(450);
 }
 $("takeBtn").disabled=false;buildResult();
}
$("takeBtn").onclick=takeSession;

function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src})}
function getLayout(w,h,count){
 const margin=w*.09,gap=w*.025,header=h*.12,footer=h*.15;
 const cols=count>4?2:1,rows=Math.ceil(count/cols),slotW=(w-margin*2-gap*(cols-1))/cols,slotH=(h-header-footer-margin*2-gap*(rows-1))/rows;
 return Array.from({length:count},(_,i)=>({x:margin+(i%cols)*(slotW+gap),y:header+margin+Math.floor(i/cols)*(slotH+gap),w:slotW,h:slotH}));
}
function cover(ctx,img,x,y,w,h,adjust={}){const scale=Math.max(w/img.width,h/img.height)*(adjust.scale||1);const sw=w/scale,sh=h/scale;const px=(adjust.x??50)/100,py=(adjust.y??50)/100;const sx=(img.width-sw)*px,sy=(img.height-sh)*py;ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h)}
async function drawDesign(canvas,photoData,preview=false){
 const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height,count=photoData.length;
 const key=$("templateSelect").value;const p=palettes[key]||palettes.classic;
 ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);
 ctx.textAlign="center";ctx.fillStyle=p.ink;
 if(state.logo){const logo=await loadImage(state.logo);const scale=Math.min(w*.42/logo.width,h*.075/logo.height);ctx.drawImage(logo,(w-logo.width*scale)/2,h*.018,logo.width*scale,logo.height*scale)}
 else{ctx.font=`bold ${Math.round(w*.075)}px Arial`;ctx.fillText("CLICKLER",w/2,h*.075);ctx.font=`${Math.round(w*.025)}px Arial`;ctx.fillStyle=p.accent;ctx.fillText("PHOTOBOOTH",w/2,h*.105)}
 const boxes=getLayout(w,h,count);
 for(let i=0;i<count;i++){
  const b=boxes[i],adj=slotAdjust[i]||{};
  ctx.fillStyle=p.frame;ctx.fillRect(b.x-5,b.y-5,b.w+10,b.h+10);
  const img=await loadImage(photoData[i]);cover(ctx,img,b.x,b.y,b.w,b.h,adj);
  if(preview&&i===state.selectedSlot){ctx.strokeStyle=p.accent;ctx.lineWidth=5;ctx.strokeRect(b.x,b.y,b.w,b.h)}
 }
 ctx.fillStyle=p.ink;ctx.font=`bold ${Math.round(w*.032)}px Arial`;
 const event=($("eventName").value||"A MOMENT TO KEEP").toUpperCase().slice(0,50);ctx.fillText(event,w/2,h*.91,w*.85);
 ctx.fillStyle=p.accent;ctx.font=`${Math.round(w*.022)}px Arial`;
 const d=$("eventDate").value;const date=d?new Date(d+"T12:00:00").toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"}).toUpperCase():"MADE WITH CLICKLER";
 ctx.fillText(date,w/2,h*.945);
 // Overlay a transparent PNG frame above the photo slots when a custom template is selected.
 if(state.template && $("templateSelect").value==="custom"){
  const overlay=await loadImage(state.template);
  ctx.drawImage(overlay,0,0,w,h);
 }
}
async function drawTemplatePreview(){
 const canvas=$("templatePreview");const count=Number($("photoCount").value)||4;
 const placeholders=Array.from({length:count},(_,i)=>placeholder(i));
 await drawDesign(canvas,placeholders,true);
 renderSlotButtons(count);
}
function placeholder(i){const c=document.createElement("canvas");c.width=400;c.height=300;const x=c.getContext("2d");x.fillStyle="#d9d1cf";x.fillRect(0,0,400,300);x.fillStyle="#847b7d";x.font="bold 34px Arial";x.textAlign="center";x.fillText("PHOTO "+(i+1),200,160);return c.toDataURL()}
function renderSlotButtons(count){const wrap=$("slotButtons");wrap.innerHTML="";for(let i=0;i<count;i++){const b=document.createElement("button");b.textContent=`PHOTO ${i+1}`;b.classList.toggle("selected",i===state.selectedSlot);b.onclick=()=>{state.selectedSlot=i;const a=slotAdjust[i]||{};$("slotX").value=a.x??50;$("slotY").value=a.y??50;$("slotSize").value=(a.scale??1)*100;renderSlotButtons(count);drawTemplatePreview()};wrap.appendChild(b)}}
function updateSlot(){slotAdjust[state.selectedSlot]={x:Number($("slotX").value),y:Number($("slotY").value),scale:Number($("slotSize").value)/100};drawTemplatePreview()}
["slotX","slotY","slotSize"].forEach(id=>$(id).oninput=updateSlot);
["photoCount","templateSelect","eventName","eventDate"].forEach(id=>$(id).addEventListener("input",drawTemplatePreview));
$("templateFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;state.template=await fileData(f);$("templateSelect").value="custom";drawTemplatePreview();toast("Template uploaded. It will overlay the photo layout; adjust each photo crop below.")};
function fileData(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}

async function buildResult(){
 $("studio").classList.add("hidden");$("results").classList.remove("hidden");
 const canvas=$("resultCanvas");await drawDesign(canvas,state.photos);
 currentCanvasBlob=await new Promise(r=>canvas.toBlob(r,"image/jpeg",.94));
 state.currentResult=canvas.toDataURL("image/jpeg",.94);
 const record={id:Date.now(),created:new Date().toISOString(),event:$("eventName").value||"Photo Session",image:state.currentResult,photos:state.photos};
 await saveLocal(record);$("galleryCount").textContent=getLocal().length;
 const publicUrl=await uploadCloud(record);
 await makeQr(publicUrl);
}
function getLocal(){try{return JSON.parse(localStorage.getItem("clickler_gallery")||"[]")}catch{return[]}}
async function saveLocal(record){const list=getLocal();list.unshift(record);localStorage.setItem("clickler_gallery",JSON.stringify(list.slice(0,80)));$("saveStatus").textContent="Saved in this booth browser. Uploading the finished photo for QR delivery…"; }
async function uploadCloud(record){
 const {url,key}=state.cloud;
 if(!url||!key){$("saveStatus").textContent="Photo saved in this browser. Add Supabase details in Settings to enable QR delivery.";return null}
 try{
  const blob=await (await fetch(record.image)).blob();
  const path=`${new Date().toISOString().slice(0,10)}/${record.id}-${Math.random().toString(36).slice(2,8)}.jpg`;
  const upload=await fetch(`${url}/storage/v1/object/booth-photos/${path}`,{method:"POST",headers:{apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"image/jpeg","x-upsert":"false"},body:blob});
  if(!upload.ok)throw new Error(await upload.text());
  const publicUrl=`${url}/storage/v1/object/public/booth-photos/${path}`;
  $("saveStatus").textContent="Finished photo uploaded. QR is ready to share anywhere.";
  return publicUrl;
 }catch(e){$("saveStatus").textContent="Photo saved in this browser, but cloud upload failed. Check Supabase settings and internet.";console.error(e);return null}
}
async function makeQr(photoUrl){
 $("qrCode").innerHTML="";
 if(!photoUrl){$("qrStatus").textContent="QR unavailable. Check internet and Supabase settings.";return}
 try{
  const viewer=new URL("view.html",window.location.href);viewer.searchParams.set("photo",photoUrl);
  await QRCode.toCanvas(viewer.href,{width:190,margin:1,color:{dark:"#211f24",light:"#ffffff"}}).then(c=>$ ("qrCode").appendChild(c));
  $("qrStatus").textContent="Scan with any phone. Mobile data or Wi-Fi both work.";
 }catch(e){console.error(e);$("qrStatus").textContent="Could not create QR code."}
}
$("downloadResult").onclick=()=>downloadData(state.currentResult,`clickler-${Date.now()}.jpg`);
function downloadData(data,name){const a=document.createElement("a");a.href=data;a.download=name;a.click()}
$("printResult").onclick=()=>{const w=window.open("","_blank");if(!w){toast("Allow pop-ups to print.");return}w.document.write(`<html><head><title>Clickler Photo</title><style>body{margin:0;text-align:center}img{max-width:100%;max-height:96vh;object-fit:contain}@media print{img{width:100%;max-height:none}}</style></head><body><img src="${state.currentResult}" onload="window.print()"></body></html>`);w.document.close()};
$("makeGif").onclick=()=>{
 if(!window.gifshot){toast("GIF library did not load. Check internet connection.");return}
 $("makeGif").disabled=true;$("makeGif").textContent="CREATING GIF…";
 gifshot.createGIF({images:state.photos, gifWidth:480,gifHeight:360,interval:.65,numFrames:state.photos.length,frameDuration:1},obj=>{
  $("makeGif").disabled=false;$("makeGif").textContent="✧ CREATE GIF";
  if(!obj.error){state.gifUrl=obj.image;$("downloadGif").classList.remove("hidden");$("downloadGif").onclick=()=>downloadData(state.gifUrl,`clickler-${Date.now()}.gif`);toast("Your GIF is ready!")}else toast("Could not create GIF from these photos.")
 });
};
function renderGallery(){
 const list=getLocal();$("galleryCount").textContent=list.length;$("galleryGrid").innerHTML="";$("emptyGallery").classList.toggle("hidden",list.length>0);
 list.forEach(item=>{const card=document.createElement("article");card.className="gallery-card";const img=document.createElement("img");img.src=item.image;const meta=document.createElement("div");meta.className="meta";const span=document.createElement("span");span.textContent=item.event||"Photo Session";const date=document.createElement("span");date.textContent=new Date(item.created).toLocaleDateString();meta.append(span,date);const actions=document.createElement("div");actions.style.display="flex";actions.style.gap="6px";const dl=document.createElement("button");dl.textContent="DOWNLOAD";dl.onclick=()=>downloadData(item.image,`clickler-${item.id}.jpg`);const pr=document.createElement("button");pr.textContent="PRINT";pr.onclick=()=>{const w=window.open("");if(w){w.document.write(`<img src="${item.image}" style="max-width:100%" onload="window.print()">`);w.document.close()}};actions.append(dl,pr);card.append(img,meta,actions);$("galleryGrid").append(card)})
}
async function loadLogo(file){state.logo=await fileData(file);$("logoPreview").innerHTML=`<img src="${state.logo}" alt="Uploaded Clickler logo">`;drawTemplatePreview()}
$("logoFile").onchange=e=>{if(e.target.files[0])loadLogo(e.target.files[0])};
$("removeLogo").onclick=()=>{state.logo=null;$("logoPreview").innerHTML='<span class="brand-mark">C<span>✦</span></span><b>CLICKLER PHOTOBOOTH</b>';drawTemplatePreview()};
$("saveCloud").onclick=()=>{state.cloud={url:$("supabaseUrl").value.trim().replace(/\/$/,""),key:$("supabaseKey").value.trim()};localStorage.setItem("clickler_cloud",JSON.stringify(state.cloud));$("cloudStatus").textContent=state.cloud.url&&state.cloud.key?"Cloud settings saved on this browser. Test with a new session.":"Please enter both values.";toast("Cloud settings saved.")};
try{const c=JSON.parse(localStorage.getItem("clickler_cloud")||"{}");state.cloud=c;$("supabaseUrl").value=c.url||"";$("supabaseKey").value=c.key||"";if(c.url&&c.key)$("cloudStatus").textContent="Cloud settings loaded."}catch{}
$("galleryCount").textContent=getLocal().length;
drawTemplatePreview();
