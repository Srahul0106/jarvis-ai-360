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
function resetVoiceUI(){setStatus('STANDBY');$('voiceStatus').textContent='READY';}
function startVoice(){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){log('bot','Voice input is not supported here. Try an updated Chrome or Edge browser, or type your command.');section('assistant');return;}
 if(state.recognition){return;} // Avoid aborting a running session by repeatedly tapping the microphone
 if('speechSynthesis' in window)speechSynthesis.cancel();
 try{
  const rec=new SR();state.recognition=rec;rec.lang=state.lang;rec.interimResults=false;rec.continuous=false;rec.maxAlternatives=1;
  let received=false;let manuallyStopped=false;
  rec.onstart=()=>{if(state.recognition===rec){setStatus('LISTENING');$('voiceStatus').textContent='LISTENING';}};
  rec.onresult=e=>{if(state.recognition!==rec)return;received=true;const input=e.results[0][0].transcript;handle(input);};
  rec.onerror=e=>{
   if(state.recognition!==rec)return;
   if(e.error==='aborted'&&manuallyStopped)return;
   if(e.error==='aborted')return; // Browser cancellation is not necessarily a microphone permission failure
   const hints={'not-allowed':'Microphone permission was denied. Allow it in the browser site settings.','service-not-allowed':'Speech recognition service is unavailable or blocked.','audio-capture':'No working microphone was found. Check Windows microphone settings.','network':'Speech recognition network service failed. Check your connection.','no-speech':'No speech was detected. Please try again.','language-not-supported':'Selected speech language is not supported. Try English (India).'};
   log('bot','Voice input: '+(hints[e.error]||'Recognition failed ('+e.error+'). Please try again.'));section('assistant');
  };
  rec.onend=()=>{if(state.recognition!==rec)return;state.recognition=null;if(!received)resetVoiceUI();else $('voiceStatus').textContent='READY';};
  rec._stopSafely=()=>{manuallyStopped=true;rec.abort();};
  rec.start();
 }catch(e){state.recognition=null;resetVoiceUI();log('bot','Could not start voice input: '+e.message);section('assistant');}
}
function stopVoice(){const rec=state.recognition;state.recognition=null;if(rec){try{rec._stopSafely();}catch(e){}}if('speechSynthesis' in window)speechSynthesis.cancel();resetVoiceUI();}
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
