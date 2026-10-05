"""Explicit deterministic public projection. Never runs on Admin save or publish."""
import argparse
import json
import os
from pathlib import Path
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from admin.registry import load, public_export, RegistryError


def encoded(root=ROOT):
    return (json.dumps(public_export(load(root/'config/projects.registry.json')),ensure_ascii=False,indent=2)+'\n').encode('utf-8')


def generate(root=ROOT, *, write=False):
    payload=encoded(root)
    directory=root/'data/public';target=directory/'ecosystem.json'
    if any(p.is_symlink() for p in (target,directory,root/'data')):raise RegistryError('Destination refusée.')
    if not write:
        return target.is_file() and target.read_bytes()==payload
    directory.mkdir(exist_ok=True)
    fd,name=tempfile.mkstemp(prefix='.ecosystem-',dir=directory)
    try:
        with os.fdopen(fd,'wb') as stream:
            stream.write(payload);stream.flush();os.fsync(stream.fileno())
        os.chmod(name,0o644)
        os.replace(name,target)
    finally:
        if os.path.exists(name):os.unlink(name)
    return True


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    group=parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--check',action='store_true')
    group.add_argument('--write',action='store_true')
    args=parser.parse_args()
    try:
        if not generate(write=args.write):
            print('Export public absent ou différent ; génération explicite requise.',file=sys.stderr);sys.exit(1)
        print('Export public : OK')
    except (RegistryError,OSError) as exc:
        print('Export public refusé ; sources et catalogue éditorial préservés.',file=sys.stderr);sys.exit(1)
