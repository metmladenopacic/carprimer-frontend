# CarPrimer — CI/CD i deploy uputstvo

Sistem ima **dva repozitorijuma**:

| Repo | Tehnologija | Docker Hub image | Render servis |
|------|-------------|------------------|---------------|
| `carprimer-backend` | Spring Boot 3.5 / Java 17 | `<docker-user>/cardatabase-backend:latest` | Web Service (Docker) + PostgreSQL baza |
| `carprimer-frontend` | Vite + React + nginx | `<docker-user>/cardatabase-frontend:latest` | Web Service (Docker) |

## Kako pipeline radi (na svaki `git push` na `main`)

Svaki repo ima **jedan** workflow `.github/workflows/ci-cd.yml` sa dva job-a. Deploy **čeka** da testovi prođu (`needs: test`), i pokreće se **samo na push na `main`** (ne na pull request):

```
push -> GitHub Actions (ci-cd.yml)
          job: test     (push i PR)   build + testovi
                │  (samo ako prođe)
                ▼
          job: deploy   (samo push)   build image -> Docker Hub -> POST /deploys na Render
                                                                      └─ Render povuče :latest i redeployuje
```

- **Backend** `test`: `./mvnw clean verify` (build + JUnit testovi).
  **Backend** `deploy`: JAR (`-DskipTests`, već su prošli) → Docker image → Docker Hub → Render.
- **Frontend** `test`: `npm ci` + `npm run lint` + `npm run build`.
  **Frontend** `deploy`: Docker image (nginx) → Docker Hub → Render.

> ✅ Ako testovi padnu, `deploy` job se **ne pokreće** — na Render ne odlazi pokvarena verzija. Pull request-ovi pokreću samo `test` (bez deploy-a).

---

## 1. Docker Hub

1. Uloguj se na https://hub.docker.com.
2. **Account Settings → Personal access tokens → Generate new token** (Permissions: *Read & Write*).
3. Zapamti token — koristi se kao `DOCKER_PASSWORD` u GitHub secrets.
4. Repozitorijumi (`cardatabase-backend`, `cardatabase-frontend`) se kreiraju automatski pri prvom push-u.

---

## 2. Render — PostgreSQL baza

Bazu već imaš. Iz Render dashboarda otvori bazu → **Connections** i prepiši podatke. Render daje URL u obliku:

```
postgresql://KORISNIK:LOZINKA@HOST:5432/IME_BAZE
```

Spring očekuje **JDBC** format, razdvojen na tri varijable (vidi `application-prod.properties`):

| GitHub/Render varijabla | Vrednost |
|---|---|
| `DATABASE_URL` | `jdbc:postgresql://HOST:5432/IME_BAZE` |
| `DATABASE_USERNAME` | `KORISNIK` |
| `DATABASE_PASSWORD` | `LOZINKA` |

> Ako su backend i baza na Render-u, koristi **Internal** host (`...-internal` / interni hostname) — brže je i ne troši saobraćaj. Za lokalno povezivanje koristi **External** host.

---

## 3. Render — Backend (Web Service)

1. **New → Web Service → Deploy an existing image from a registry**.
2. Image URL: `docker.io/<docker-user>/cardatabase-backend:latest`.
3. **Environment** varijable:

   | Key | Value |
   |---|---|
   | `SPRING_PROFILES_ACTIVE` | `prod` |
   | `DATABASE_URL` | `jdbc:postgresql://HOST:5432/IME_BAZE` |
   | `DATABASE_USERNAME` | `KORISNIK` |
   | `DATABASE_PASSWORD` | `LOZINKA` |
   | `JWT_SECRET` | dugačak nasumičan string (≥ 32 bajta) |
   | `JWT_EXPIRATION_MS` | npr. `604800000` (opciono, ima default) |

   > `PORT` postavlja sam Render; aplikacija ga čita preko `server.port=${PORT:8080}`.
4. Kreiraj servis. Iz URL-a servisa prepiši **Service ID** (`srv-xxxxxxxx`) — to je `RENDER_BACKEND_SERVICE_ID`.
5. **Account Settings → API Keys → Create API Key** → to je `RENDER_API_KEY`.

---

## 4. Render — Frontend (Web Service)

1. **New → Web Service → Deploy an existing image from a registry**.
2. Image URL: `docker.io/<docker-user>/cardatabase-frontend:latest`.
3. **Environment** varijabla:

   | Key | Value |
   |---|---|
   | `PORT` | `80` |

   > nginx u kontejneru sluša na portu **80** (vidi `nginx.conf`), pa Render mora da rutira na 80.
4. Prepiši **Service ID** → `RENDER_FRONTEND_SERVICE_ID`.

### Kako frontend nalazi backend
Frontend se gradi sa `VITE_API_URL=/api`. U browseru pozivi idu na `/api/...`, a `nginx.conf` ih proksira na backend:

```nginx
location /api {
    proxy_pass https://cardatabase-backend.onrender.com;
}
```

Ako se URL backend-a promeni, ažuriraj `proxy_pass` u `frontend/nginx.conf` i push-uj (rebuild).

---

## 5. GitHub Secrets

Postavi u **svakom** repo-u: **Settings → Secrets and variables → Actions → New repository secret**.

### `carprimer-backend`
| Secret | Opis |
|---|---|
| `DOCKER_USERNAME` | Docker Hub korisničko ime |
| `DOCKER_PASSWORD` | Docker Hub access token |
| `RENDER_API_KEY` | Render API ključ |
| `RENDER_BACKEND_SERVICE_ID` | `srv-...` backend servisa |

### `carprimer-frontend`
| Secret | Opis |
|---|---|
| `DOCKER_USERNAME` | Docker Hub korisničko ime |
| `DOCKER_PASSWORD` | Docker Hub access token |
| `RENDER_API_KEY` | Render API ključ |
| `RENDER_FRONTEND_SERVICE_ID` | `srv-...` frontend servisa |

---

## 6. Redosled prvog pokretanja

1. Postavi sve GitHub secrets (sekcija 5).
2. Kreiraj Render servise (sekcije 2–4).
3. `git push` na `main` u oba repo-a.
4. Prati **Actions** tab na GitHub-u (build + push + deploy trigger).
5. Prati **Logs** na Render-u (povlačenje image-a i start aplikacije).
6. Test: otvori frontend Render URL → uloguj se → proveri da se liste učitavaju.

---

## Brza dijagnostika

| Problem | Najčešći uzrok |
|---|---|
| Backend puca na startu, `Driver claims to not accept jdbcUrl` | `DATABASE_URL` nije u `jdbc:postgresql://...` formatu |
| `401/403` pri loginu | pogrešan/nedostaje `JWT_SECRET` na Render-u |
| Frontend se učita ali API pozivi vraćaju 404/502 | `proxy_pass` u `nginx.conf` pokazuje na pogrešan backend URL |
| Render frontend „No open ports detected" | nije postavljen `PORT=80` |
| Actions: `unauthorized` pri push-u na Docker Hub | pogrešan `DOCKER_USERNAME`/`DOCKER_PASSWORD` |
| Deploy se ne okida | pogrešan `RENDER_*_SERVICE_ID` ili `RENDER_API_KEY` |
