# 🚀 Deploy su Render.com

Guida completa per deployare l'applicazione Salone di Bellezza su Render - **PIÙ SEMPLICE** di clouding.io!

## 🎯 **Perché Render?**

✅ **Piano gratuito** con database PostgreSQL incluso  
✅ **Deploy automatico** da GitHub  
✅ **Zero configurazione Docker** necessaria  
✅ **SSL automatico** e dominio gratuito  
✅ **Logs integrati** e facili da leggere  

## 📋 **Prerequisiti**

1. **Account GitHub** con il codice pushato
2. **Account Render** (gratuito su [render.com](https://render.com))

## 🚀 **Deploy in 5 Minuti**

### **STEP 1: Pusha su GitHub**

Se non l'hai già fatto:
```bash
# Crea repository su GitHub, poi:
git remote add origin https://github.com/tuousername/salone-bellezza.git
git push -u origin main
```

### **STEP 2: Connetti Render a GitHub**

1. **Vai su [render.com](https://render.com)**
2. **Sign up/Login** con GitHub
3. **Autorizza Render** ad accedere ai tuoi repository

### **STEP 3: Crea il Database**

1. **Dashboard Render** → **"New +"** → **"PostgreSQL"**
2. **Nome**: `salone-db`
3. **Piano**: **Free** (1GB gratuito)
4. **Regione**: Scegli la più vicina
5. **Clicca "Create Database"**

⏱️ *Attendi 2-3 minuti per la creazione*

### **STEP 4: Crea il Web Service**

1. **Dashboard** → **"New +"** → **"Web Service"**
2. **Connetti Repository**: Seleziona il tuo repository GitHub
3. **Configurazione**:
   ```
   Nome: salone-bellezza
   Ambiente: Node
   Regione: Stessa del database
   Branch: main
   Build Command: npm ci && npm run build
   Start Command: npm start
   ```

### **STEP 5: Configura Variabili d'Ambiente**

Nella sezione **Environment Variables**:

```bash
NODE_ENV=production
PORT=5000
SESSION_SECRET=[Generate] # Clicca "Generate" per valore sicuro
DATABASE_URL=[Connect Database] # Seleziona salone-db dal dropdown
```

### **STEP 6: Deploy!**

1. **Clicca "Create Web Service"**
2. **Attendi il build** (5-8 minuti)
3. **Monitora i logs** in tempo reale

## 🎉 **Verifica Deploy**

### **URLs Automatici**
Render ti darà automaticamente:
- **App URL**: `https://salone-bellezza-xxx.onrender.com`
- **Health Check**: `https://salone-bellezza-xxx.onrender.com/api/health`

### **Test Login**
1. **Vai all'URL dell'app**
2. **Login**: `admin` / `admin123`
3. **Verifica funzionalità**: calendario, clienti, promemoria

## 🔧 **Setup Database Iniziale**

**IMPORTANTE**: Dopo il primo deploy, esegui la migrazione:

### **Opzione A: Render Shell**
1. **Dashboard** → **Tua App** → **"Shell"**
2. **Esegui**: `node migrate-recurring-reminders.cjs`

### **Opzione B: Endpoint API**
Visita: `https://tua-app.onrender.com/api/migrate` (se aggiungiamo endpoint)

## 📊 **Monitoraggio**

### **Logs in Tempo Reale**
- **Dashboard** → **Tua App** → **"Logs"**
- Vedi tutti gli errori e richieste

### **Metriche**
- CPU, Memoria, Richieste
- Uptime automatico
- Alert via email

## 🔄 **Auto-Deploy**

**Fantastico**: Ogni push su GitHub = deploy automatico!

```bash
# Fai modifiche al codice
git add .
git commit -m "Nuova funzionalità"
git push origin main
# 🚀 Deploy automatico inizia!
```

## 💰 **Costi**

### **Piano Gratuito** (Perfetto per iniziare)
- ✅ 750 ore/mese web service
- ✅ 1GB database PostgreSQL
- ✅ SSL automatico
- ⚠️ Sleep dopo 15min inattività

### **Piano Starter** ($7/mese)
- ✅ Sempre attivo (no sleep)
- ✅ Database più grande
- ✅ Supporto prioritario

## 🆚 **Render vs Clouding.io**

| Caratteristica | Render | Clouding.io |
|---------------|--------|-------------|
| **Setup** | 5 minuti | 30+ minuti |
| **Piano Gratuito** | ✅ Generoso | ❌ Limitato |
| **Auto-Deploy** | ✅ Da GitHub | ⚠️ Manuale |
| **Database Incluso** | ✅ PostgreSQL | ❌ Separato |
| **SSL** | ✅ Automatico | ⚠️ Configurazione |
| **Logs** | ✅ Integrati | ⚠️ Complessi |

## 🔧 **Troubleshooting**

### **Build Failed**
```bash
# Controlla package.json scripts
"scripts": {
  "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "NODE_ENV=production node dist/index.js"
}
```

### **Database Connection Error**
- Verifica che DATABASE_URL sia connesso al database
- Controlla che il database sia "Available"

### **App Sleep (Piano Gratuito)**
- Normale dopo 15min inattività
- Si risveglia automaticamente alla prima richiesta
- Upgrade a Starter per evitarlo

## 🎯 **Raccomandazione**

**SÌ, Render è MEGLIO per questo progetto!**

**Vantaggi principali**:
1. **Setup 10x più veloce**
2. **Piano gratuito utilizzabile**
3. **Auto-deploy da GitHub**
4. **Database incluso**
5. **Meno configurazione**

---

🚀 **Pronto per il deploy su Render?** È molto più semplice di clouding.io!