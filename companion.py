"""JARVIS local companion. Python standard library only. Binds to 127.0.0.1."""
import json, os, secrets, subprocess, sys, urllib.request, urllib.error, webbrowser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parent
TOKEN=secrets.token_urlsafe(24)
PORT=8765
ALLOWED={'notepad': ['notepad.exe'], 'calculator':['calc.exe'], 'paint':['mspaint.exe'], 'explorer':['explorer.exe']}
SYSTEM='तुम जार्विस नाम की दोस्ताना हिंदी AI असिस्टेंट हो। उपयोगकर्ता को सरल हिंदी में जवाब दो। कोई भी PC action खुद से मत करो।'
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
 def end_headers(self):
  self.send_header('X-Content-Type-Options','nosniff')
  self.send_header('Cache-Control','no-store')
  super().end_headers()
 def reply(self,code,data):
  body=json.dumps(data,ensure_ascii=False).encode('utf-8')
  self.send_response(code);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
 def auth(self):
  return secrets.compare_digest(self.headers.get('X-Jarvis-Token',''),TOKEN)
 def do_GET(self):
  if self.path=='/api/status':
   return self.reply(200,{'online':True,'auth_required':True})
  if self.path=='/api/models':
   if not self.auth():return self.reply(401,{'error':'Pairing token required'})
   try:
    with urllib.request.urlopen('http://127.0.0.1:11434/api/tags',timeout=5) as r:
     data=json.load(r)
    return self.reply(200,{'models':[x['name'] for x in data.get('models',[])]})
   except Exception as e:return self.reply(503,{'error':'Ollama unavailable: '+str(e)})
  if self.path.startswith('/api/'):return self.reply(404,{'error':'Not found'})
  return super().do_GET()
 def do_POST(self):
  if self.path not in ('/api/chat','/api/action'):return self.reply(404,{'error':'Not found'})
  if not self.auth():return self.reply(401,{'error':'Invalid pairing token'})
  try:
   n=int(self.headers.get('Content-Length','0'))
   if n<1 or n>25000:return self.reply(413,{'error':'Invalid request size'})
   body=json.loads(self.rfile.read(n))
   if not isinstance(body,dict):raise ValueError('Invalid request')
   if self.path=='/api/action':
    action=body.get('action')
    if action not in ALLOWED:return self.reply(400,{'error':'Action not allowed'})
    if sys.platform!='win32':return self.reply(400,{'error':'Windows only'})
    subprocess.Popen(ALLOWED[action],shell=False)
    return self.reply(200,{'reply':action+' opened'})
   message=body.get('message','')
   model=body.get('model','llama3.2:1b')
   if not isinstance(message,str) or not 0<len(message)<=4000:return self.reply(400,{'error':'Message must be 1–4000 characters'})
   if not isinstance(model,str) or len(model)>100 or not all(c.isalnum() or c in '.:_-' for c in model):return self.reply(400,{'error':'Invalid model'})
   history=body.get('history',[])
   if not isinstance(history,list):history=[]
   history=[{'role':h['role'],'content':h['content'][:4000]} for h in history[-10:] if isinstance(h,dict) and h.get('role') in ('user','assistant') and isinstance(h.get('content'),str)]
   payload=json.dumps({'model':model,'messages':[{'role':'system','content':SYSTEM}]+history+[{'role':'user','content':message}],'stream':False},ensure_ascii=False).encode('utf-8')
   req=urllib.request.Request('http://127.0.0.1:11434/api/chat',data=payload,headers={'Content-Type':'application/json'},method='POST')
   with urllib.request.urlopen(req,timeout=180) as r:result=json.load(r)
   return self.reply(200,{'reply':result.get('message',{}).get('content','No reply')})
  except urllib.error.HTTPError as e:return self.reply(502,{'error':'Ollama HTTP '+str(e.code)+'. Check installed model.'})
  except Exception as e:return self.reply(503,{'error':str(e)})
if __name__=='__main__':
 os.chdir(ROOT)
 print('\nJARVIS LOCAL COMPANION')
 print('Pairing token (paste into JARVIS Settings): '+TOKEN)
 print('Open http://127.0.0.1:'+str(PORT)+'/')
 print('Keep this window open. Press Ctrl+C to stop.')
 try:
  server=ThreadingHTTPServer(('127.0.0.1',PORT),Handler)
  webbrowser.open('http://127.0.0.1:'+str(PORT)+'/')
  server.serve_forever()
 except KeyboardInterrupt:pass
