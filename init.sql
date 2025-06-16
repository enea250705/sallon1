-- Inizializzazione database per Docker
-- Questo file viene eseguito automaticamente quando il container PostgreSQL si avvia

-- Crea le estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Il resto delle tabelle verrà creato dall'applicazione al primo avvio
-- tramite Drizzle ORM

-- Messaggio di conferma
SELECT 'Database inizializzato correttamente per Salone di Bellezza' as status; 