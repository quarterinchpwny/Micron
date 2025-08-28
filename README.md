# 🐳 Dynamic Compose Manager

A **Flask + React + shadcn** application that lets you **dynamically manage microservices with Docker Compose**.  
Add services manually, auto-detect from folders, configure infra like databases, and deploy without editing YAML by hand.

---

## ✨ Features

- 🔍 **Auto-detect services** from `./services/*` (with Dockerfile support)
- ➕ **Add services via UI** (name, port, path, host port, volumes)
- 🗄️ **Infra toggle** for databases & caches (Postgres, Redis, etc.)
- ⚙️ **Generate configs**:
  - `docker-compose.generated.yml`
  - `nginx.generated.conf`
- 🚀 **Deploy with one click** → runs `docker compose up -d`
- ▶️ **Start/Stop all containers** via dashboard

---

## 📂 Folder Structure

```bash
dynamic-compose-react/
├── backend/
│   ├── app.py                 # Flask backend
│   ├── requirements.txt
│   ├── services.json          # Persisted services config (auto-updated)
│   ├── services/              # 📂 Add your microservices here
│   │   ├── users/             # Example service
│   │   │   ├── Dockerfile
│   │   │   └── app/...
│   │   ├── orders/
│   │   │   ├── Dockerfile
│   │   │   └── app/...
│   │   └── ...
│   └── infra/                 # Optional infra configs (db seeds, etc.)
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React + shadcn components
│   │   └── pages/             # UI pages
│   └── package.json
│
├── docker/
│   ├── docker-compose.generated.yml   # Auto-generated
│   └── nginx.generated.conf           # Auto-generated
│
├── README.md
└── ...

```

## 📸 Screenshots

_(Add screenshots of your UI here: service cards, infra toggle, generate/deploy buttons)_

---

## 🚀 Quick Start

### 1. Clone repo

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Backend (Flask API)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Backend runs at → **http://localhost:8000**

### 3. Frontend (React + shadcn)

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at → **http://localhost:5173**

---

## 🖥️ Usage

1. **Auto-detect**:  
   Place service folders under `backend/services/<name>` with a `Dockerfile`.

2. **Add manually**:  
   Use the UI to define service name, ports, paths, and infra toggle.

3. **Generate configs**:  
   Creates `docker/docker-compose.generated.yml` and `docker/nginx.generated.conf`.

4. **Deploy**:  
   Run containers with one click (`docker compose up -d`).

---

## 📂 Example Generated Compose

```yaml
services:
  api_gateway:
    container_name: microns
    restart: always
    build:
      context: ./api_gateway
    ports:
      - "8001:80"
    volumes:
      - api_gateway_data:/var/www/html/storage
    profiles:
      development:
        volumes:
          - ./api_gateway:/var/www/html
    networks:
      - BKnetwork

  users_api:
    build:
      context: ./services/users
    ports:
      - "15001:5001"
    networks:
      - BKnetwork

networks:
  BKnetwork:

volumes:
  api_gateway_data:
```

---

## 🛠️ Tech Stack

- **Backend:** Python, Flask
- **Frontend:** React, Vite, shadcn/ui, Tailwind
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx (generated config)

---

## 📜 License

MIT – free to use, modify, and share.
