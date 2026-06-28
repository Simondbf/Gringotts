# Gringotts - Coffre-fort numérique personnel

Gringotts est un coffre-fort numérique personnel conçu pour stocker et gérer vos médias en toute sécurité. Construit avec des technologies modernes et performantes, il vous permet de garder le contrôle total sur vos données privées.

## 🚀 Technologies utilisées (Stack Technique)

*   **Frontend :** React 19, Vite, Tailwind CSS v4
*   **Backend / Base de données :** PocketBase (solution légère et performante, auto-hébergée)
*   **Infrastructure :** Docker, Nginx (pour le reverse proxy)

## 🏗 Architecture & Déploiement

Le projet est entièrement **conteneurisé avec Docker**, ce qui facilite grandement son déploiement sur n'importe quel VPS ou environnement d'hébergement.

L'application est divisée en plusieurs services conteneurisés (le frontend Gringotts et le backend PocketBase) qui interagissent de manière sécurisée. Pour assurer une sécurité optimale, l'application est pensée pour tourner de façon isolée derrière un **reverse proxy** (Nginx, Traefik, etc.), ce qui permet de rejeter tout trafic direct non autorisé et de centraliser la gestion du trafic public de façon sécurisée.

## 💾 Persistance des données

Les données et médias du backend PocketBase sont stockés en sécurité via des volumes persistants locaux (`pb_data`), garantissant l'intégrité de votre coffre-fort numérique même lors des redémarrages.
