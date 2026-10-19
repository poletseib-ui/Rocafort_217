# Wi-Fi de casa

La web incorpora suggeriments de convidats ja registrats i un botó permanent «Wi-Fi de casa». Després de la primera entrada d'un nom nou, si el Wi-Fi està configurat, apareix una oferta amb QR, còpia de contrasenya i «Ara no vull · Veure el resum».

Un web normal no pot connectar directament el dispositiu a una xarxa Wi-Fi. En un altre dispositiu es pot escanejar el QR; en el mateix mòbil es pot copiar la contrasenya i enganxar-la als ajustos de Wi-Fi. El resultat de l'escaneig depèn del lector del dispositiu.

## Configuració a Cloudflare

Al Worker `rocafort-217-api`, a **Settings → Runtime variables and secrets → Production**:

- `WIFI_SSID`: variable de text `DIGIFIBRA-PLUS-eStz`.
- `WIFI_PASSWORD`: **Secret**, amb la contrasenya de la xarxa. Introdueix-la tu mateix al panell; no la posis a GitHub.
- `WIFI_ENABLED`: variable de text `true` quan vulguis compartir l'accés des de la web. Amb `false`, no s'ofereix el Wi-Fi després del registre i el botó permanent indica que encara no està configurat.
- `WIFI_SECURITY`: opcional; `WPA` per defecte (WPA/WPA2 personal). També admet `WEP` o `nopass` per a xarxes obertes. No és un perfil d'empresa/EAP.
- `WIFI_HIDDEN`: opcional; `true` si la xarxa és oculta.

**La web és pública. Activar `WIFI_ENABLED=true` permet a qualsevol que tingui l'enllaç consultar el nom de la xarxa, la contrasenya i el QR.** El tipus Secret de Cloudflare evita publicar la contrasenya al repositori i la xifra al panell, però no impedeix que els visitants la vegin quan actives aquesta funcionalitat.

El QR es genera al navegador amb la biblioteca de Project Nayuki, inclosa al repositori amb la seva llicència MIT. No s'envia la contrasenya a serveis de generació de QR. La resposta de `/api/wifi` no es desa a la memòria cau; la contrasenya no s'inclou a `/api/state`, en els fitxatges ni al CSV.

## Suggeriments de noms

Es mostren fins a sis coincidències de prefix dels noms de convidats que ja tenen algun registre, de qualsevol mes. La cerca ignora majúscules i accents. Tocar un suggeriment conserva l'ortografia registrada, per evitar crear variants del mateix nom. També admet fletxes, Enter i Escape. Un prefix buit o sense coincidències no mostra suggeriments.

L'oferta automàtica es basa en l'historial carregat en aquella sessió abans d'enviar la primera entrada; no depèn del mòbil ni de cookies. Amb entrades simultànies del mateix nom en dos dispositius, tots dos podrien veure l'oferta. Mai s'ofereix després d'una sortida i la fallada del Wi-Fi no desfà un moviment ja guardat.
