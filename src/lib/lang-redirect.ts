import { LANG_STORAGE_KEY } from "./i18n";

/** Clients that must always receive the page they asked for: crawlers, link-preview fetchers, audits. */
export const BOT_USER_AGENT = /bot|crawl|spider|slurp|mediapartners|inspectiontool|bingpreview|lighthouse|headless|facebookexternalhit|embedly|whatsapp|telegram|discord|slack/i;

/**
 * Inline script for the English pages' `<head>`. It moves a first-time visitor to the matching
 * `/zh/...` or `/es/...` URL before anything is painted, and does nothing else:
 *
 * - it is client-side only, so the server always answers a URL with the language in that URL;
 * - it never runs for crawlers or automated browsers (user agent, `navigator.webdriver`), which
 *   is why search engines index every language version from its own URL;
 * - a saved choice (`mb-lang`) wins over the browser language, so picking English stays English;
 * - arriving from another page of this site is never redirected: links there are already
 *   localized, so landing on an English URL means the visitor chose English.
 *
 * Plain ES5 on purpose: it ships as text. `tests/i18n.test.ts` runs it against `preferredLang`.
 */
export const LANG_REDIRECT_SCRIPT = `(function(){try{
var nav=navigator;
if(nav.webdriver||/${BOT_USER_AGENT.source}/i.test(nav.userAgent||""))return;
var ref=document.referrer;
if(ref&&ref.indexOf(location.origin+"/")===0)return;
var lang=null,saved=null;
try{saved=localStorage.getItem(${JSON.stringify(LANG_STORAGE_KEY)})}catch(e){}
if(saved==="en"||saved==="zh"||saved==="es")lang=saved;
else{
var tags=nav.languages&&nav.languages.length?nav.languages:[nav.language||""];
for(var i=0;i<tags.length&&!lang;i++){
var primary=String(tags[i]).toLowerCase().split(/[-_]/)[0];
if(primary==="en"||primary==="zh"||primary==="es")lang=primary;
}
}
if(!lang||lang==="en")return;
var path=location.pathname;
location.replace("/"+lang+(path==="/"?"":path)+location.search+location.hash);
}catch(e){}})();`;
