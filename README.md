# STAGE TIMER AI

Timer professionale, local-first, per eventi live. È una web app statica senza framework, dipendenze, build, backend obbligatorio o segreti nel client. Funziona su GitHub Pages anche in una sottocartella come:

`https://username.github.io/stage-timer-ai/`

## Funzioni principali

- viste separate **CONTROL** (`index.html`) e **STAGE** (`stage.html`);
- interfaccia completa in italiano e inglese con selettore **IT/EN** e preferenza persistente;
- countdown e count-up affidabili basati su differenze fra timestamp reali;
- Start, Pause, Resume, Stop, Reset e modifica `+1`, `+5`, `−1` minuto anche durante l'esecuzione;
- comportamento a zero configurabile: stop oppure overtime `+00:01`;
- soglie Normal, Warning, Critical e Overtime personalizzabili;
- Stage fullscreen ad alto contrasto, numeri a cifre tabulari e ridimensionamento automatico;
- preset persistenti: crea, modifica, duplica ed elimina;
- messaggi predefiniti e personalizzati da Control a Stage;
- Run of Show persistente, riordinabile e con sessione corrente/successiva;
- indicazione di anticipo/ritardo rispetto alla scaletta;
- sincronizzazione locale tra tab/finestre tramite `BroadcastChannel` con fallback `storage` event;
- ripristino automatico dopo refresh o riapertura tramite `localStorage`;
- architettura opzionale per Remote Stage e AI Pace Assistant, disattivata di default.

## Avvio rapido

Non è necessaria alcuna installazione.

### Metodo consigliato: server locale

Dalla cartella del progetto:

```bash
python3 -m http.server 8080
```

Aprire:

- Control: `http://localhost:8080/`
- Stage: `http://localhost:8080/stage.html`

È anche possibile usare qualsiasi server statico. L'apertura diretta dei file con `file://` non è consigliata perché alcuni browser limitano sincronizzazione, storage e fullscreen in quel contesto.

## Lingua IT/EN

Il selettore **IT/EN** è disponibile nella barra superiore di Control. La scelta viene salvata nel browser e sincronizzata con lo Stage. Sono localizzati etichette, pulsanti, stati, soglie, impostazioni, messaggi rapidi, indicatori AI e testi dello Stage.

La lingua è una preferenza UI separata dai contenuti: nomi di preset creati dall’utente, titoli e note della scaletta, speaker e messaggi personalizzati non vengono tradotti né modificati. I nomi degli esempi inclusi vengono localizzati solo in visualizzazione, mantenendo invariati i dati salvati. Gli stati interni (`running`, `paused`, `pending` ecc.) restano stabili e indipendenti dalla lingua.

## Uso durante un evento

1. Aprire **Control** e scegliere **IT** o **EN**.
2. Impostare ore, minuti, secondi, modalità e overtime; premere **APPLY TIME**.
3. Premere **OPEN STAGE DISPLAY** per aprire lo Stage in un'altra tab, oppure **STAGE WINDOW** per una finestra separata.
4. Spostare la finestra Stage sul monitor, TV o videowall.
5. Nello Stage premere `F` o fare doppio clic per entrare nella vera modalità fullscreen.
6. Avviare il timer da Control con **START** o con `SPACE`.

I browser consentono il fullscreen solo dopo un gesto dell'utente nella finestra da rendere fullscreen. Per questo **OPEN FULLSCREEN STAGE** apre la finestra e mostra il promemoria `PRESS F FOR FULLSCREEN`.

## Shortcut

Le shortcut non vengono eseguite mentre si scrive in input, select, textarea o campi modificabili.

| Tasto | Control | Stage |
|---|---|---|
| `SPACE` | Start / Pause / Resume | — |
| `R` | Reset | — |
| `↑` | +1 minuto | — |
| `↓` | −1 minuto | — |
| `M` | Focus sul messaggio personalizzato | — |
| `F` | Apre lo Stage con richiesta fullscreen | Entra/esce dal fullscreen |
| `ESC` | Esce dal fullscreen, se attivo | Esce dal fullscreen |
| Doppio clic | — | Entra/esce dal fullscreen |

## Timer e affidabilità

Il timer non conta le chiamate a `setInterval`. Salva invece:

- timestamp reale di avvio/ripresa;
- tempo già trascorso prima di una pausa;
- durata target;
- stato corrente.

Ogni visualizzazione deriva il tempo dalla differenza fra i timestamp. Cambio tab, lag, throttling del browser o sospensioni temporanee non accumulano drift dovuto ai tick mancati. Durante una perdita di connessione lo Stage continua a calcolare localmente il timer dall'ultimo riferimento temporale valido e si risincronizza quando riceve uno stato più recente.

Per un evento critico è comunque raccomandato:

- tenere Control e Stage nello stesso browser aggiornato;
- collegare il computer all'alimentazione;
- disabilitare sospensione automatica e risparmio energetico aggressivo;
- eseguire una prova sul monitor o videowall reale;
- evitare modifiche manuali all'orologio di sistema durante una sessione.

## Preset

La sezione **Presets** include:

- Pitch — 5 min;
- Lightning Talk — 10 min;
- Presentation — 20 min;
- Keynote — 45 min;
- Q&A — 15 min.

Con **NEW**, **EDIT**, **DUPLICATE** e **DELETE** si gestiscono nome, durata, modalità, warning, critical e overtime. **LOAD** applica il preset e riporta il timer allo stato iniziale.

## Soglie colore

Le impostazioni predefinite sono:

- **NORMAL**: oltre il 20%, bianco (o verde selezionabile);
- **WARNING**: al 20% o meno, ambra;
- **CRITICAL**: ultimi 60 secondi, rosso;
- **OVERTIME**: rosso intenso.

La soglia Critical ha priorità sulla percentuale Warning. Le soglie globali si modificano in **Settings**; ogni preset può salvarne una propria copia.

## Messaggi speaker

Control può inviare allo Stage:

`2 MIN LEFT`, `1 MIN LEFT`, `WRAP UP`, `SLOW DOWN`, `SPEED UP`, `MOVE TO CONCLUSION`, `Q&A`, `TIME`, `THANK YOU` oppure un testo personalizzato.

Il messaggio può:

- scadere dopo N secondi;
- restare visibile fino a **CLEAR**.

L'overlay è separato dal timer e non ne modifica stato o calcolo.

## Run of Show

Ogni elemento contiene:

- orario pianificato;
- titolo;
- speaker opzionale;
- durata;
- note.

È possibile aggiungere, modificare, eliminare e riordinare elementi, avviare una sessione specifica, passare a precedente/successiva o saltare quella corrente. All'avvio della prima sessione l'app fissa un riferimento reale; gli orari pianificati successivi vengono confrontati con gli avvii effettivi per mostrare `ON TIME`, `LATE` o `AHEAD`.

## Persistenza e sincronizzazione

Lo stato completo viene salvato nel browser sotto la chiave versionata `stageTimerAI.state.v1`. Include timer, impostazioni, soglie, preset, preferenze Stage, lingua, messaggi, Run of Show, configurazione Remote e configurazione AI. La chiave non è stata cambiata: l’aggiornamento preserva i dati personalizzati già presenti e aggiunge soltanto la preferenza lingua mancante. La preferenza IT/EN è inoltre salvata nella chiave dedicata `stageTimerAI.language.v1`.

La sincronizzazione Control/Stage usa solo API browser-native:

1. `BroadcastChannel`, quando disponibile;
2. evento `storage` come fallback;
3. `localStorage` come stato persistente.

La sincronizzazione locale funziona tra tab e finestre dello **stesso browser e della stessa origine**. Non sincronizza dispositivi diversi senza un servizio realtime esterno.

## Remote Stage opzionale

`js/integrations.js` include `RemoteStageAdapter`, un adapter WebSocket disattivato di default. Per collegare dispositivi diversi serve un servizio realtime esterno separato che:

- esponga un endpoint `wss://`;
- isoli i messaggi per codice sessione (es. `A7K4`);
- autentichi e autorizzi Control e Stage;
- validi dimensione, forma e frequenza dei messaggi;
- distribuisca pacchetti JSON `STATE`, `REQUEST_STATE` e `STAGE_ALIVE`;
- non modifichi il riferimento temporale del timer;
- gestisca rate limiting, scadenza sessioni e TLS.

Il frontend mostra gli stati `CONNECTED`, `RECONNECTING` e `OFFLINE`. La perdita di connessione non ferma e non resetta il timer. Eventuali token temporanei devono essere consegnati a runtime e conservati in `sessionStorage`, mai nel repository.

Un QR code può essere generato dal servizio esterno a partire da un URL Stage temporaneo contenente solo il codice sessione. Non inserire token permanenti o API key nel QR.

## AI Pace Assistant opzionale

L'MVP funziona interamente con AI disattivata. La sezione AI permette di salvare:

- speech, agenda o punti chiave;
- sezioni e durata attesa, ad esempio `INTRO | 2`;
- modalità `OFF`, `SUGGEST` o `AUTO MESSAGES`;
- endpoint esterno opzionale.

La UI mostra Current Section, Expected Section, Time Left, Pace ed Estimated Finish. In modalità Suggest la regia decide se inviare il messaggio proposto. La modalità Auto richiede una conferma esplicita e può inviare solo messaggi: non modifica mai il timer.

`SpeechTrackingAdapter` offre due punti di estensione:

- Web Speech API del browser, solo dopo autorizzazione esplicita al microfono;
- chiamata a un servizio AI/speech-to-text esterno sicuro.

API key e segreti devono restare nel servizio serverless/backend esterno. Non inserirli in JavaScript, HTML, URL GitHub Pages o `localStorage`.

## Pubblicazione su GitHub Pages

1. Creare un repository GitHub, ad esempio `stage-timer-ai`.
2. Caricare tutti i file mantenendo la struttura delle cartelle.
3. Fare commit sul branch `main`.
4. In GitHub aprire **Settings → Pages**.
5. In **Build and deployment**, scegliere **Deploy from a branch**.
6. Selezionare branch `main` e cartella `/(root)`.
7. Salvare e attendere la pubblicazione.
8. Aprire `https://username.github.io/stage-timer-ai/`.

Tutti i riferimenti a CSS, JavaScript, icone e Stage sono relativi; non sono presenti path assoluti dipendenti dal dominio. Il file `.nojekyll` evita elaborazioni non necessarie.

### Caricamento con Git

```bash
git init
git add .
git commit -m "Initial STAGE TIMER AI"
git branch -M main
git remote add origin https://github.com/USERNAME/stage-timer-ai.git
git push -u origin main
```

## Test

I test del core non richiedono dipendenze:

```bash
node tests/core.test.js
node tests/i18n.test.js
```

Coprono drift da timestamp, salto dopo sospensione, pause/resume, reset, modifica tempo in corsa, overtime, stop a zero, count-up, soglie e scostamento Run of Show.

Per la verifica live, testare inoltre:

1. refresh di Control e Stage durante un timer in esecuzione;
2. chiusura e riapertura dello Stage;
3. messaggi con scadenza e permanenti;
4. persistenza di preset e Run of Show;
5. cambio tab per alcuni minuti;
6. fullscreen e leggibilità alle risoluzioni effettive;
7. layout Control su desktop, tablet e smartphone;
8. stato offline/reconnecting senza arresto del timer.

## Struttura

```text
stage-timer-ai/
├── .nojekyll
├── LICENSE
├── README.md
├── index.html
├── stage.html
├── assets/
│   └── favicon.svg
├── css/
│   └── app.css
├── js/
│   ├── control.js
│   ├── core.js
│   ├── integrations.js
│   ├── i18n.js
│   ├── stage.js
│   ├── store.js
│   └── sync.js
└── tests/
    ├── core.test.js
    └── i18n.test.js
```

## Browser

Consigliati Chrome, Edge, Firefox o Safari aggiornati. Fullscreen, `BroadcastChannel`, WebSocket, `localStorage` e Web Speech possono avere differenze o restrizioni specifiche del browser. Il timer, lo Stage locale, i preset, i messaggi e il Run of Show non dipendono da Web Speech o da servizi esterni.

## Licenza

MIT — vedere `LICENSE`.
