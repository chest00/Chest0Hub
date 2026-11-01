#!/usr/bin/env python3
"""Chest0 Hub Admin 2.1: local-only, stdlib, no remote writes."""
import hashlib, http.server, json, os, pathlib, secrets, subprocess, sys, threading, urllib.parse, webbrowser
ROOT=pathlib.Path.home()/'Applications'/'Chest0Hub'
APP=ROOT/'admin-v21'
PORT=8765
TOKEN=secrets.token_urlsafe(32)
ALLOWED_ROOT=(pathlib.Path.home()/'Applications').resolve()
SKIP={'Desktop','Projet Chest0 AI Studio'}

def inventory():
    out=[]
    for path in sorted(ALLOWED_ROOT.iterdir()):
        if path.is_symlink() or not path.is_dir() or path.name.startswith('.') or path.name in SKIP:continue
        if not path.name.lower().startswith('chest0'):continue
        # Discovery is shallow, no recursive access to application data.
        out.append({'name':path.name,'path':str(path),'type':'dossier','state':'présent (non testé)', 'launchable':path.suffix=='.app'})
    return out

def safe_launch(name):
    # Only .app bundles within ~/Applications/Chest0*; never execute shell commands.
    if not isinstance(name,str) or '/' in name or '\\' in name or not name.startswith('Chest0') or not name.endswith('.app'):raise ValueError('Application non autorisée')
    p=ALLOWED_ROOT/name
    if p.is_symlink() or not p.is_dir() or p.resolve().parent!=ALLOWED_ROOT:raise ValueError('Chemin refusé')
    subprocess.Popen(['/usr/bin/open',str(p)],stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)

class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self,fmt,*args):pass
    def send(self,status,data,ctype='application/json; charset=utf-8'):
        payload=data if isinstance(data,bytes) else json.dumps(data,ensure_ascii=False).encode()
        self.send_response(status);self.send_header('Content-Type',ctype);self.send_header('Content-Length',str(len(payload)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");self.end_headers();self.wfile.write(payload)
    def authorized(self):return self.headers.get('X-Chest0-Token')==TOKEN
    def valid_host(self):return self.headers.get('Host')==f'127.0.0.1:{PORT}'
    def do_GET(self):
        if not self.valid_host():return self.send(403,{'error':'Hôte refusé'})
        path=urllib.parse.urlsplit(self.path).path
        if path=='/':return self.send(200,(APP/'index.html').read_bytes(),'text/html; charset=utf-8')
        if path=='/app.js':return self.send(200,(APP/'app.js').read_bytes(),'application/javascript; charset=utf-8')
        if path=='/style.css':return self.send(200,(APP/'style.css').read_bytes(),'text/css; charset=utf-8')
        if path=='/api/status':
            if not self.authorized():return self.send(403,{'error':'Accès refusé'})
            return self.send(200,{'version':'2.1.0-local','mode':'local','applications':inventory(),'public_url':'https://chest0.fr','remote_deployment':'non vérifié','hub':str(ROOT)})
        return self.send(404,{'error':'Introuvable'})
    def do_POST(self):
        if not self.valid_host():return self.send(403,{'error':'Hôte refusé'})
        if urllib.parse.urlsplit(self.path).path!='/api/launch':return self.send(404,{'error':'Introuvable'})
        if not self.authorized() or self.headers.get('Origin')!=f'http://127.0.0.1:{PORT}':return self.send(403,{'error':'Accès refusé'})
        try:
            n=int(self.headers.get('Content-Length','0'))
            if n<1 or n>2048:raise ValueError('Taille invalide')
            name=json.loads(self.rfile.read(n))['name'];safe_launch(name)
            return self.send(200,{'status':'demande envoyée au système','name':name})
        except Exception as e:return self.send(400,{'error':str(e)})

def main():
    import socketserver
    class Server(http.server.ThreadingHTTPServer):allow_reuse_address=True
    with Server(('127.0.0.1',PORT),Handler) as server:
        print('========== DÉBUT RAPPORT CHEST0 HUB ==========')
        print(json.dumps({'version':'2.1.0-local','statut':'ADMIN_LOCAL_DEMARRE','url':f'http://127.0.0.1:{PORT}/','applications_detectees':len(inventory()),'github':'NON_MODIFIE','deploiement':'NON_EFFECTUE'},ensure_ascii=False,indent=2))
        print('========== FIN RAPPORT CHEST0 HUB ==========',flush=True)
        # Token passed only in fragment; fragments are not sent to the HTTP server.
        webbrowser.open(f'http://127.0.0.1:{PORT}/#token={TOKEN}')
        try:server.serve_forever()
        except KeyboardInterrupt:pass
if __name__=='__main__':main()
