# Cloudflare + GitHub Pages · Rocafort 217

## Estat actual: accés públic sense claus

El servei ja està desplegat a `https://rocafort-217-api.pol-etseib.workers.dev`, amb la base D1 connectada i `PUBLIC_ACCESS=true`. La web carrega les dades automàticament. Qualsevol persona pot consultar, registrar i editar moviments i configuració. Les claus antigues continuen guardades com a secrets, però no són necessàries en aquest mode.

NFC de convidats sense clau: `https://poletseib-ui.github.io/Rocafort_217/index.html?scan=guest`. Les URL de Pol i Paula mantenen `?scan=pol` i `?scan=partner`.

La resta d'aquesta guia descriu la instal·lació original amb accés privat. Per recuperar-la, configura `PUBLIC_ACCESS=false` al Worker; tornarà a demanar les claus.

La web es publica a GitHub Pages. Cloudflare executa `worker.mjs` i guarda els moviments a D1. No cal allotjar `server.mjs`, ni mantenir un ordinador encès, ni contractar un disc persistent. El codi està preparat, però encara no s'ha desplegat al teu compte.

## Opció sense terminal: des del panell de Cloudflare

1. Entra al teu compte de Cloudflare. A **Workers & Pages**, crea un Worker senzill, per exemple `rocafort-217-api`, començant amb **Hello World**. Els noms dels botons poden variar.
2. A l'editor del Worker, substitueix el codi d'exemple pel contingut complet de **`worker.mjs`** i desplega'l. Només és un fitxer; no necessita dependències.
3. A la secció de **D1**, crea una base de dades anomenada **`rocafort-217`**. A la consola SQL de la base, executa el contingut de **`schema.sql`**. Això crea les taules i la configuració inicial de Pol i Paula. És segur repetir-lo: no esborra les dades existents.
4. Al Worker, afegeix un **binding de tipus D1** amb el nom exacte **`DB`** i selecciona la base `rocafort-217`.
5. A les variables i secrets del Worker, afegeix:

   | Nom | Tipus | Valor |
   |---|---|---|
   | `ALLOWED_ORIGIN` | Variable de text | `https://poletseib-ui.github.io` |
   | `HOUSEHOLD_KEY` | Secret | Una clau aleatòria llarga per a Pol i Paula |
   | `GUEST_KEY` | Secret | Una altra clau aleatòria llarga per als convidats |

   Les dues claus han de ser diferents i tenir almenys 24 caràcters; recomano 32 o més generats amb un gestor de contrasenyes. No les escriguis al codi ni a GitHub. `ALLOWED_ORIGIN` és només l'origen: sense `/rocafort-217/` ni barra final. Si utilitzes un domini propi, posa aquell origen HTTPS.
6. Desa i desplega els canvis. Copia l'URL HTTPS del Worker, per exemple `https://rocafort-217-api.EL-TEU-SUBDOMINI.workers.dev`.
7. Al fitxer **`config.js`** de la web de GitHub Pages, posa aquesta URL:

   ```js
   window.APP_CONFIG = {
     apiBase: 'https://rocafort-217-api.EL-TEU-SUBDOMINI.workers.dev'
   };
   ```

8. Publica la versió actualitzada de `config.js` a GitHub Pages. Obre el dashboard i prem **Connectar dades reals**; introdueix `HOUSEHOLD_KEY`. Veuràs les dades reals, inicialment buides, en lloc de la demostració.

## Comprovar que funciona

- A `https://<worker>/api/health` ha d'aparèixer `{"ok":true,"service":"rocafort-217"}`. Aquest control només confirma que respon el Worker; no comprova la base ni les claus.
- Al dashboard, registra una entrada i comprova-la des d'un segon mòbil connectat amb la clau de la llar.
- Prova una visita amb l'URL de convidats i comprova que apareix al dashboard. Els convidats no poden llegir dades de la llar ni registrar moviments de residents.
- Si la base falla, la web mostra un error: no dona per desat el fitxatge. Torna a provar el mateix intent sense canviar el formulari per evitar duplicats.

## Escriure els tres NFC

Substitueix la base dels exemples per la URL completa de GitHub Pages, inclòs el nom del repositori:

```text
Pol:       https://poletseib-ui.github.io/Rocafort_217/index.html?scan=pol
Paula:     https://poletseib-ui.github.io/Rocafort_217/index.html?scan=partner
Convidats: https://poletseib-ui.github.io/Rocafort_217/index.html?scan=guest#guestKey=<GUEST_KEY>
```

Escriu cadascun com a registre **URL** a l'etiqueta corresponent. El formulari demana entrada/sortida; per als convidats també demana nom. No posis `HOUSEHOLD_KEY` a les NFC. La URL amb `GUEST_KEY` dona només permís de registrar visites; qui la tingui també podria enviar visites fictícies. Si es filtra, canvia el secret i reescriu l'etiqueta. La clau de convidats queda a la sessió de la pestanya per permetre recarregar el formulari.

## Opció amb terminal: Wrangler

Requereix Node.js i npm/npx al teu ordinador. Executa les ordres dins de la carpeta `cloudflare/`:

```powershell
npx wrangler login
npx wrangler d1 create rocafort-217
```

Posa l'identificador retornat a `database_id` de `wrangler.jsonc`, i substitueix l'exemple d'`ALLOWED_ORIGIN` pel teu origen real. Després:

```powershell
npx wrangler d1 execute rocafort-217 --remote --file=schema.sql
npx wrangler secret put HOUSEHOLD_KEY
npx wrangler secret put GUEST_KEY
npx wrangler deploy
```

Introdueix cada clau quan te la demani l'ordre, sense posar-la com a argument. Continua amb els passos 7 i 8 de la guia del panell. No cal utilitzar les dues opcions de desplegament.

## Dades i manteniment

La base D1 persisteix independentment de les noves versions del Worker. El CSV del dashboard exporta els moviments del mes seleccionat. També pots exportar tota la base amb `npx wrangler d1 export rocafort-217 --remote --output=backup.sql`; guarda aquest fitxer fora dels repositoris públics. Les dades locals de `server.mjs` no es migren automàticament a D1.

El pla gratuït té límits de consum; per l'ús domèstic previst hauria de ser suficient. Aquest Worker no incorpora un límit distribuït de peticions propi. Guarda les claus privades i revisa el consum al panell si comparteixes l'accés de convidats.

Documentació oficial: [D1](https://developers.cloudflare.com/d1/get-started/), [secrets](https://developers.cloudflare.com/workers/configuration/secrets/), [Wrangler](https://developers.cloudflare.com/workers/wrangler/configuration/).
