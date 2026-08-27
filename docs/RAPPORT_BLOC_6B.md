# Rapport final — Bloc 6B

Date de validation : 27 août 2026

## Décision

Le Bloc 6B est validé. Le panneau d'administration « Écosystème local » est opérationnel et respecte l'Option B arrêtée au Bloc 6A.

## Baselines

| Application | Branche | HEAD initial | État initial |
| --- | --- | --- | --- |
| Chest0 Quiz Studio | `main` | `9a4d0d443a20567cf0e363acff5b1d731e21839a` | propre |
| Chest0 AI Studio | `main` | `1d41248044cb25618dbedbb368f709132233505a` | propre |
| Chest0 Hub | `main` | `483d615b46c91615011e780490fa9eb5e7bec8e6` | propre, synchronisé avec `origin/main` |

La sauvegarde temporaire et les manifestes de référence sont conservés dans :

`/private/tmp/chest0-block6b-20260827.RXqdpf`

Ils comprennent l'archive des fichiers suivis de Hub, les informations Git et les empreintes SHA-256 des zones persistantes des trois applications. L'archive a été relue et son empreinte vérifiée.

## Implémentation

- registre strict limité à Chest0 Quiz Studio et Chest0 AI Studio ;
- configuration locale non versionnée, accompagnée d'un exemple versionné ;
- lancement de Streamlit sur `127.0.0.1` avec les ports fixes 8501 et 8502 ;
- commandes construites sous forme de listes d'arguments, sans shell ;
- suivi en mémoire des seuls processus lancés par la session Hub ;
- refus d'arrêter un service qui n'appartient pas à Hub ;
- détection des ports libres, occupés et des applications Streamlit déjà actives ;
- arrêt contrôlé et nettoyage des processus à la fermeture de Hub ;
- API locale protégée contre les requêtes POST intersites par jeton CSRF ;
- réponses publiques sans chemin absolu, PID ou commande système ;
- panneau Admin affichant disponibilité, version, HEAD court, port et état ;
- guide visuel non persistant du parcours Quiz Exchange ;
- aucune lecture, copie, modification ou import de paquet Exchange par Hub.

## Tests automatisés

| Campagne | Résultat |
| --- | --- |
| Chest0 Hub — Python | 27/27 |
| Chest0 Hub — Deno | 2/2 |
| Chest0 Quiz Studio | 216/216 |
| Chest0 AI Studio | 76/76 |

La validation complète de Hub, comprenant syntaxe, tests, intégrité des données et absence de fichiers Python compilés parasites, est passante.

Un test d'intégration réel a également démarré, contrôlé puis arrêté successivement :

- Quiz Studio 1.1.0, HEAD `9a4d0d44`, sur `127.0.0.1:8501` ;
- AI Studio 1.1.0, HEAD `1d412480`, sur `127.0.0.1:8502`.

## Intégrité

Les 2 412 empreintes SHA-256 établies avant intervention sont strictement identiques après l'implémentation et les campagnes de tests :

- Quiz Studio : 48 fichiers persistants contrôlés ;
- AI Studio : 2 349 fichiers persistants contrôlés ;
- Hub : 15 fichiers persistants contrôlés.

Aucune donnée utilisateur, base SQLite, ressource audio, média ou paquet JSON n'a été modifié. Quiz Studio et AI Studio conservent leurs HEAD initiaux et un état Git propre.

## Validation humaine

La validation dans le navigateur a confirmé :

- le démarrage, l'ouverture et l'arrêt propres des deux applications depuis Hub ;
- l'ouverture de Quiz Studio sur le port 8501 et d'AI Studio sur le port 8502 ;
- l'exactitude des ports et des états affichés ;
- la clarté du guide visuel et de l'interface ;
- l'absence de chemin absolu, PID ou commande système exposé.

## Périmètre des opérations

Les modifications de code sont limitées à Chest0 Hub. Aucun tag, push ou déploiement n'a été effectué. Le commit final est local.

## Conclusion

**A — Bloc 6B validé.** Chest0 Hub remplit son rôle de lanceur local, d'indicateur d'état et de guide visuel sans dupliquer les responsabilités de Quiz Studio ou d'AI Studio et sans affaiblir la confirmation humaine obligatoire du parcours Quiz Exchange.
