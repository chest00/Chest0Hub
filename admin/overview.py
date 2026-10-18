"""Vue de supervision privée en lecture seule, sans publication ni commandes."""
from __future__ import annotations


def build_overview(registry, statuses):
    """Joint le registre officiel aux états de processus allowlistés."""
    if not isinstance(registry, dict) or registry.get('ok') is not True:
        return {'ok': False, 'error': 'Registre privé indisponible.', 'projects': []}
    by_id = {x.get('id'): x for x in statuses if isinstance(x, dict) and isinstance(x.get('id'), str)}
    rows = []
    for project in registry.get('projects', []):
        if not isinstance(project, dict) or not project.get('admin_visible', False):
            continue
        pid = project.get('project_id')
        status = by_id.get(pid)
        rows.append({
            'id': pid,
            'name': project.get('name', ''),
            'state': project.get('state', 'indéterminé'),
            'stable_version': project.get('stable_version'),
            'governance': project.get('governance', {}),
            'integration_levels': list(project.get('integration_levels', [])),
            'local_status': project.get('local_status', 'non_configure'),
            'runtime_state': status.get('state') if status else 'non_pilote',
            'runtime_version': status.get('version') if status else None,
            'launch_supported': status is not None,
        })
    return {'ok': True, 'projects': rows, 'count': len(rows),
            'note': 'État local indicatif ; aucune action ni publication déclenchée.'}
