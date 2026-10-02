"""Versioned project catalogue, distinct from the fixed launch allowlist.

Read-only, bounded and offline. Public export is an explicit projection, not
serialization of the administrative record or local configuration.
"""
import copy
import json
import os
from pathlib import Path
import re
import stat
from urllib.parse import urlsplit

LEVELS = {'A': 'Référencée', 'B': 'Présentée', 'C': 'Commercialisée',
          'D': 'Pilotée', 'E': 'Interconnectée', 'F': 'Automatisable'}
COMMERCIAL = {'non_commercial', 'gratuit', 'commercialisation_prevue', 'commercialise'}
STATES = {'stable', 'developpement', 'prevu', 'prive'}
TYPES = {'application', 'produit', 'infrastructure', 'hub', 'service'}
CAPABILITIES = {'local_api', 'versioned_json_exchange', 'cli', 'launchable_local_app',
                'public_web_app', 'product_page', 'analytics_source'}
LAUNCH_IDS = {'chest0-social-studio', 'chest0-ai-studio', 'chest0-quiz-studio'}
KEYS = {'project_id', 'name', 'short_name', 'description', 'category', 'state',
        'stable_version', 'stable_commit', 'type', 'platforms', 'admin_visible',
        'public_visible', 'commercial_status', 'integration_levels', 'launch_id',
        'repository', 'documentation', 'public_links', 'capabilities', 'dependencies', 'notes'}
PUBLIC_KEYS = ('project_id', 'name', 'short_name', 'description', 'category', 'type',
               'platforms', 'commercial_status', 'public_links')


class RegistryError(ValueError):
    pass


def fail():
    raise RegistryError('Registre indisponible ou incompatible ; aucune action autorisée par ce catalogue.')


def identifier(value):
    if not isinstance(value, str) or not re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', value) or len(value)>64:
        fail()
    return value


def text(value, maximum=500):
    if not isinstance(value, str) or not value.strip() or len(value)>maximum or any(ord(c)<32 for c in value):
        fail()
    # Public descriptive values must not contain machine paths or credentials.
    if re.search(r'(?:/Users/|/home/|[A-Za-z]:\\|file:|Bearer\s|(?:token|secret|api[_-]?key|password)\s*[:=])', value, re.I):
        fail()


def url(value):
    text(value, 500)
    try:
        parsed=urlsplit(value)
    except ValueError:fail()
    if (parsed.scheme!='https' or not parsed.hostname or parsed.username or parsed.password
            or parsed.query or parsed.fragment or '\\' in value or '%' in parsed.netloc):fail()
    if not re.fullmatch(r'[a-zA-Z0-9.-]+', parsed.hostname) or '.' not in parsed.hostname:fail()
    try:
        if parsed.port not in (None,443):fail()
    except ValueError:fail()


def strings(value, maximum=16):
    if not isinstance(value,list) or len(value)>maximum:fail()
    for item in value:text(item,100)
    if len(set(value))!=len(value):fail()


def validate(payload):
    try:
        if not isinstance(payload,dict) or set(payload)!={'schema_version','projects'}:fail()
        if type(payload['schema_version']) is not int or payload['schema_version']!=1:fail()
        rows=payload['projects']
        if not isinstance(rows,list) or not 1<=len(rows)<=64:fail()
        ids=set()
        for row in rows:
            if not isinstance(row,dict) or set(row)!=KEYS:fail()
            pid=identifier(row['project_id'])
            if pid in ids:fail()
            ids.add(pid)
            for key in ('name','short_name','description','category','notes'):text(row[key])
            if row['state'] not in STATES or row['type'] not in TYPES or row['commercial_status'] not in COMMERCIAL:fail()
            if type(row['admin_visible']) is not bool or type(row['public_visible']) is not bool:fail()
            for key in ('platforms','integration_levels','capabilities','dependencies'):strings(row[key])
            if not row['integration_levels'] or not set(row['integration_levels'])<=LEVELS.keys():fail()
            if not set(row['capabilities'])<=CAPABILITIES:fail()
            if row['stable_version'] is not None and not re.fullmatch(r'v\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?',row['stable_version']):fail()
            if row['stable_commit'] is not None and not re.fullmatch(r'[a-f0-9]{40}',row['stable_commit']):fail()
            if row['launch_id'] is not None and (row['launch_id']!=pid or pid not in LAUNCH_IDS):fail()
            if row['repository'] is not None:url(row['repository'])
            for key in ('documentation','public_links'):
                strings(row[key],8)
                for link in row[key]:url(link)
        for row in rows:
            if not set(row['dependencies'])<=ids or row['project_id'] in row['dependencies']:fail()
        return payload
    except (TypeError,KeyError,RecursionError,OverflowError):fail()


def read_json(path):
    """Reject symlink components, non-regular/hardlinked files and oversized JSON."""
    path=Path(path).absolute()
    if any(p.is_symlink() for p in (path,*path.parents)):fail()
    try:
        fd=os.open(path,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK)
        with os.fdopen(fd,'rb') as stream:
            info=os.fstat(stream.fileno())
            if not stat.S_ISREG(info.st_mode) or info.st_nlink!=1 or info.st_size>131072:fail()
            raw=stream.read(131073)
            if len(raw)>131072:fail()
            def unique(pairs):
                result={}
                for key,value in pairs:
                    if key in result:fail()
                    result[key]=value
                return result
            return json.loads(raw,object_pairs_hook=unique)
    except (OSError,ValueError,RecursionError):fail()


def load(path):
    return validate(read_json(path))


def public_export(payload):
    validate(payload)
    return {'schema_version':1,'projects':[
        {key:copy.deepcopy(row[key]) for key in PUBLIC_KEYS}
        for row in payload['projects'] if row['public_visible']]}


def availability(config_path):
    """Presence only. No health request, subprocess or application file execution."""
    try:
        data=read_json(config_path)
        if not isinstance(data,dict) or set(data)!={'applications'} or not isinstance(data['applications'],dict):fail()
        result={}
        for pid,item in data['applications'].items():
            identifier(pid)
            if not isinstance(item,dict) or set(item)!={'root'} or not isinstance(item['root'],str):fail()
            raw=item['root']
            if len(raw)>1024 or '\x00' in raw or '..' in Path(raw).parts:fail()
            root=Path(raw).expanduser()
            if not root.is_absolute():fail()
            if any(p.is_symlink() for p in (root,*root.parents)):
                result[pid]='chemin_refuse'
            else:result[pid]='present' if root.is_dir() else 'absent'
        return result
    except (RegistryError,OSError,RuntimeError):return {}


def admin_view(path,config_path):
    try:
        data=load(path);local=availability(config_path)
        rows=[]
        for row in data['projects']:
            if not row['admin_visible']:continue
            item=copy.deepcopy(row)
            item['local_status']='natif' if row['project_id']=='chest0-hub' else local.get(row['project_id'],'non_configure')
            rows.append(item)
        return {'ok':True,'schema_version':1,'projects':rows,'levels':LEVELS}
    except RegistryError:
        return {'ok':False,'error':'Registre indisponible ou incompatible. Les contenus du site restent accessibles.','projects':[]}
