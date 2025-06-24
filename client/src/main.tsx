import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize fonts and icons from CDN
const materialIconsLink = document.createElement("link");
materialIconsLink.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
materialIconsLink.rel = "stylesheet";
document.head.appendChild(materialIconsLink);

const robotoFontLink = document.createElement("link");
robotoFontLink.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Roboto+Condensed:wght@400;700&display=swap";
robotoFontLink.rel = "stylesheet";
document.head.appendChild(robotoFontLink);

// Add page title and meta description
document.title = "Gestione Salone - Sistema Appuntamenti";
const metaDesc = document.createElement("meta");
metaDesc.name = "description";
metaDesc.content = "Sistema di gestione per salone di bellezza: appuntamenti, clienti, servizi e promemoria automatici. Ottimizzato per iPad e dispositivi mobili.";
document.head.appendChild(metaDesc);

// Initialize the React application
createRoot(document.getElementById("root")!).render(<App />);
