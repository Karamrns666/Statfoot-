# Mise en service de Supabase (comptes admin et données partagées)

Tant que les variables ci-dessous ne sont pas renseignées, le site fonctionne comme avant (données dans le navigateur).

## 1. Base de données
Supabase → **SQL Editor** → *New query* → coller le contenu de `supabase/schema.sql` → **Run** (ré-exécutable sans risque).

## 2. Réglages Supabase
- **Authentication → URL Configuration** : *Site URL* = `https://www.ardentia-foot.com` ; ajouter
  `https://www.ardentia-foot.com/admin/reinitialisation` (et les variantes sans www et statfoot-eta.vercel.app) dans *Redirect URLs*.
- **Authentication → Rate Limits** : limite des connexions par adresse IP (par ex. 10 / 5 min).
- **Authentication → Emails → SMTP** (recommandé) : brancher un vrai service d'envoi (Resend, Brevo…) — l'envoi
  intégré de Supabase est limité à quelques e-mails par heure.
- Modèles d'e-mails (*Reset password*, *Invite user*) : à traduire en français si souhaité.

## 3. Variables d'environnement
Dans **Vercel → Project → Settings → Environment Variables** (Production + Preview) **et** dans `.env.local`
(non versionné, à la racine du projet ; modèle : `.env.example`) :

| Variable | Où la trouver | Publique ? |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | oui |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` | oui |
| `SUPABASE_URL` | même valeur que `VITE_SUPABASE_URL` | non |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` | **secrète** |
| `SUPERADMIN_INITIAL_PASSWORD` | le mot de passe initial commun | **secrète** |
| `SEED_TOKEN` | une longue chaîne aléatoire de votre choix | **secrète** |

Les variables secrètes ne commencent jamais par `VITE_` : elles ne sont donc jamais intégrées au site public.
Après avoir ajouté les variables : Vercel → Deployments → *Redeploy*.

## 4. Créer les 7 super-admins (idempotent)
Au choix :
- sur votre ordinateur : `npm run seed:admins` (lit `.env.local`) ;
- ou sans Node : `curl -X POST https://www.ardentia-foot.com/api/seed-superadmins -H "Authorization: Bearer <SEED_TOKEN>"`.

Un compte déjà existant garde son mot de passe : seul son rôle passe à super-admin.
Chaque nouveau compte doit changer son mot de passe à la première connexion.

## 5. Première mise en service des données
Se connecter en super-admin depuis le navigateur qui a les bonnes données → **Admin → Administrateurs** →
**Initialiser la base**. Ensuite, tous les admins et tous les visiteurs (site, mode TV) voient les mêmes données ;
les modifications apparaissent sur les autres écrans en quelques secondes.

## Sécurité
- Mots de passe hachés (bcrypt) par Supabase Auth ; réinitialisation par e-mail ; limitation des tentatives
  (Supabase côté serveur + blocage 15 min après 5 échecs côté site).
- Lecture publique des données du site ; écriture réservée aux comptes admin actifs (Row Level Security).
  Journal, conseil de discipline (votes) et PV : lecture réservée aux admins.
- Gestion des admins via `/api/admin-users` : le serveur revérifie que l'appelant est super-admin ; chaque action
  est inscrite au journal (qui, quoi, quand). Il reste toujours au moins un super-admin.
- Limite connue : les photos importées (stockées dans le navigateur) ne sont pas encore partagées via Supabase.
