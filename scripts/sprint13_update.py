"""Local Sprint 13 verification and guarded restoration. No remote operations."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / 'backups/sprint13'

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None


def run(root=ROOT, restore=False):
    bundle = root / 'backups/sprint13'
    manifest = json.loads((bundle / 'manifest.json').read_text())
    if subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip() != manifest['head']:
        raise RuntimeError('HEAD différent : intervention interrompue.')
    if subprocess.check_output(['git', 'branch', '--show-current'], cwd=root, text=True).strip() != 'main':
        raise RuntimeError('Branche différente : intervention interrompue.')
    for name, entry in manifest['files'].items():
        target = root / name
        if any(p.is_symlink() for p in (target, *target.parents)) or digest(target) != entry['after']:
            raise RuntimeError('Fichier modifié depuis préparation : ' + name)
        if entry['before'] is not None and digest(bundle / 'before' / name) != entry['before']:
            raise RuntimeError('Sauvegarde non conforme : ' + name)
    if not restore:
        subprocess.run(['bash', 'scripts/validate.sh'], cwd=root, check=True)
        return
    # Preflight all files before any restoration; no changed user file is overwritten.
    for name, entry in manifest['files'].items():
        target = root / name
        if digest(target) != entry['after']:
            raise RuntimeError('Modification concurrente : ' + name)
        if entry['before'] is not None:
            shutil.copy2(bundle / 'before' / name, target)
        else:
            # Preserve added files rather than delete them.
            saved = bundle / 'retired' / name
            saved.parent.mkdir(parents=True, exist_ok=True)
            target.replace(saved)
    for name, entry in manifest['files'].items():
        if digest(root / name) != entry['before']:
            raise RuntimeError('Restauration non conforme : ' + name)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--restore', action='store_true')
    args = parser.parse_args()
    print('\033[36mDEBUT CHEST0 SPRINT 13\033[0m', flush=True)
    try:
        run(restore=args.restore)
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        print('ÉCHEC :', error, file=sys.stderr)
        sys.exit(1)
    print('\033[32mFIN CHEST0 SPRINT 13 — OK\033[0m')
