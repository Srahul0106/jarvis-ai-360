'use strict';
const $=id=>document.getElementById(id);
const state={lang:'hi-IN',speak:true,endpoint:'',recognition:null,local:false,token:'',model:'llama3.2:1b',history:[]};
function section(name){document.querySelectorAll('.section').forEach(n=>n.classList.toggle('active',n.id===name));document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.section===name));}
document.querySelectorAll('.nav').forEach(n=>n.addEventListener('click',()=>section(n.dataset.section)));
function tick(){ $('clock').textContent=new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short'}).format(new Date());}
tick();setInterval(tick,30000);
$('themeBtn').addEventListener('click',()=>{document.body.classList.toggle('light');$('themeBtn').textContent=document.body.classList.contains('light')?'☾':'☀';});
function log(kind,text){const el=document.createElement('div');el.className='bubble '+kind;el.textContent=text;$('messages').appendChild(el);$('messages').scrollTop=$('messages').scrollHeight;}
function speak(text){if(!state.speak||!('speechSynthesis' in window))return;speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(text);utter.lang=state.lang;utter.rate=.95;const voices=speechSynthesis.getVoices();const hindi=voices.find(v=>v.lang.toLowerCase().startsWith('hi')&&/female|swara|kalpana/i.test(v.name))||voices.find(v=>v.lang.toLowerCase().startsWith('hi'));if(hindi&&state.lang==='hi-IN')utter.voice=hindi;speechSynthesis.speak(utter);}
function setStatus(v){$('modeBadge').textContent=v;$('heroTitle').textContent=v==='LISTENING'?'मैं सुन रही हूँ…':v==='PROCESSING'?'जवाब तैयार कर रही हूँ…':'नमस्ते! मुझसे बात करें';document.body.classList.toggle('listening',v==='LISTENING');}
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
   log('bot','वॉइस इनपुट: '+(hints[e.error]||'समस्या ('+e.error+'). दोबारा कोशिश करें।'));section('assistant');
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
 const has=(...words)=>words.some(w=>q.includes(w));
 if(has('समय','बजे','टाइम','time','samay','kitne baje'))return 'अभी '+new Intl.DateTimeFormat('hi-IN',{timeStyle:'short'}).format(new Date())+' बजे हैं।';
 if(has('तारीख','दिनांक','आज कौन सा दिन','date','today','tarikh','aaj ki date'))return 'आज '+new Intl.DateTimeFormat('hi-IN',{dateStyle:'full'}).format(new Date())+' है।';
 const sites=[{names:['यूट्यूब','youtube'],url:'https://www.youtube.com',label:'यूट्यूब'},{names:['गूगल','google'],url:'https://www.google.com',label:'गूगल'},{names:['गिटहब','github'],url:'https://github.com',label:'गिटहब'},{names:['जीमेल','gmail','मेल'],url:'https://mail.google.com',label:'जीमेल'}];
 const site=sites.find(s=>s.names.some(n=>q.includes(n)));
 if(site&&has('खोल','चालू','चलाओ','open','launch','start','kholo','khol')){const tab=window.open(site.url,'_blank');if(tab)tab.opener=null;return tab?site.label+' खोल दिया है।':'ब्राउज़र ने नई टैब रोकी हो सकती है। कृपया पॉपअप की अनुमति दें।';}
 if(has('जार्विस','जारविस','jarvis','नमस्ते','हेलो','hello','hi','hey'))return 'नमस्ते! मैं आपकी प्यारी जार्विस हूँ। 💙 बताइए, मैं आपकी क्या मदद करूँ?';
 if(has('क्या कर सकती','help','मदद','कमांड'))return 'मैं समय और तारीख बता सकती हूँ और गूगल, यूट्यूब, गिटहब या जीमेल खोल सकती हूँ। सामान्य AI सवालों के लिए अलग AI सर्वर चाहिए।';
 return 'माफ़ कीजिए, अभी मेरे पास केवल कुछ बेसिक हिंदी कमांड्स हैं। आप समय, तारीख पूछें या यूट्यूब खोलो कहें। पूरी AI बातचीत के लिए AI सर्वर जोड़ना होगा।';
}
async function handle(input){input=input.trim();if(!input)return;section('assistant');log('user',input);$('prompt').value='';setStatus('PROCESSING');let reply;
 try{
  if(state.local){
   const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Jarvis-Token':state.token},body:JSON.stringify({message:input,model:state.model,history:state.history})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'Local AI unavailable');
   reply=data.reply;state.history.push({role:'user',content:input},{role:'assistant',content:reply});state.history=state.history.slice(-10);
  }else if(state.endpoint){
   const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
   try{const res=await fetch(state.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:input}),signal:controller.signal});if(!res.ok)throw new Error('Backend returned HTTP '+res.status);const data=await res.json();if(typeof data.reply!=='string')throw new Error('Backend response missing reply');reply=data.reply;}
   finally{clearTimeout(timeout);}
  }else{reply=localAnswer(input);}
 }catch(err){reply='AI connection failed: '+err.message+'. Check your endpoint, CORS, HTTPS and server status.';}
 log('bot',reply);speak(reply);setStatus('STANDBY');}
$('chatForm').addEventListener('submit',e=>{e.preventDefault();handle($('prompt').value);});
document.querySelectorAll('[data-command]').forEach(b=>b.addEventListener('click',()=>handle(b.dataset.command)));
$('saveSettings').addEventListener('click',()=>{state.lang=$('language').value;state.speak=$('speakToggle').checked;const url=$('endpoint').value.trim();if(url&&!/^https:\/\//i.test(url)){log('bot','Please use an HTTPS AI backend URL.');section('assistant');return;}state.endpoint=url;$('aiMode').textContent=url?'AI BACKEND':'LOCAL COMMANDS';log('bot','Settings applied for this session.');section('assistant');});

/* Full Windows companion integration — token held in page memory only */
$('connectLocal').addEventListener('click',async()=>{
 const token=$('pairToken').value.trim();
 if(!token){$('localStatus').textContent='पहले pairing token डालें';return;}
 try{
  const res=await fetch('/api/models',{headers:{'X-Jarvis-Token':token}});
  const data=await res.json();
  if(!res.ok)throw new Error(data.error||'Connection failed');
  state.local=true;state.token=token;
  const models=data.models||[];const select=$('modelSelect');select.replaceChildren();
  for(const model of models){const option=document.createElement('option');option.value=model;option.textContent=model;select.appendChild(option);}
  if(!models.length){state.local=false;throw new Error('No Ollama model installed. Run: ollama pull llama3.2:1b');}
  state.model=select.value;
  $('localStatus').textContent='🟢 Ollama connected';$('aiMode').textContent='OLLAMA: '+state.model;
 }catch(e){state.local=false;$('localStatus').textContent='🔴 '+e.message;}
});
$('modelSelect').addEventListener('change',e=>{state.model=e.target.value;$('aiMode').textContent='OLLAMA: '+state.model;});
document.querySelectorAll('[data-pc]').forEach(button=>button.addEventListener('click',async()=>{
 const action=button.dataset.pc;
 if(!state.local){alert('पहले Settings में Local AI connect करें।');return;}
 if(!confirm('क्या आप अपने Windows PC पर '+action+' खोलना चाहते हैं?'))return;
 try{
  const res=await fetch('/api/action',{method:'POST',headers:{'Content-Type':'application/json','X-Jarvis-Token':state.token},body:JSON.stringify({action})});
  const data=await res.json();if(!res.ok)throw new Error(data.error);
  log('bot','आपकी अनुमति से '+action+' खोला गया।');section('assistant');
 }catch(e){alert('PC action failed: '+e.message);}
}));

document.querySelectorAll('[data-go-settings]').forEach(b=>b.addEventListener('click',()=>section('settings')));
