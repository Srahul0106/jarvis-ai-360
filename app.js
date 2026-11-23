'use strict';
const $=id=>document.getElementById(id);
const state={lang:'hi-IN',speak:true,endpoint:'',recognition:null};
function section(name){document.querySelectorAll('.section').forEach(n=>n.classList.toggle('active',n.id===name));document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.section===name));}
document.querySelectorAll('.nav').forEach(n=>n.addEventListener('click',()=>section(n.dataset.section)));
function tick(){ $('clock').textContent=new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(new Date());}
tick();setInterval(tick,30000);
$('themeBtn').addEventListener('click',()=>{document.body.classList.toggle('light');$('themeBtn').textContent=document.body.classList.contains('light')?'☾':'☀';});
function log(kind,text){const el=document.createElement('div');el.className='bubble '+kind;el.textContent=text;$('messages').appendChild(el);$('messages').scrollTop=$('messages').scrollHeight;}
function speak(text){if(!state.speak||!('speechSynthesis' in window))return;speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(text);utter.lang=state.lang;utter.rate=1;speechSynthesis.speak(utter);}
function setStatus(v){$('modeBadge').textContent=v;$('heroTitle').textContent=v==='LISTENING'?'LISTENING TO YOU':v==='PROCESSING'?'PROCESSING COMMAND':'AWAITING YOUR COMMAND';document.body.classList.toggle('listening',v==='LISTENING');}
function startVoice(){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){const msg='Speech recognition is unavailable in this browser. Try Chrome or Edge and grant microphone permission, or use the text input.';log('bot',msg);section('assistant');return;}
 try{
  if(state.recognition){state.recognition.stop();state.recognition=null;}
  const rec=new SR();state.recognition=rec;rec.lang=state.lang;rec.interimResults=false;rec.maxAlternatives=1;
  rec.onstart=()=>{setStatus('LISTENING');$('voiceStatus').textContent='LISTENING';};
  rec.onresult=e=>{const input=e.results[0][0].transcript;handle(input);};
  rec.onerror=e=>{setStatus('STANDBY');$('voiceStatus').textContent='READY';log('bot','Voice error: '+e.error+'. Check microphone permission and browser support.');section('assistant');};
  rec.onend=()=>{setStatus('STANDBY');$('voiceStatus').textContent='READY';state.recognition=null;};
  rec.start();
 }catch(e){setStatus('STANDBY');log('bot','Could not start microphone: '+e.message);}
}
function stopVoice(){if(state.recognition){state.recognition.abort();state.recognition=null;}if('speechSynthesis' in window)speechSynthesis.cancel();setStatus('STANDBY');$('voiceStatus').textContent='READY';}
$('orb').addEventListener('click',startVoice);$('voiceBtn').addEventListener('click',startVoice);$('mic').addEventListener('click',startVoice);$('stopBtn').addEventListener('click',stopVoice);
function localAnswer(raw){
 const q=raw.toLowerCase().trim();
 if(/\b(time|samay|kitne baje|kitna baja)\b/.test(q))return 'It is '+new Intl.DateTimeFormat('en-IN',{timeStyle:'medium'}).format(new Date())+'.';
 if(/\b(date|today|tarikh|tareekh|aaj)\b/.test(q))return 'Today is '+new Intl.DateTimeFormat('en-IN',{dateStyle:'full'}).format(new Date())+'.';
 if(/\b(hello|hi|hey|namaste|jarvis)\b/.test(q))return 'Namaste! Main JARVIS hoon. Aap mujhe time, date ya website open karne ko keh sakte hain.';
 const sites=[['youtube','https://www.youtube.com'],['google','https://www.google.com'],['github','https://github.com'],['gmail','https://mail.google.com']];
 const match=sites.find(([name])=>q.includes(name)&&/\b(open|kholo|khol|launch|start)\b/.test(q));
 if(match){const win=window.open(match[1],'_blank','noopener,noreferrer');return win?'Opening '+match[0]+'.':'Browser ne popup block kiya ho sakta hai. Please allow popups for this site.';}
 return 'This is the free browser-command edition. I can handle time, date and opening Google, YouTube, GitHub or Gmail. Full AI chat requires connecting a trusted backend under Settings.';
}
async function handle(input){input=input.trim();if(!input)return;section('assistant');log('user',input);$('prompt').value='';setStatus('PROCESSING');let reply;
 try{
  if(state.endpoint){
   const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
   try{const res=await fetch(state.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:input}),signal:controller.signal});if(!res.ok)throw new Error('Backend returned HTTP '+res.status);const data=await res.json();if(typeof data.reply!=='string')throw new Error('Backend response missing reply');reply=data.reply;}
   finally{clearTimeout(timeout);}
  }else{reply=localAnswer(input);}
 }catch(err){reply='AI connection failed: '+err.message+'. Check your endpoint, CORS, HTTPS and server status.';}
 log('bot',reply);speak(reply);setStatus('STANDBY');}
$('chatForm').addEventListener('submit',e=>{e.preventDefault();handle($('prompt').value);});
document.querySelectorAll('[data-command]').forEach(b=>b.addEventListener('click',()=>handle(b.dataset.command)));
$('saveSettings').addEventListener('click',()=>{state.lang=$('language').value;state.speak=$('speakToggle').checked;const url=$('endpoint').value.trim();if(url&&!/^https:\/\//i.test(url)){log('bot','Please use an HTTPS AI backend URL.');section('assistant');return;}state.endpoint=url;$('aiMode').textContent=url?'AI BACKEND':'LOCAL COMMANDS';log('bot','Settings applied for this session.');section('assistant');});
