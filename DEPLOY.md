# 🚀 Deploy su Clouding.io

Guida completa per deployare l'applicazione Salone di Bellezza su clouding.io.

## 📋 Prerequisiti

1. **Account clouding.io** attivo
2. **Database PostgreSQL** configurato (puoi usare Neon, Supabase, o PostgreSQL su clouding.io)
3. **Git repository** con il codice

## 🔧 Preparazione

### 1. Database Setup
Prima del deploy, assicurati di avere:
- Un database PostgreSQL accessibile via internet
- La stringa di connessione `DATABASE_URL`
- Tabelle create (esegui la migrazione)

### 2. Variabili d'Ambiente
Configura queste variabili su clouding.io:

```bash
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"
NODE_ENV="production"
PORT=5000
```

## 🐳 Deploy con Docker

### Opzione 1: Deploy Automatico
1. **Connetti il repository** a clouding.io
2. **Seleziona Dockerfile** come metodo di build
3. **Configura le variabili d'ambiente**
4. **Deploy automatico**

### Opzione 2: Build Manuale
```bash
# 1. Build dell'immagine
docker build -t salone-bellezza .

# 2. Tag per il registry
docker tag salone-bellezza your-registry/salone-bellezza:latest

# 3. Push al registry
docker push your-registry/salone-bellezza:latest
```

## ⚙️ Configurazione Clouding.io

### 1. Crea una nuova applicazione
- **Nome**: Salone di Bellezza
- **Tipo**: Container/Docker
- **Porta**: 5000

### 2. Configura le variabili d'ambiente
```
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key
NODE_ENV=production
PORT=5000
```

### 3. Configura il dominio
- Aggiungi il tuo dominio personalizzato
- Configura SSL/TLS automatico

## 🗄️ Setup Database

### Migrazione Iniziale
Dopo il primo deploy, esegui la migrazione:

```bash
# Connettiti al container
docker exec -it your-container-name sh

# Esegui la migrazione
node migrate-recurring-reminders.cjs
```

### Dati Iniziali
L'applicazione creerà automaticamente:
- ✅ Utente admin (username: admin, password: admin123)
- ✅ Servizi di base (Taglio, Piega, Colore, etc.)
- ✅ Parrucchieri di esempio

## 🔍 Verifica Deploy

### Health Check
Verifica che l'app sia online:
```
GET https://your-domain.com/api/health
```

Risposta attesa:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

### Test Login
1. Vai su `https://your-domain.com`
2. Usa le credenziali: `admin` / `admin123`
3. Verifica che tutte le funzionalità funzionino

## 🔧 Troubleshooting

### Problemi Comuni

**1. Database Connection Error**
```bash
# Verifica la stringa di connessione
echo $DATABASE_URL

# Testa la connessione
psql $DATABASE_URL -c "SELECT 1;"
```

**2. Port Issues**
- Assicurati che la porta 5000 sia esposta
- Verifica la configurazione del load balancer

**3. Environment Variables**
```bash
# Verifica le variabili nel container
docker exec -it container-name env | grep DATABASE_URL
```

### Logs
```bash
# Visualizza i logs dell'applicazione
docker logs container-name -f

# Logs specifici
docker logs container-name --since 1h
```

## 🚀 Aggiornamenti

### Deploy di Nuove Versioni
1. **Push del codice** al repository
2. **Trigger automatico** del build
3. **Rolling update** senza downtime

### Backup Database
```bash
# Backup automatico
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-file.sql
```

## 📊 Monitoraggio

### Metriche da Monitorare
- ✅ Uptime dell'applicazione
- ✅ Tempo di risposta API
- ✅ Connessioni database
- ✅ Utilizzo memoria/CPU

### Alerts
Configura alert per:
- Downtime > 1 minuto
- Errori 5xx > 5%
- Database connection failures

## 🔐 Sicurezza

### Checklist Produzione
- ✅ HTTPS abilitato
- ✅ SESSION_SECRET sicuro
- ✅ Database con SSL
- ✅ Firewall configurato
- ✅ Backup automatici

### Aggiornamenti Sicurezza
```bash
# Aggiorna dipendenze
npm audit fix

# Rebuild immagine
docker build -t salone-bellezza:latest .
```

## 📞 Supporto

Per problemi di deploy:
1. Controlla i logs dell'applicazione
2. Verifica la configurazione database
3. Testa l'endpoint `/api/health`
4. Contatta il supporto clouding.io se necessario

---

🎉 **Congratulazioni!** La tua applicazione Salone di Bellezza è ora online e pronta per gestire i tuoi clienti e appuntamenti! 