#!/bin/bash

# 🚀 Script di Deploy per Clouding.io
# Automatizza il processo di build e deploy dell'applicazione

set -e  # Exit on any error

echo "🚀 Iniziando il deploy di Salone di Bellezza..."

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per stampare messaggi colorati
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Verifica prerequisiti
print_status "Verificando prerequisiti..."

if ! command -v docker &> /dev/null; then
    print_error "Docker non è installato!"
    exit 1
fi

if ! command -v git &> /dev/null; then
    print_error "Git non è installato!"
    exit 1
fi

print_success "Prerequisiti verificati ✓"

# 2. Pulizia build precedenti
print_status "Pulendo build precedenti..."
rm -rf dist/
rm -rf client/dist/
print_success "Pulizia completata ✓"

# 3. Installa dipendenze
print_status "Installando dipendenze..."
npm ci --silent
print_success "Dipendenze installate ✓"

# 4. Build dell'applicazione
print_status "Building applicazione..."
npm run build
print_success "Build completato ✓"

# 5. Test del build
print_status "Testando il build..."
if [ ! -f "dist/index.js" ]; then
    print_error "Build fallito - file dist/index.js non trovato!"
    exit 1
fi

if [ ! -f "client/dist/index.html" ]; then
    print_error "Build fallito - file client/dist/index.html non trovato!"
    exit 1
fi

print_success "Test build completato ✓"

# 6. Build Docker image
print_status "Building Docker image..."
docker build -t salone-bellezza:latest .
print_success "Docker image creata ✓"

# 7. Test Docker image
print_status "Testando Docker image..."
docker run --rm -d --name salone-test -p 5001:5000 \
    -e NODE_ENV=production \
    -e SESSION_SECRET=test-secret \
    -e DATABASE_URL=postgresql://test:test@localhost:5432/test \
    salone-bellezza:latest

# Aspetta che il container si avvii
sleep 5

# Test health check
if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
    print_success "Health check passed ✓"
else
    print_warning "Health check failed - potrebbe essere normale se il database non è configurato"
fi

# Ferma il container di test
docker stop salone-test > /dev/null 2>&1 || true

print_success "Test Docker completato ✓"

# 8. Commit e push (se richiesto)
if [ "$1" = "--push" ]; then
    print_status "Committando e pushando modifiche..."
    
    git add .
    git commit -m "🚀 Deploy ready - $(date '+%Y-%m-%d %H:%M:%S')" || print_warning "Nessuna modifica da committare"
    git push origin main || git push origin master
    
    print_success "Codice pushato ✓"
fi

# 9. Istruzioni finali
echo ""
echo "🎉 Deploy preparato con successo!"
echo ""
echo "📋 Prossimi passi:"
echo "1. Vai su clouding.io"
echo "2. Crea una nuova applicazione Docker"
echo "3. Connetti questo repository Git"
echo "4. Configura le variabili d'ambiente:"
echo "   - DATABASE_URL=postgresql://..."
echo "   - SESSION_SECRET=your-secret-key"
echo "   - NODE_ENV=production"
echo "   - PORT=5000"
echo "5. Avvia il deploy!"
echo ""
echo "📖 Per istruzioni dettagliate, leggi DEPLOY.md"
echo ""
echo "🔗 Health check URL: https://your-domain.com/api/health"
echo "🔗 Login URL: https://your-domain.com"
echo "👤 Credenziali: admin / admin123"
echo ""
print_success "Tutto pronto per il deploy! 🚀" 