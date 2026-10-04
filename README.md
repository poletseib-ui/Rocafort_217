# Rocafort 217 · Pol i Paula

Dashboard per consultar hores a casa, cost per hora, comparatives mensuals, rutines i visites. Cost inicial: 1.013 €/mes, repartit al 50%.

## Publicar la web

A **Settings → Pages**, selecciona **Deploy from a branch → main → / (root)** i desa. La web s'obrirà a:

https://poletseib-ui.github.io/Rocafort_217/

Els fitxers de la web són a l'arrel. `.nojekyll` evita el processament de Jekyll.

## Connectar els fitxatges reals

Segueix [la guia de Cloudflare](cloudflare/GUIA.md). El Worker és `cloudflare/worker.mjs`, i l'esquema D1 és `cloudflare/schema.sql`.

Després de desplegar el Worker, posa la seva URL HTTPS a `apiBase` del fitxer `config.js`. Sense aquesta connexió la web mostra una demostració amb dades fictícies.

Les claus `HOUSEHOLD_KEY` i `GUEST_KEY` es configuren com a secrets de Cloudflare. No les publiquis al repositori. La variable `ALLOWED_ORIGIN` és `https://poletseib-ui.github.io`.

## NFC

- Pol: `https://poletseib-ui.github.io/Rocafort_217/index.html?scan=pol`
- Paula: `https://poletseib-ui.github.io/Rocafort_217/index.html?scan=partner`
- Convidats: utilitza l'URL privada amb la clau de convidats descrita a la guia.

L'escaneig només obre el formulari. Cal confirmar entrada o sortida per desar el moviment.
