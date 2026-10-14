# Rocafort 217 · Pol i Paula

Dashboard per consultar hores a casa, cost per hora, comparatives mensuals, rutines i visites. Cost inicial: 1.013 €/mes, repartit al 50%.

## Publicar la web

A **Settings → Pages**, selecciona **Deploy from a branch → main → / (root)** i desa. La web s'obrirà a:

https://poletseib-ui.github.io/Rocafort_217/

Els fitxers de la web són a l'arrel. `.nojekyll` evita el processament de Jekyll.

## Connectar els fitxatges reals

Segueix [la guia de Cloudflare](cloudflare/GUIA.md). El Worker és `cloudflare/worker.mjs`, i l'esquema D1 és `cloudflare/schema.sql`.

Després de desplegar el Worker, posa la seva URL HTTPS a `apiBase` del fitxer `config.js`. Sense aquesta connexió la web mostra una demostració amb dades fictícies.

El servei està configurat amb `PUBLIC_ACCESS=true`: no cal cap clau per consultar, registrar o editar moviments i configuració. Qualsevol persona amb l'enllaç pot fer aquestes accions. La variable `ALLOWED_ORIGIN` és `https://poletseib-ui.github.io`. Per recuperar el mode privat, canvia `PUBLIC_ACCESS` a `false` i configura les dues claus com a secrets de Cloudflare.

## NFC

- Pol: `https://poletseib-ui.github.io/Rocafort_217/index.html?scan=pol`
- Paula: `https://poletseib-ui.github.io/Rocafort_217/index.html?scan=partner`
- Convidats: `https://poletseib-ui.github.io/Rocafort_217/index.html?scan=guest`

L'escaneig només obre el formulari. Cal confirmar entrada o sortida per desar el moviment.

## Visites de convidats

Si falta la sortida, la visita compta fins ara durant les primeres 4 hores; després es limita provisionalment a 4 hores i es marca com a estimada. No s'afegeix cap sortida fictícia a la base. Si es registra una sortida el mateix dia o l’endemà de l’entrada, es recalcula amb l'hora real. Si la sortida és dos dies després o més, es mantenen les 4 hores estimades i aquella sortida queda marcada com a sortida sense entrada. El límit es calcula per dies de calendari de Barcelona, no per 24 hores exactes. Si la visita travessa mitjanit i la sortida és a partir de les 06:00, es marca «S’ha quedat a dormir».

Una nova entrada separa les visites: la sortida posterior només tanca l'última. Una sortida sense entrada queda per revisar, sense inventar una estada. Les visites es compten pel dia d'arribada; les hores es reparteixen entre mesos. Els convidats no afecten el repartiment del lloguer.
