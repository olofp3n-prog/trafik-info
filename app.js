var CockpitAircraft = (function(){ var module = {exports:{}}; var exports=module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toCommonJS = (from) => {
  var entry = (__moduleCache ??= new WeakMap).get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function") {
    for (var key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(entry, key))
        __defProp(entry, key, {
          get: __accessProp.bind(from, key),
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
  }
  __moduleCache.set(from, entry);
  return entry;
};
var __moduleCache;
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};

// src/lib/cockpit-aircraft.ts
var exports_cockpit_aircraft = {};
__export(exports_cockpit_aircraft, {
  aircraftPosition: () => aircraftPosition,
  cockpitAircraftState: () => cockpitAircraftState,
  createAircraftMotion: () => createAircraftMotion,
  updateCockpitAircraft: () => updateCockpitAircraft
});
module.exports = __toCommonJS(exports_cockpit_aircraft);
function cockpitAircraftState(f) {
  const known = f.altitude != null && Number.isFinite(f.altitude);
  const height = f.onGround || !known ? 0 : Math.sqrt(Math.min(9900, Math.max(0, (f.altitude ?? 0) - 100)) / 9900);
  return { lift: height * 76, size: 30 + height * 52, tilt: height * 42, shadowSize: 30 - height * 4, shadowOpacity: known || f.onGround ? 0.6 - height * 0.15 : 0, shadowBlur: height * 1.2 };
}
var angle = (n) => ((n + 180) % 360 + 360) % 360 - 180;
function aircraftPosition(f, seconds) {
  const distance = Math.max(0, Math.min(350, Number.isFinite(f.speed) ? f.speed ?? 0 : 0)) * Math.min(5, Math.max(0, seconds));
  const lat = f.lat + distance * Math.cos(f.heading * Math.PI / 180) / 111320;
  const lon = f.lon + distance * Math.sin(f.heading * Math.PI / 180) / (111320 * Math.max(0.01, Math.cos(f.lat * Math.PI / 180)));
  return { ...f, lat: Math.max(-85, Math.min(85, lat)), lon: angle(lon) };
}
function createAircraftMotion(render) {
  let sample = null, shown = null;
  let received = 0, frame = 0, correction = { lat: 0, lon: 0, heading: 0 };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const tick = (now) => {
    frame = 0;
    if (!sample || document.hidden)
      return;
    const age = (now - received) / 1000;
    const target = aircraftPosition(sample, reduced.matches ? 0 : age);
    const blend = reduced.matches ? 0 : Math.max(0, 1 - age / 1.2);
    shown = { ...target, lat: target.lat + correction.lat * blend, lon: angle(target.lon + correction.lon * blend), heading: angle(target.heading + correction.heading * blend) };
    render(shown);
    if (!reduced.matches && age < 5)
      frame = requestAnimationFrame(tick);
  };
  const visibility = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    if (!document.hidden && sample)
      frame = requestAnimationFrame(tick);
  };
  document.addEventListener("visibilitychange", visibility);
  return {
    update(f) {
      correction = shown ? { lat: shown.lat - f.lat, lon: angle(shown.lon - f.lon), heading: angle(shown.heading - f.heading) } : { lat: 0, lon: 0, heading: 0 };
      if (Math.abs(correction.lat) > 0.1 || Math.abs(correction.lon) > 0.2)
        correction = { lat: 0, lon: 0, heading: 0 };
      sample = { ...f };
      received = performance.now();
      cancelAnimationFrame(frame);
      tick(received);
    },
    stop() {
      cancelAnimationFrame(frame);
      sample = null;
      document.removeEventListener("visibilitychange", visibility);
    }
  };
}
function updateCockpitAircraft(node, f, cockpit, silhouette) {
  const mode = cockpit ? "cockpit" : "normal";
  if (node.dataset["aircraftView"] !== mode || node.dataset["silhouette"] !== silhouette) {
    node.dataset["aircraftView"] = mode;
    node.dataset["silhouette"] = silhouette;
    node.classList.toggle("flight-cockpit", cockpit);
    node.innerHTML = cockpit ? `<span class="cockpit-shadow" aria-hidden="true"><span class="cockpit-heading">${silhouette}</span></span><span class="cockpit-plane"><span class="cockpit-heading"><span class="cockpit-perspective">${silhouette}</span></span></span><span class="flight-label"></span>` : `<span class="flight-icon">${silhouette}</span><span class="flight-label"></span>`;
  }
  node.style.setProperty("--aircraft-heading", `${f.heading}deg`);
  if (cockpit) {
    const s = cockpitAircraftState(f);
    node.style.setProperty("--aircraft-lift", `${s.lift}px`);
    node.style.setProperty("--aircraft-size", `${s.size}px`);
    node.style.setProperty("--aircraft-tilt", `${s.tilt}deg`);
    node.style.setProperty("--shadow-size", `${s.shadowSize}px`);
    node.style.setProperty("--shadow-opacity", String(s.shadowOpacity));
    node.style.setProperty("--shadow-blur", `${s.shadowBlur}px`);
  } else {
    const icon = node.querySelector(".flight-icon");
    if (icon)
      icon.style.transform = `rotate(calc(${f.heading}deg + var(--map-rot, 0deg)))`;
  }
}

return module.exports; })();

(()=>{var V=Object.defineProperty;var v=(j,q)=>{for(var z in q)V(j,z,{get:q[z],enumerable:!0,configurable:!0,set:(F)=>q[z]=()=>F})};var k={};v(k,{nearbyPoliceHelicopters:()=>N,helicopterBounds:()=>D,createHelicopterWatch:()=>y,HELICOPTER_RADIUS:()=>$,HELICOPTER_INTERVAL:()=>Z});var x=(j)=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${j}" fill="currentColor" stroke="rgba(0,0,0,.65)" stroke-width="0.8" stroke-linejoin="round"/></svg>`,C=x("M12 1.5c.9 0 1.4 1 1.4 2.2v5.2l8.1 4.7v2l-8.1-2.3v4.6l2.4 1.8v1.6L12 20.4l-3.8.9v-1.6l2.4-1.8v-4.6l-8.1 2.3v-2l8.1-4.7V3.7c0-1.2.5-2.2 1.4-2.2z"),O=x("M12 1.5c.8 0 1.2.8 1.2 1.8V8h8.3v2.4l-8.3 1v5.4l2.8.8v1.8l-4 .5-4-.5v-1.8l2.8-.8v-5.4l-8.3-1V8h8.3V3.3c0-1 .4-1.8 1.2-1.8z");var B=(j)=>j.heli&&(/^SE-?JP/i.test(j.reg??"")||/^(POL|SEPOL)/i.test(j.callsign));var Z=300000,$=20000;function D(j){let q=$/111000,z=q/Math.max(0.01,Math.cos(j.lat*Math.PI/180));return{south:Math.max(-90,j.lat-q),north:Math.min(90,j.lat+q),west:j.lon-z,east:j.lon+z}}function N(j,q){let z=Math.PI/180;return j.filter((F)=>{if(F.onGround||!B(F)||!Number.isFinite(F.lat)||!Number.isFinite(F.lon))return!1;let G=Math.sin((F.lat-q.lat)*z/2)**2+Math.cos(q.lat*z)*Math.cos(F.lat*z)*Math.sin((F.lon-q.lon)*z/2)**2;return 12742000*Math.asin(Math.sqrt(Math.min(1,G)))<=$})}function y(j){let q=j.now??Date.now,z=-1/0,F=-1/0,G=!1,Q=!1,J=new Set;return{async tick(){let K=j.position(),M=q();if(Q)return;if(!K||M-K.at>30000||M-F>Z+60000)j.result([]);if(!K||M-K.at>30000||!j.visible()||G||M-z<Z)return;G=!0,z=M;try{let U=await j.load(D(K));if(Q)return;let W=j.position();if(!W||q()-W.at>30000){j.result([]);return}let X=N(U,W);if(X.some((Y)=>!J.has(Y.id)))j.detected();J=new Set(X.map((Y)=>Y.id)),F=q(),j.result(X),j.error(null)}catch{if(!Q)j.error("Kunde inte kontrollera polishelikoptrar")}finally{G=!1}},stop(){Q=!0}}}Object.assign(globalThis,{PoliceHelicopterWatch:k});})();


(()=>{var N=Object.defineProperty;var P=(z,D)=>{for(var F in D)N(z,F,{get:D[F],enumerable:!0,configurable:!0,set:(B)=>D[F]=()=>B})};var T={};P(T,{speedQueryPosition:()=>V,routePosition:()=>M,lookaheadMeters:()=>O,guidanceDistance:()=>U});var I=Math.PI/180;function _(z,D,F,B){let J=(F-z)*I,K=(B-D)*I,X=Math.sin(J/2)**2+Math.cos(z*I)*Math.cos(F*I)*Math.sin(K/2)**2;return 12742000*Math.asin(Math.sqrt(X))}function O(z,D,F=0){let B=z.speed,J=Math.max(0,(D-z.at)/1000);if(B==null||!Number.isFinite(B)||B<2||B>80||z.heading==null||!Number.isFinite(z.heading)||J>5||(z.accuracy??0)>40)return 0;let K=Math.min(3,0.8+J+Math.max(0,Math.min(1.5,F)));return Math.min(B*K,B*3.6<40?15:60)}function M(z,D,F){let B=0,J=1/0,K=Math.PI/180,X=Math.cos(D*K);for(let G=1;G<z.coords.length;G++){let H=z.coords[G-1],Y=z.coords[G];if(!H||!Y)continue;let Z=(H[0]-F)*X,Q=H[1]-D,W=(Y[0]-H[0])*X,$=Y[1]-H[1],q=W*W+$*$,A=q?Math.max(0,Math.min(1,-(Z*W+Q*$)/q)):0,C=_(D,F,H[1]+(Y[1]-H[1])*A,H[0]+(Y[0]-H[0])*A);if(C<J)J=C,B=(z.cum[G-1]??0)+((z.cum[G]??0)-(z.cum[G-1]??0))*A}return{at:B,offRoute:J}}function U(z,D,F,B){return Math.max(0,z-(F<=40?O(D,B):0))}function S(z,D,F,B,st){if(!O(z,D))return 0;let s=z.speed,a=Math.max(0,(D-z.at)/1000),mx=st?2.5:1.5;return Math.min(s*Math.min(mx,a+Math.max(0,F)+(st?1:0)),(k=>k<=50?20.8:k<=90?37.5:k<=140?58.3:83.3)(s*3.6)*mx/1.5)}function V(z,D,F,B,J,st){let K=S(z,D,F,!!B,st),X=z.heading??0,G=Math.PI/180;if(K&&B){let H=M(B,z.lat,z.lon),Y=Math.max(H.at,Math.min(H.at+K,J?J.offset-3:B.length));for(let Z=1;H.offRoute<=40&&Z<B.coords.length;Z++){let Q=B.coords[Z-1],W=B.coords[Z],$=B.cum[Z-1]??0,q=B.cum[Z]??0;if(!Q||!W||q<Y||q<=$)continue;let A=Math.max(0,Math.min(1,(Y-$)/(q-$))),C=(Math.atan2((W[0]-Q[0])*Math.cos(z.lat*G),W[1]-Q[1])/G+360)%360;if(Math.abs((C-X+540)%360-180)>(st?20:60))break;return{lat:Q[1]+(W[1]-Q[1])*A,lon:Q[0]+(W[0]-Q[0])*A,heading:C}}return{lat:z.lat,lon:z.lon,heading:z.heading}}return{lat:z.lat+K*Math.cos(X*G)/111320,lon:z.lon+K*Math.sin(X*G)/(111320*Math.max(0.01,Math.cos(z.lat*G))),heading:z.heading}}window.DrivingLookahead=T;})();

(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, {
        get: all[name],
        enumerable: true,
        configurable: true,
        set: (newValue) => all[name] = () => newValue
      });
  };

  // src/lib/fuel-stations.ts
  var exports_fuel_stations = {};
  __export(exports_fuel_stations, {
    stationRows: () => stationRows,
    parseStations: () => parseStations,
    filterStations: () => filterStations,
    chainKey: () => chainKey,
    FUEL_CHAINS: () => FUEL_CHAINS
  });
  var FUEL_CHAINS = ["Circle K", "OKQ8", "Preem", "Ingo", "St1", "Shell", "Qstar", "Tanka", "Tesla", "Ionity", "Recharge", "InCharge", "Mer", "E.ON", "Uno-X"];
  var chainKey = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  function parseStations(elements) {
    return elements.flatMap((e) => {
      const t = e.tags ?? {}, lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
      if (lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon))
        return [];
      const charging = t["amenity"] === "charging_station";
      const powers = Object.entries(t).filter(([k]) => k.endsWith(":output") || k === "charging_station:output" || k === "maxpower").flatMap(([, v]) => v.split(";").map((p) => {
        const n = parseFloat(p.replace(",", "."));
        return /mw/i.test(p) ? n * 1000 : /kw/i.test(p) ? n : /w/i.test(p) ? n / 1000 : n;
      })).filter((n) => Number.isFinite(n) && n > 0);
      const labels = { diesel: "Diesel", octane_95: "Bensin 95", octane_98: "Bensin 98", e10: "E10", e85: "E85", hgv_diesel: "Lastbilsdiesel", lpg: "Gasol", cng: "Fordonsgas", adblue: "AdBlue", hvo: "HVO", hvo100: "HVO100" };
      const socketLabels = { type2_combo: "CCS", type2: "Type 2", chademo: "CHAdeMO", tesla_supercharger: "Tesla", tesla_supercharger_ccs: "CCS (Tesla)" };
      const company = [t["brand"], t["operator"], t["name"]].filter(Boolean).join(" ");
      const chain = FUEL_CHAINS.find((c) => chainKey(company).includes(chainKey(c))) ?? t["brand"] ?? t["operator"] ?? "";
      return [{
        id: `${e.type}/${e.id}`,
        name: t["name"] || chain || (charging ? "Laddstation" : "Drivmedelsstation"),
        lat,
        lon,
        chain,
        charging,
        power: powers.length ? Math.max(...powers) : null,
        fuels: Object.entries(labels).filter(([k]) => /^(yes|only|designated)$/.test(t[`fuel:${k}`] ?? "")).map(([, v]) => v),
        sockets: Object.entries(socketLabels).filter(([k]) => {
          const v = t[`socket:${k}`];
          return !!v && v !== "no" && v !== "0";
        }).map(([, v]) => v),
        address: [[t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" "), t["addr:city"]].filter(Boolean).join(", "),
        hours: t["opening_hours"] ?? ""
      }];
    });
  }
  function filterStations(items, type, chain) {
    return items.filter((s) => (type === "all" || (type === "fuel" ? !s.charging : s.charging && s.power != null && s.power >= 50)) && (!chain || chainKey(s.chain) === chainKey(chain)));
  }
  function stationRows(s) {
    return [
      ...s.chain ? [["Kedja", s.chain]] : [],
      ...s.address ? [["Adress", s.address]] : [],
      [s.charging ? "Effekt" : "Drivmedel", s.charging ? s.power == null ? "Ej angiven" : `${s.power} kW` : s.fuels.join(", ") || "Ej angivet"],
      ...s.sockets.length ? [["Kontakter", s.sockets.join(", ")]] : [],
      ...s.hours ? [["Öppettider", s.hours]] : []
    ];
  }

  // src/lib/loopia-station-entry.ts
  Object.assign(globalThis, { FuelStations: exports_fuel_stations });
})();

var POLICE_HELI_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor" stroke="#fff" stroke-width="0.7"><path d="M3 3l18 18M21 3L3 21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="12" cy="10" rx="3.2" ry="4.6"/><rect x="11.2" y="14" width="1.6" height="8" rx=".8"/><rect x="9" y="20.4" width="6" height="1.4" rx=".7"/><circle cx="12" cy="10" r="1.1" fill="#fff"/></g></svg>';
function isPoliceHeli(s) { return s[17] === 8 && (/^SE-?JP/i.test(s[20] || "") || /^(POL|SEPOL)/i.test(String(s[1] || "").trim())); }
var AC_MODELS = {"B38M": "Boeing 737 MAX 8", "B39M": "Boeing 737 MAX 9", "B37M": "Boeing 737 MAX 7", "B736": "Boeing 737-600", "B737": "Boeing 737-700", "B738": "Boeing 737-800", "B739": "Boeing 737-900", "B744": "Boeing 747-400", "B748": "Boeing 747-8", "B752": "Boeing 757-200", "B763": "Boeing 767-300", "B772": "Boeing 777-200", "B77W": "Boeing 777-300ER", "B77L": "Boeing 777-200LR", "B788": "Boeing 787-8 Dreamliner", "B789": "Boeing 787-9 Dreamliner", "B78X": "Boeing 787-10 Dreamliner", "A318": "Airbus A318", "A319": "Airbus A319", "A320": "Airbus A320", "A321": "Airbus A321", "A19N": "Airbus A319neo", "A20N": "Airbus A320neo", "A21N": "Airbus A321neo", "BCS1": "Airbus A220-100", "BCS3": "Airbus A220-300", "A332": "Airbus A330-200", "A333": "Airbus A330-300", "A339": "Airbus A330-900neo", "A343": "Airbus A340-300", "A359": "Airbus A350-900", "A35K": "Airbus A350-1000", "A388": "Airbus A380", "A400": "Airbus A400M Atlas", "E170": "Embraer 170", "E75L": "Embraer 175", "E190": "Embraer 190", "E195": "Embraer 195", "E290": "Embraer 190-E2", "E295": "Embraer 195-E2", "CRJ9": "Bombardier CRJ900", "CRJ7": "Bombardier CRJ700", "AT72": "ATR 72", "AT75": "ATR 72-500", "AT76": "ATR 72-600", "AT45": "ATR 42-500", "AT46": "ATR 42-600", "DH8D": "De Havilland Dash 8-400", "DH8C": "De Havilland Dash 8-300", "SF34": "Saab 340", "SB20": "Saab 2000", "JS41": "BAe Jetstream 41", "C130": "Lockheed C-130 Hercules / Tp 84 (militär)", "C30J": "Lockheed C-130J Super Hercules", "C17": "Boeing C-17 Globemaster (militär)", "PC12": "Pilatus PC-12", "PC24": "Pilatus PC-24", "C25A": "Cessna Citation CJ2", "C25B": "Cessna Citation CJ3", "C25C": "Cessna Citation CJ4", "C510": "Cessna Citation Mustang", "C56X": "Cessna Citation Excel", "C68A": "Cessna Citation Latitude", "GLF6": "Gulfstream G650", "GLEX": "Bombardier Global Express", "CL35": "Bombardier Challenger 350", "LJ45": "Learjet 45", "BE20": "Beechcraft King Air 200", "B350": "Beechcraft King Air 350", "C150": "Cessna 150", "C152": "Cessna 152", "C172": "Cessna 172 Skyhawk", "C182": "Cessna 182 Skylane", "C206": "Cessna 206 Stationair", "C208": "Cessna 208 Caravan", "PA28": "Piper PA-28 Cherokee", "P28A": "Piper PA-28 Cherokee", "PA32": "Piper PA-32 Saratoga", "PA34": "Piper PA-34 Seneca", "PA18": "Piper PA-18 Super Cub", "SR20": "Cirrus SR20", "SR22": "Cirrus SR22", "DA40": "Diamond DA40", "DA42": "Diamond DA42", "DV20": "Diamond DV20 Katana", "RV7": "Van's RV-7", "RV8": "Van's RV-8", "SK10": "Skyleader", "EV97": "Evektor EuroStar", "MT": "AutoGyro MT (gyrokopter)", "MTO": "AutoGyro MTOsport (gyrokopter)", "R22": "Robinson R22", "R44": "Robinson R44", "R66": "Robinson R66", "CABR": "Guimbal Cabri G2", "G2CA": "Guimbal Cabri G2", "B06": "Bell 206 JetRanger", "B407": "Bell 407", "B429": "Bell 429 (polishelikopter)", "B412": "Bell 412", "EC20": "Airbus EC120", "EC30": "Airbus H130", "AS50": "Airbus AS350 Écureuil", "H125": "Airbus H125", "EC35": "Airbus H135 (EC135)", "H135": "Airbus H135", "EC45": "Airbus H145 (ambulanshelikopter)", "H145": "Airbus H145 (ambulanshelikopter)", "H160": "Airbus H160", "EC55": "Airbus EC155", "EC75": "Airbus H175", "A109": "Leonardo AW109", "A119": "Leonardo AW119", "A139": "Leonardo AW139 (sjöräddning)", "A169": "Leonardo AW169", "A189": "Leonardo AW189", "EH10": "Leonardo AW101 Merlin", "S76": "Sikorsky S-76", "S92": "Sikorsky S-92", "H60": "Sikorsky UH-60 Black Hawk", "UH60": "Sikorsky UH-60 Black Hawk / Hkp 16", "NH90": "NHIndustries NH90 / Hkp 14", "H225": "Airbus H225 Super Puma", "EC25": "Airbus H225 Super Puma", "AS32": "Airbus AS332 Super Puma", "CH47": "Boeing CH-47 Chinook", "JS39": "Saab JAS 39 Gripen (militär)", "GRIF": "Saab JAS 39 Gripen (militär)", "EUFI": "Eurofighter Typhoon (militär)", "F16": "General Dynamics F-16 Fighting Falcon (militär)", "F35": "Lockheed Martin F-35 Lightning II (militär)", "F18": "Boeing F/A-18 Hornet (militär)", "FA18": "Boeing F/A-18 Hornet (militär)", "F15": "Boeing F-15 Eagle (militär)", "RFAL": "Dassault Rafale (militär)", "TOR": "Panavia Tornado (militär)", "K35R": "Boeing KC-135 Stratotanker (militär)", "A332K": "Airbus A330 MRTT tankflyg (militär)", "MRTT": "Airbus A330 MRTT tankflyg (militär)", "E3TF": "Boeing E-3 Sentry AWACS (militär)", "E3CF": "Boeing E-3 Sentry AWACS (militär)", "P8": "Boeing P-8 Poseidon (militär)", "RC135": "Boeing RC-135 spaningsflyg (militär)", "GLF4M": "Saab S 102B Korpen (militär)", "S100B": "Saab S 100D Argus (militär)", "SK60": "Saab 105 / Sk 60 (militär)", "PC21": "Pilatus PC-21 (militär)", "HAWK": "BAE Hawk (militär)", "C295": "Airbus C295 (militär)", "AH64": "Boeing AH-64 Apache (militär)", "TIGR": "Airbus Tiger (militär)", "KOAL": "Leonardo AW109 / Hkp 15 (militär)"};
(function () {
  var FILE_KEY = (window.TOMTOM_API_KEY || "").trim();
  var key = FILE_KEY || localStorage.getItem("tomtom_key") || "";
  var city = { name: "Stockholm", lat: 59.329, lon: 18.068 };
  var map = null, marker = null, weather = null, tab = "hourly";
  var $ = function (id) { return document.getElementById(id); };

  function describe(c) {
    if (c === 0) return ["☀️", "Klart"]; if (c <= 2) return ["🌤️", "Halvklart"];
    if (c === 3) return ["☁️", "Mulet"]; if (c <= 48) return ["🌫️", "Dimma"];
    if (c <= 57) return ["🌦️", "Duggregn"]; if (c <= 67) return ["🌧️", "Regn"];
    if (c <= 77) return ["🌨️", "Snö"]; if (c <= 82) return ["🌧️", "Regnskurar"];
    if (c <= 86) return ["🌨️", "Snöbyar"]; return ["⛈️", "Åska"];
  }
  function compass(d) { return ["N","NO","O","SO","S","SV","V","NV"][Math.round(d / 45) % 8]; }
  var MZ = window.MIN_ZOOM || { flights: 6, ships: 7, transit: 11, ksamsok: 13 };
  function zoomOk(k) { return map && map.getZoom() >= MZ[k]; }
  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  // Settings: hidden when key is set in config.js
  if (!FILE_KEY) {
    $("settings").hidden = false; $("key").value = key;
    var form = $("setForm"), sb = $("setBtn");
    function showForm(v) { form.hidden = !v; sb.setAttribute("aria-expanded", v); }
    showForm(!key);
    sb.onclick = function () { showForm(form.hidden); };
    form.onsubmit = function (e) {
      e.preventDefault(); key = $("key").value.trim();
      localStorage.setItem("tomtom_key", key); showForm(false); initMap();
    };
  }

  var trafficFlowOn = localStorage.getItem("traffic_flow") === "1";
  function setTrafficFlow(enabled) {
    trafficFlowOn = enabled;
    $("trafficFlow").checked = enabled;
    if (map) { if (enabled) map.showTrafficFlow(); else map.hideTrafficFlow(); }
  }
  $("trafficFlow").checked = trafficFlowOn;
  $("trafficFlow").onchange = function () {
    setTrafficFlow(this.checked);
    try { localStorage.setItem("traffic_flow", trafficFlowOn ? "1" : "0"); } catch (e) {}
  };
  var mapStyle = (localStorage.getItem("map_style") || "basic_main").replace("hybrid_main", "osm");
  function addOsm() {
    if (map.getSource("osm")) return;
    map.addSource("osm", { type: "raster", tiles: [mapStyle === "satellite" ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" : "https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 19 });
    map.addLayer({ id: "osm", type: "raster", source: "osm" });
    var m = map, busy = false;
    function lift() {
      if (busy || !m.getLayer("osm")) return;
      var ls = m.getStyle().layers, at = ls.findIndex(function (l) { return l.id === "osm"; });
      var below = ls.slice(0, at).filter(function (l) { return /traffic|incident|flow/i.test(l.id + " " + (l.source || "")); });
      if (!below.length) return;
      busy = true; below.forEach(function (l) { m.moveLayer(l.id); }); busy = false;
    }
    lift(); m.on("styledata", lift);
  }
  function initMap() {
    if (!key || !window.tt) return;
    if (map) map.remove();
    $("map").innerHTML = "";
    map = tt.map({ key: key, container: "map", center: [city.lon, city.lat], zoom: 11, style: { map: mapStyle === "osm" || mapStyle === "satellite" ? "basic_main" : mapStyle, trafficFlow: mapStyle === "basic_night" ? "2/flow_relative-dark" : "2/flow_relative-light", trafficIncidents: mapStyle === "basic_night" ? "2/incidents_dark" : "2/incidents_light" },
      stylesVisibility: { trafficFlow: trafficFlowOn, trafficIncidents: !!accShown }, maxTileCacheSize: 50, fadeDuration: 0, renderWorldCopies: false });
    ["click", "dragstart"].forEach(function (ev) { map.on(ev, function () { $("info").hidden = true; setTop(false); botOpen = false; $("weather").hidden = true; $("botBtn").setAttribute("aria-expanded", false); updatePill(); }); });
    map.addControl(new tt.NavigationControl(), "bottom-left");
    var meEl = document.createElement("div"); meEl.className = "me-marker"; marker = new tt.Marker({ element: meEl, anchor: "center" }).setLngLat([city.lon, city.lat]).addTo(map);
    var rotRaf = 0;
    map.on("rotate", function () { if (rotRaf) return; rotRaf = requestAnimationFrame(function () { rotRaf = 0; document.documentElement.style.setProperty("--map-rot", (-map.getBearing()) + "deg"); $("compass").querySelector("svg").style.transform = "rotate(" + (-map.getBearing()) + "deg)"; }); });
    $("compass").onclick = function () { map.easeTo({ bearing: 0 }); };
    map.on("load", function () { setTrafficFlow(trafficFlowOn); if (mapStyle === "osm" || mapStyle === "satellite") addOsm(); showClouds(); phDraw(phItems || []); if (flightsOn) startFlights(); if (shipsOn) startShips(); if (trOn()) startTransit(); if (heOn) loadHeritage(); showRadar(); drawRoutes(); });
    map.on("moveend", function () {
      if (flightsOn) { clearTimeout(flMove); flMove = setTimeout(loadFlights, 1500); }
      if (shipsOn) { clearTimeout(shMove); shMove = setTimeout(loadShips, 300); shCached(); }
      if (heOn) { clearTimeout(heMove); heMove = setTimeout(loadHeritage, 800); }
      if (trOn()) { clearTimeout(trMove); trMove = setTimeout(loadTransit, 1500); }
    });
  }

  function renderWeather() {
    var el = $("weather");
    if (!weather) { el.textContent = "Laddar väder…"; return; }
    var c = weather.current, d = describe(c.code);
    var rows = weather.daily.map(function (f) {
      var fd = describe(f.code);
      return '<li><b style="width:48px">' + new Date(f.date).toLocaleDateString("sv", { weekday: "short" }) +
        '</b><span style="width:64px;display:flex;align-items:center;gap:4px"><span class="ic" title="' + fd[1] + '">' + fd[0] + '</span><small class="rain" style="font-size:12px">' + (f.rain || 0) + '%</small></span><span style="width:96px;text-align:right"><b>' +
        Math.round(f.max) + '°</b> <span class="lo">' + Math.round(f.min) + '°</span></span></li>';
    }).join("");
    var ts = weather.hourly.map(function (h) { return h.temp; }), hi = Math.max.apply(null, ts), lo = Math.min.apply(null, ts), sp = Math.max(1, hi - lo);
    var hours = weather.hourly.map(function (h, i) {
      var hd = describe(h.code);
      return '<div class="h"><small>' + (i === 0 ? "Nu" : h.time.slice(11, 13)) + '</small><span class="ic" title="' + hd[1] + '">' + hd[0] +
        '</span><div class="bar1"><i style="bottom:calc(' + ((h.temp - lo) / sp * 100) + '% - 5px)"></i></div><b>' + Math.round(h.temp) +
        '°</b><small class="rain">' + ("" + h.rain + "%") + '</small></div>';
    }).join("");
    el.innerHTML = '<p class="city">' + esc(city.name) + '</p><div class="now"><span>' + Math.round(c.temp) +
      '°C</span><span role="img" aria-label="' + d[1] + '">' + d[0] + '</span></div><p class="desc">' + d[1] +
      '</p><div class="stats"><div><small>Luftfuktighet</small><b>' + c.humidity + '%</b></div><div><small>Vind</small><b>' +
      c.wind.toFixed(1) + ' m/s</b></div><div><small>Riktning</small><b><span style="display:inline-block;transform:rotate(' +
      (c.windDir + 180) + 'deg)">↑</span> ' + compass(c.windDir) + '</b></div></div>' +
      '<div class="tabs"><button data-t="hourly"' + (tab === "hourly" ? ' class="on"' : '') + '>Timme</button><button data-t="daily"' + (tab === "daily" ? ' class="on"' : '') + '>5 dygn</button></div>' +
      (tab === "daily" ? '<ul class="fc">' + rows + '</ul>' : '<div class="hr">' + hours + '</div>');
    el.querySelectorAll(".tabs button").forEach(function (b) { b.onclick = function () { tab = b.dataset.t; renderWeather(); }; });
    updatePill();
  }

  function loadWeather() {
    weather = null; renderWeather();
    fetch("https://api.open-meteo.com/v1/forecast?latitude=" + city.lat + "&longitude=" + city.lon +
      "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=temperature_2m,weather_code,precipitation_probability&forecast_days=6&timezone=auto&wind_speed_unit=ms")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        weather = {
          current: { temp: j.current.temperature_2m, code: j.current.weather_code, humidity: j.current.relative_humidity_2m,
            wind: j.current.wind_speed_10m, windDir: j.current.wind_direction_10m },
          daily: j.daily.time.slice(1, 6).map(function (d, i) {
            return { date: d, code: j.daily.weather_code[i + 1], max: j.daily.temperature_2m_max[i + 1], min: j.daily.temperature_2m_min[i + 1], rain: (j.daily.precipitation_probability_max || [])[i + 1] || 0 };
          }),
          hourly: (function () {
            var now = j.current.time.slice(0, 13), s = Math.max(0, j.hourly.time.findIndex(function (t) { return t.slice(0, 13) === now; }));
            return j.hourly.time.slice(s, s + 24).map(function (t, i) {
              return { time: t, code: j.hourly.weather_code[s + i], temp: j.hourly.temperature_2m[s + i], rain: (j.hourly.precipitation_probability || [])[s + i] || 0 };
            });
          })()
        };
        renderWeather();
      }).catch(function () { $("weather").textContent = "Kunde inte ladda väder."; });
  }

  function selectCity(c, push) {
    city = c;
    if (push) history.pushState(null, "", "?city=" + encodeURIComponent(c.name) + "&lat=" + c.lat.toFixed(3) + "&lon=" + c.lon.toFixed(3));
    if (push) stopGps();
    moveMap(11, 0);
    loadWeather();
  }

  var tilt3d = localStorage.getItem("map_3d") === "1";
  function cam3d() { var on = tilt3d && isMobile; return { pitch: on ? 50 : 0, offset: [0, on ? $("map").clientHeight / 6 : 0] }; }
  function moveMap(zoom, bearing) {
    if (map && navDest && !navOn) { marker.setLngLat([city.lon, city.lat]); return; } // choosing a route: keep overview still
    if (map && gpsOn && zoom === 15) { var cc = map.getCenter(), tinyMv = Math.hypot(cc.lat - city.lat, (cc.lng - city.lon) / 2) < 0.00003 && Math.abs(map.getBearing() - bearing) < 3; var camO = { center: [city.lon, city.lat], zoom: zoom, bearing: bearing, pitch: cam3d().pitch, offset: cam3d().offset }; if (tinyMv) map.jumpTo(camO); else { camO.duration = 400; map.easeTo(camO); } marker.setLngLat([city.lon, city.lat]); return; }
    if (map) { map.flyTo({ center: [city.lon, city.lat], zoom: zoom, bearing: bearing, pitch: cam3d().pitch, offset: cam3d().offset, speed: 1.2 }); marker.setLngLat([city.lon, city.lat]); }
  }

  function dataSec(d) { return isMobile ? gpsInt : d; }
  // Both overlays share the same compact playback button and source timestamps.
  var radarOn = false, rFrames = [], rIdx = 0, rPlay = null, rLoad = null;
  var cloudsOn = false, cLoad = null, cFrames = [], cIdx = 0, overlayRequest = 0;
  function playbackLabel() {
    var frames = cloudsOn ? cFrames : rFrames, f = frames[cloudsOn ? cIdx : rIdx];
    var b = $("radarPlay"); b.disabled = !frames.length;
    b.textContent = (rPlay ? "⏸ " : "▶ ") + (f ? new Date(f.time * 1000).toLocaleTimeString("sv", { hour: "2-digit", minute: "2-digit" }) : "…");
    b.setAttribute("aria-label", rPlay ? "Pausa historik" : cloudsOn ? "Spela upp moln senaste 2 timmarna" : "Spela upp radar senaste 2 timmarna");
  }
  function showRadar() {
    playbackLabel();
    if (!map || !map.isStyleLoaded()) return;
    if (map.getLayer("radar")) map.removeLayer("radar");
    if (map.getSource("radar")) map.removeSource("radar");
    var f = radarOn && rFrames[rIdx]; if (!f) return;
    map.addSource("radar", { type: "raster", tiles: [new URL("radar.php", location.href).href + "?f=" + f.url.split("/").pop() + "&z={z}&x={x}&y={y}"], tileSize: 256, maxzoom: 7 });
    map.addLayer({ id: "radar", type: "raster", source: "radar", paint: { "raster-opacity": 1, "raster-fade-duration": 0 } });
  }
  function loadRadar() {
    if (document.hidden || !radarOn) return; var request = overlayRequest;
    fetch("https://api.rainviewer.com/public/weather-maps.json").then(function (r) { if (!r.ok) throw Error(); return r.json(); }).then(function (j) {
      if (!radarOn || request !== overlayRequest) return;
      rFrames = ((j.radar && j.radar.past) || []).map(function (p) { return { time: p.time, url: j.host + p.path }; });
      if (!rPlay) rIdx = rFrames.length - 1; showRadar();
    }).catch(function () { if (radarOn) $("radarPlay").textContent = "Ej tillgänglig"; });
  }
  function stopPlay() { if (rPlay) clearInterval(rPlay); rPlay = null; }
  function loadClouds() {
    if (document.hidden || !cloudsOn) return; var request = overlayRequest;
    fetch("clouds.php?frames=1").then(function (r) { if (!r.ok) throw Error(); return r.json(); }).then(function (j) {
      if (!cloudsOn || request !== overlayRequest) return;
      cFrames = j.frames || []; if (!rPlay) cIdx = cFrames.length - 1; showClouds();
    }).catch(function () { if (cloudsOn) $("radarPlay").textContent = "Ej tillgänglig"; });
  }
  function showClouds() {
    playbackLabel();
    if (!map || !map.isStyleLoaded()) return;
    if (map.getLayer("clouds")) map.removeLayer("clouds");
    if (map.getSource("clouds")) map.removeSource("clouds");
    var f = cloudsOn && cFrames[cIdx]; if (!f) return;
    map.addSource("clouds", { type: "raster", tiles: [new URL("clouds.php", location.href).href + "?t=" + f.time + "&z={z}&x={x}&y={y}"], tileSize: 256, maxzoom: 7 });
    map.addLayer({ id: "clouds", type: "raster", source: "clouds", paint: { "raster-opacity": 1, "raster-fade-duration": 0 } });
  }
  function radarLabel() {
    var b = $("radarBtn"), on = radarOn || cloudsOn;
    b.textContent = cloudsOn ? "☁️ Moln" : "🌧️ Regnradar"; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on);
    b.setAttribute("aria-label", radarOn ? "Regnradar på, tryck för moln" : cloudsOn ? "Moln på, tryck för att stänga av" : "Regnradar");
    $("radarPlay").hidden = !on; $("radarAttr").hidden = !on; playbackLabel();
    $("radarAttr").innerHTML = cloudsOn ? "Moln: © EUMETSAT" : 'Radar: <a href="https://www.rainviewer.com" rel="noopener noreferrer" target="_blank">RainViewer</a>';
  }
  $("radarBtn").onclick = function () {
    overlayRequest++; stopPlay(); clearInterval(rLoad); clearInterval(cLoad);
    if (radarOn) { radarOn = false; cloudsOn = true; cFrames = []; loadClouds(); cLoad = setInterval(loadClouds, 300000); }
    else if (cloudsOn) cloudsOn = false;
    else { radarOn = true; if (map) map.easeTo({ zoom: 7, duration: 800 }); loadRadar(); rLoad = setInterval(loadRadar, 300000); }
    radarLabel(); showRadar(); showClouds();
  };
  $("radarPlay").onclick = function () {
    if (rPlay) stopPlay(); else rPlay = setInterval(function () {
      if (document.hidden) return;
      if (cloudsOn && cFrames.length) { cIdx = (cIdx + 1) % cFrames.length; showClouds(); }
      else if (radarOn && rFrames.length) { rIdx = (rIdx + 1) % rFrames.length; showRadar(); }
    }, cloudsOn ? 1200 : 700);
    playbackLabel();
  };
  $("mapStyle").value = mapStyle; $("osmAttr").hidden = mapStyle !== "osm" && mapStyle !== "satellite"; $("osmAttr").innerHTML = mapStyle === "satellite" ? "Bilder © Esri, Maxar, Earthstar Geographics" : '© <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer" target="_blank">OpenStreetMap-bidragsgivare</a>';
  $("mapStyle").onchange = function () { mapStyle = this.value; localStorage.setItem("map_style", mapStyle); $("osmAttr").hidden = mapStyle !== "osm" && mapStyle !== "satellite"; $("osmAttr").innerHTML = mapStyle === "satellite" ? "Bilder © Esri, Maxar, Earthstar Geographics" : '© <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer" target="_blank">OpenStreetMap-bidragsgivare</a>'; initMap(); };
  // GPS (mobile only)
  var isMobile = matchMedia("(max-width: 767px), (pointer: coarse)").matches;
  var gpsTimer = null, lastFix = null, wKey = "", slLatency = 0.5, slRequest = 0;
  var gpsInt = Number(localStorage.getItem("gps_interval")) || 30;
  var follow = localStorage.getItem("gps_follow") !== "0";
  var gpsAuto = localStorage.getItem("gps_auto") !== "0", gpsOn = false;
  function gpsUi() {
    $("useGps").classList.toggle("on", gpsOn);
    $("gpsTitle").textContent = gpsOn ? "Min position" : "Visa min position";
    $("gpsStatus").textContent = !gpsOn ? "Av – kartan visar vald stad" : !lastFix ? "Söker din position…" : gpsAuto ? "På – uppdateras varje sekund" : "På – uppdateras bara när du trycker";
    var noRadar = isMobile && gpsOn && gpsAuto;
    if (noRadar && (radarOn || cloudsOn)) { radarOn = false; cloudsOn = false; clearInterval(rLoad); clearInterval(cLoad); stopPlay(); radarLabel(); showRadar(); showClouds(); }
    $("radarBtn").hidden = noRadar; $("radarRow").hidden = noRadar;
    if (noRadar && typeof lSet === "function" && lOn) lSet(false);
    $("lightBtn").parentNode.hidden = noRadar;
    accTick();
    $("gpsAct").textContent = gpsOn ? (gpsAuto ? "⟳" : "Uppdatera") : "";
  }
  function brg(a, b) {
    var r = Math.PI / 180, y = Math.sin((b.lon - a.lon) * r) * Math.cos(b.lat * r);
    var x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lon - a.lon) * r);
    return (Math.atan2(y, x) / r + 360) % 360;
  }
  function readGps(watch) {
    var fn = function (p) {
      var f = { lat: p.coords.latitude, lon: p.coords.longitude, heading: p.coords.heading, speed: p.coords.speed, accuracy: p.coords.accuracy, at: p.timestamp || Date.now() };
      if ((f.speed == null || isNaN(f.speed)) && lastFix && f.at > lastFix.at) { var R = Math.PI / 180, dLa = (f.lat - lastFix.lat) * R, dLo = (f.lon - lastFix.lon) * R, A = Math.pow(Math.sin(dLa / 2), 2) + Math.cos(lastFix.lat * R) * Math.cos(f.lat * R) * Math.pow(Math.sin(dLo / 2), 2); f.speed = 6371000 * 2 * Math.asin(Math.sqrt(A)) / ((f.at - lastFix.at) / 1000); }
      if ((f.heading == null || isNaN(f.heading)) && lastFix)
        f.heading = Math.hypot(f.lat - lastFix.lat, f.lon - lastFix.lon) > 0.0001 ? brg(lastFix, f) : lastFix.heading;
      if (!gpsOn) return;
      if (lastFix && f.at === lastFix.at) return;
      lastFix = f; if (phController) phController.tick(); $("gpsErr").textContent = ""; gpsUi(); showSpeed(f.speed);
      city = { name: "Min position", lat: f.lat, lon: f.lon };
      moveMap(15, follow ? (f.heading || 0) : 0);
      navTick();
      var k = f.lat.toFixed(2) + "," + f.lon.toFixed(2);
      if (k !== wKey) { wKey = k; loadWeather(); }
    }, er = function (e) { $("gpsErr").textContent = "GPS: " + e.message; }, o = { enableHighAccuracy: true, maximumAge: watch ? 1000 : 0, timeout: 15000 };
    if (watch) return navigator.geolocation.watchPosition(fn, er, o);
    navigator.geolocation.getCurrentPosition(fn, er, o);
  }
  var gpsWatch = null;
  function gpsAutoStart() { if (gpsWatch == null && gpsOn && (gpsAuto || navOn) && !document.hidden) gpsWatch = readGps(true); }
  function gpsAutoStop() { if (gpsWatch != null) { navigator.geolocation.clearWatch(gpsWatch); gpsWatch = null; } }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { gpsAutoStop(); return; }
    gpsAutoStart();
    if (typeof flightsOn !== "undefined" && flightsOn) loadFlights();
    if (typeof shipsOn !== "undefined" && shipsOn) loadShips();
    try { if (trOn()) loadTransit(); } catch (e) {}
    try { if (radarOn) loadRadar(); if (cloudsOn) loadClouds(); } catch (e) {}
    try { if (lOn) lRender(); if (accShown) accLoad(); } catch (e) {}
  });
  var sLimit = null, sLast = null, sPopTimer = null;
  function updateSpeedLimit(value) {
    if (value == null || value === sLimit) return;
    var changed = sLimit != null;
    sLimit = value;
    $("speedLimit").textContent = value;
    var k = lastFix && lastFix.speed != null ? Math.round(lastFix.speed * 3.6) : null;
    $("speedLimit").classList.toggle("speeding", k != null && k > value);
    $("speedLimit").classList.toggle("severe", k != null && value > 0 && ((value <= 30 && k - value > 20) || (value >= 40 && k - value > 30)));
    if (changed) {
      if (sPopTimer != null) clearTimeout(sPopTimer);
      $("speedLimit").classList.add("raised");
      sPopTimer = setTimeout(function () { $("speedLimit").classList.remove("raised"); sPopTimer = null; }, 3000);
    }
  }
  function showSpeed(v) {
    var k = v == null || isNaN(v) ? null : Math.min(999, Math.max(0, Math.round(v * 3.6)));
    var big = (k || 0) >= 20, over = big && sLimit != null && k > sLimit;
    $("speedLimit").classList.toggle("severe", k != null && sLimit != null && sLimit > 0 && ((sLimit <= 30 && k - sLimit > 20) || (sLimit >= 40 && k - sLimit > 30)));
    $("speedo").classList.toggle("big", big); $("speedo").classList.toggle("over", over); $("speedLimit").classList.toggle("speeding", over);
    $("speedLimit").hidden = !big; $("speedLimit").textContent = sLimit == null ? "?" : sLimit;
    $("speedArc").setAttribute("stroke", over ? "oklch(.65 .22 25)" : "var(--primary)");
    if (big && lastFix) {
      var now = Date.now();
      if (!sLast || now - sLast.at >= 2000) {
        sLast = { at: now, lat: lastFix.lat, lon: lastFix.lon };
        var hd = lastFix.heading != null && !isNaN(lastFix.heading) ? ((lastFix.heading % 360) + 360) % 360 : "";
        var rt = navOn && navRoutes ? navRoutes[navIdx] : null, nextTurn = null;
        if (rt) { var pos = DrivingLookahead.routePosition(rt, lastFix.lat, lastFix.lon); nextTurn = rt.steps.find(function (s) { return s.offset > pos.at + 8 && !/^(STRAIGHT|FOLLOW|DEPART|SWITCH_MAIN_ROAD|SWITCH_PARALLEL_ROAD|WAYPOINT_REACHED)$/.test(s.maneuver); }); }
        var straight = hd !== "" && window._slHd != null && Math.abs(((hd - window._slHd + 540) % 360) - 180) <= 8; window._slHd = hd === "" ? null : hd;
        var qp = DrivingLookahead.speedQueryPosition(lastFix, now, slLatency, rt, nextTurn, straight);
        var qLat = qp.lat, qLon = qp.lon; hd = qp.heading == null ? "" : qp.heading;
        var request = ++slRequest, requestedFixAt = lastFix.at;
        fetch("speedlimit.php?lat=" + qLat + "&lon=" + qLon + "&h=" + hd + "&prev=" + (sLimit == null ? "" : sLimit) + "&se=" + (seActive() ? 1 : 0)).then(function (r) { return r.json(); }).then(function (j) {
          if (request !== slRequest || Date.now() - requestedFixAt > 5000) return;
          slLatency = Math.min(1.5, 0.7 * slLatency + 0.3 * ((Date.now() - now) / 1000));
          if (j.limit == null || j.limit === sLimit) return;
          updateSpeedLimit(j.limit);
        }).catch(function () {});
      }
    }
    $("speedVal").textContent = k == null ? "–" : k;
    $("speedArc").setAttribute("stroke-dasharray", (122.5 * Math.min(1, (k || 0) / 200)) + " 163.4");
    $("speedo").setAttribute("aria-label", k == null ? "Hastighet okänd" : "Hastighet " + k + " km/h");
  }
  function startGps() {
    if (!("geolocation" in navigator)) { $("gpsErr").textContent = "GPS stöds inte i denna webbläsare"; return; }
    stopGps(); gpsOn = true; $("speedo").hidden = !isMobile; readGps(); gpsAutoStart(); gpsUi();
  }
  function stopGps() { gpsAutoStop(); if (gpsTimer) { clearInterval(gpsTimer); gpsTimer = null; } wKey = ""; gpsOn = false; $("speedo").hidden = true; gpsUi(); }
  if (isMobile) {
    $("gps").hidden = false; $("gpsInt").value = gpsInt; $("gpsFollow").checked = follow;
    if ($("searchRegion")) { $("searchRegion").value = localStorage.getItem("search_region") || "se"; $("searchRegion").onchange = function () { localStorage.setItem("search_region", this.value); }; }
    $("gpsInt").onchange = function () { gpsInt = Math.max(5, Number(this.value) || 30); this.value = gpsInt; localStorage.setItem("gps_interval", gpsInt); if (flightsOn) startFlights(); if (shipsOn) startShips(); if (trOn()) startTransit(); };
    $("gpsAuto").checked = gpsAuto;
    $("gpsAuto").onchange = function () { gpsAuto = this.checked; localStorage.setItem("gps_auto", gpsAuto ? "1" : "0"); if (gpsOn) startGps(); else gpsUi(); };
    $("gps3d").checked = tilt3d;
    $("gps3d").onchange = function () { tilt3d = this.checked; localStorage.setItem("map_3d", tilt3d ? "1" : "0"); if (lastFix && gpsOn) moveMap(15, follow ? (lastFix.heading || 0) : 0); else moveMap(map ? map.getZoom() : 11, map ? map.getBearing() : 0); };
    $("gpsFollow").onchange = function () { follow = this.checked; localStorage.setItem("gps_follow", follow ? "1" : "0"); if (lastFix && gpsOn) moveMap(15, follow ? (lastFix.heading || 0) : 0); };
    var driveIds = ["gpsAuto", "gpsFollow", "gps3d"];
    function driveSync() { $("driveMode").setAttribute("aria-pressed", driveIds.every(function (id) { return $(id).checked; }) ? "true" : "false"); }
    driveIds.forEach(function (id) { $(id).addEventListener("change", driveSync); });
    $("driveMode").onclick = function () { var on = !driveIds.every(function (id) { return $(id).checked; }); driveIds.forEach(function (id) { var el = $(id); if (el.checked !== on) { el.checked = on; el.dispatchEvent(new Event("change")); } }); driveSync(); };
    driveSync();
    gpsUi();
    $("useGps").onclick = function () { history.pushState(null, "", location.pathname); setTop(false); startGps(); };
  }

  // Flights (OpenSky, anonymous, limited daily quota)
  function planeSvg(d) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '" fill="currentColor" stroke="rgba(0,0,0,.65)" stroke-width="0.8" stroke-linejoin="round"/></svg>'; }
  var JET_SVG = planeSvg("M12 1.5c.9 0 1.4 1 1.4 2.2v5.2l8.1 4.7v2l-8.1-2.3v4.6l2.4 1.8v1.6L12 20.4l-3.8.9v-1.6l2.4-1.8v-4.6l-8.1 2.3v-2l8.1-4.7V3.7c0-1.2.5-2.2 1.4-2.2z"), PROP_SVG = planeSvg("M12 1.5c.8 0 1.2.8 1.2 1.8V8h8.3v2.4l-8.3 1v5.4l2.8.8v1.8l-4 .5-4-.5v-1.8l2.8-.8v-5.4l-8.3-1V8h8.3V3.3c0-1 .4-1.8 1.2-1.8z");
  var flightsOn = localStorage.getItem("flights") === "1", flTimer = null, flMove = null, flMarkers = {};
  function loadFlights() { if (document.hidden) return;
    if (!zoomOk("flights")) { Object.keys(flMarkers).forEach(function (id) { flMarkers[id].remove(); }); flMarkers = {}; $("flErr").textContent = ""; return; }
    if (!map || !flightsOn) return;
    var b = map.getBounds();
    if (!Object.keys(flMarkers).length) { try { var fc = JSON.parse(localStorage.getItem("flight_cache79") || "null"); if (fc && Date.now() - fc.t < 120000) flDraw(fc); } catch (e) {} }
    fetch("flights.php?s=" + b.getSouth().toFixed(3) + "&w=" + b.getWest().toFixed(3) + "&n=" + b.getNorth().toFixed(3) + "&e=" + b.getEast().toFixed(3))
      .then(function (r) { if (!r.ok) throw new Error("Flygdata-fel " + r.status); return r.json(); })
      .then(function (j) { if (j.error) throw new Error(j.error); return j; })
      .then(function (j) { try { localStorage.setItem("flight_cache79", JSON.stringify({ t: Date.now(), states: (j.states || []).slice(0, 300) })); } catch (e) {} return j; })
      .then(flDraw).catch(function (e) { $("flErr").textContent = e.message || "Kunde inte ladda flyg"; });
  }
  function flDraw(j) {
        if (!flightsOn) return;
        $("flErr").textContent = "";
        var seen = {};
        (j.states || []).filter(function (s) { return s[5] != null && s[6] != null && s[0] !== trackHex && !(phItems || []).some(function (f) { return f.id === s[0]; }); }).slice(0, 300).forEach(function (s) {
          var id = s[0], cs = (s[1] || id).trim(), alt = s[13] != null ? s[13] : s[7];
          seen[id] = 1;
          var mk = flMarkers[id];
          if (!mk) {
            var n = document.createElement("div"); n.className = "flight-marker";
            n.innerHTML = '<span class="flight-icon">✈</span><span class="flight-label"></span>';
            mk = flMarkers[id] = new tt.Marker({ element: n, anchor: "center" }).setLngLat([s[5], s[6]]).addTo(map);
          }
          mk.setLngLat([s[5], s[6]]);
          var el = mk.getElement();
          var fic = el.querySelector(".flight-icon");
          var pol = isPoliceHeli(s);
          if (pol) { if (fic.dataset.g !== "ph") { fic.innerHTML = POLICE_HELI_SVG; fic.dataset.g = "ph"; } fic.style.transform = "rotate(calc(" + (s[10] || 0) + "deg + var(--map-rot, 0deg)))"; }
          else if (s[17] === 8) { if (fic.dataset.g !== "h") { fic.textContent = "🚁"; fic.dataset.g = "h"; } fic.style.transform = ""; }
          else { var g = (s[19] || 2) >= 3 ? "p" : "j"; if (fic.dataset.g !== g) { fic.innerHTML = g === "p" ? PROP_SVG : JET_SVG; fic.dataset.g = g; } fic.style.transform = "rotate(calc(" + (s[10] || 0) + "deg + var(--map-rot, 0deg)))"; }
          el.querySelector(".flight-label").textContent = cs;
          el.onclick = (function (cs, s) { return function (ev) { ev.stopPropagation(); showFlight(cs, s); }; })(cs, s);
          el.title = cs + " · " + (alt != null ? Math.round(alt) + " m" : "?") + " · " + (s[9] != null ? Math.round(s[9] * 3.6) + " km/h" : "?");
          el.classList.toggle("flight-ground", !!s[8]); el.classList.toggle("flight-mil", s[21] === 1); el.classList.toggle("flight-police", pol);
          el.dataset.size = String(s[19] || 2); if (s[17] === 8) el.dataset.heli = "1"; else delete el.dataset.heli;
        });
        Object.keys(flMarkers).forEach(function (id) { if (!seen[id]) { flMarkers[id].remove(); delete flMarkers[id]; } });
  }
  function startFlights() { stopFlights(); loadFlights(); flTimer = setInterval(loadFlights, dataSec(30) * 1000); }
  function stopFlights() { clearInterval(flTimer); flTimer = null; Object.keys(flMarkers).forEach(function (id) { flMarkers[id].remove(); }); flMarkers = {}; }
  // Global aircraft search and follow mode (north up, nose up when "Följ körriktning" is on)
  var trackHex = null, trackTimer = null, trackMk = null, trackFirst = true, trackMotion = null;
  function trackDraw(s) {
    if (!map || !s) return;
    if (!trackMk) {
      var n = document.createElement("div"); n.className = "flight-marker flight-tracked"; n.dataset.size = "1";
      n.innerHTML = '<span class="flight-icon"></span><span class="flight-label"></span>';
      n.onclick = function (e) { e.stopPropagation(); if (trackMk && trackMk._s) showFlight(trackMk._s[1], trackMk._s); };
      trackMk = new tt.Marker({ element: n, anchor: "center" }).setLngLat([s[5], s[6]]).addTo(map);
      trackMotion = CockpitAircraft.createAircraftMotion(function (position) {
        if (!map || !trackMk || !trackMk._s) return;
        var reading = trackMk._s;
        trackMk.setLngLat([position.lon, position.lat]);
        CockpitAircraft.updateCockpitAircraft(trackMk.getElement(), { altitude: reading[13] != null ? reading[13] : reading[7], onGround: !!reading[8], heading: position.heading }, cockpit, reading[17] === 8 ? POLICE_HELI_SVG : (reading[19] || 2) >= 3 ? PROP_SVG : JET_SVG);
        if (!map.isMoving()) map.jumpTo({ center: [position.lon, position.lat], bearing: (follow || cockpit) ? position.heading : 0 });
      });
    }
    trackMk._s = s;
    var el = trackMk.getElement();
    CockpitAircraft.updateCockpitAircraft(el, { altitude: s[13] != null ? s[13] : s[7], onGround: !!s[8], heading: s[10] || 0 }, cockpit, s[17] === 8 ? POLICE_HELI_SVG : (s[19] || 2) >= 3 ? PROP_SVG : JET_SVG);
    el.querySelector(".flight-label").textContent = s[1];
    trackMotion.update({ lat: s[6], lon: s[5], heading: s[10] || 0, speed: s[9], onGround: !!s[8] });
    var ta = s[13] != null ? s[13] : s[7];
    $("tbName").innerHTML = "Följer <b>" + esc(s[1] || s[0]) + "</b>";
    $("tbStats").textContent = (ta != null ? Math.round(ta).toLocaleString("sv-SE") + " m" : "") + (ta != null && s[9] != null ? " · " : "") + (s[9] != null ? Math.round(s[9] * 3.6) + " km/h" : "");
    $("trackBadge").hidden = false;
    var cam = { center: [s[5], s[6]], bearing: (follow || cockpit) ? (s[10] || 0) : 0, pitch: cockpit ? 72 : 0 }; if (cockpit) cam.zoom = Math.max(map.getZoom(), 13);
    if (trackFirst) { trackFirst = false; cam.zoom = Math.max(map.getZoom(), 9); map.flyTo(cam); } else if (el.dataset.cameraMode !== String(cockpit)) { delete cam.center; cam.duration = 600; map.easeTo(cam); }
    el.dataset.cameraMode = String(cockpit);
  }
  var cockpit = false;
  function cockpitSet(on) { cockpit = on; var b = $("tbCockpit"); if (b) { b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); } if (!on && map) map.easeTo({ pitch: 0, duration: 600 }); else if (on && map) map.easeTo({ pitch: 72, duration: 600 }); if (trackMk && trackMk._s) trackDraw(trackMk._s); }
  function trackStop() {
    var relF = trackHex && trackMk && trackMk._s;
    trackHex = null; clearInterval(trackTimer); trackTimer = null;
    if (trackMotion) { trackMotion.stop(); trackMotion = null; }
    if (trackMk) { trackMk.remove(); trackMk = null; }
    $("fsTracked").hidden = true; $("fsBox").hidden = false; $("trackBadge").hidden = true; cockpitSet(false);
    shTrackStop(); trTrackStop();
    phDraw(phItems || []);
    if (relF && flightsOn && map) { var st = []; try { var fc = JSON.parse(localStorage.getItem("flight_cache79") || "null"); if (fc && Date.now() - fc.t < 120000) st = fc.states || []; } catch (e) {} st = st.filter(function (x) { return x[0] !== relF[0]; }); st.push(relF); flDraw({ states: st }); loadFlights(); }
  }
  function trackStart(s) {
    trackStop(); trackHex = s[0]; trackFirst = true;
    phDraw(phItems || []);
    if (flMarkers[s[0]]) { flMarkers[s[0]].remove(); delete flMarkers[s[0]]; }
    if (!$("flights").checked) { $("flights").checked = true; $("flights").onchange(); }
    $("fsName").textContent = s[1] + (s[20] ? " · " + s[20] : "");
    $("fsTracked").hidden = false; $("fsBox").hidden = true; $("fsList").innerHTML = ""; $("fsQ").value = "";
    trackDraw(s);
    trackTimer = setInterval(function () {
      fetch("flightsearch.php?hex=1&q=" + encodeURIComponent(trackHex)).then(function (r) { return r.json(); })
        .then(function (j) { if (trackHex && j.states && j.states[0]) trackDraw(j.states[0]); }).catch(function () {});
    }, 5000);
  }
  var fsT = null;
  $("fsQ").oninput = function () {
    var q = this.value.trim(); clearTimeout(fsT);
    if (q.length < 3) { $("fsList").innerHTML = ""; return; }
    fsT = setTimeout(function () {
      $("fsList").innerHTML = '<li class="fs-empty">Söker…</li>';
      fetch("flightsearch.php?q=" + encodeURIComponent(q)).then(function (r) { return r.json(); }).then(function (j) {
        var ul = $("fsList"); ul.innerHTML = "";
        if (!j.states || !j.states.length) { ul.innerHTML = '<li class="fs-empty">Inget flygplan i luften hittades</li>'; return; }
        j.states.forEach(function (s) {
          var li = document.createElement("li"), b = document.createElement("button"); b.type = "button";
          b.innerHTML = "<b></b><small></small>";
          b.querySelector("b").textContent = s[1];
          b.querySelector("small").textContent = [s[20], s[18], s[13] != null ? Math.round(s[13]) + " m" : null].filter(Boolean).join(" · ");
          b.onclick = function () { trackStart(s); };
          li.appendChild(b); ul.appendChild(li);
        });
      }).catch(function () { $("fsList").innerHTML = '<li class="fs-empty">Sökningen misslyckades</li>'; });
    }, 450);
  };
  $("fsStop").onclick = trackStop;
  $("tbCockpit").onclick = function () { if (cockpit) trackStop(); else cockpitSet(true); };
  $("tbStop").onclick = trackStop;
  $("flights").checked = flightsOn;
  $("flights").onchange = function () {
    flightsOn = this.checked; localStorage.setItem("flights", flightsOn ? "1" : "0"); $("flErr").textContent = "";
    if (flightsOn) startFlights(); else stopFlights();
  };


  // Webcams (Trafikverket + Windy via webcams.php)
  var webcamsOn = localStorage.getItem("webcams") === "1", wcMarkers = {}, wcSeq = 0;
  function clearWebcams() { Object.keys(wcMarkers).forEach(function (id) { wcMarkers[id].remove(); }); wcMarkers = {}; }
  function loadWebcams() {
    if (!webcamsOn || !map) return;
    var id = ++wcSeq;
    if (map.getZoom() < 9) { clearWebcams(); return; }
    var c = map.getCenter(), b = map.getBounds();
    var km = Math.min(250, Math.max(2, (b.getNorth() - b.getSouth()) * 111 * 0.75));
    fetch("webcams.php?lat=" + c.lat.toFixed(4) + "&lon=" + c.lng.toFixed(4) + "&km=" + km.toFixed(1))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        if (id !== wcSeq || !webcamsOn) return;
        $("wcErr").textContent = "";
        var seen = {};
        (j.items || []).forEach(function (w) {
          seen[w.id] = 1;
          if (wcMarkers[w.id]) return;
          var el = document.createElement("div");
          el.className = "webcam-marker"; el.textContent = "📹"; el.title = w.name;
          el.onclick = function (ev) {
            ev.stopPropagation();
            var img = w.image ? '<a class="wc-photo" href="' + esc(w.link || w.image) + '" target="_blank" rel="noopener noreferrer"><img src="' + esc(w.image) + '" alt="' + esc(w.name) + '" onerror="this.parentNode.hidden=true" /><span>© ' + esc(w.source === "Windy" ? "Windy.com" : "Trafikverket") + '</span></a>' : "";
            showInfo("📹", w.name, w.source, [["Källa", w.source], ["Uppdaterad", w.time ? new Date(w.time).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" }) : "–"]], false, img);
          };
          wcMarkers[w.id] = new tt.Marker({ element: el, anchor: "center" }).setLngLat([w.lon, w.lat]).addTo(map);
        });
        Object.keys(wcMarkers).forEach(function (k) { if (!seen[k]) { wcMarkers[k].remove(); delete wcMarkers[k]; } });
      })
      .catch(function () { if (id === wcSeq) $("wcErr").textContent = "Kunde inte ladda webbkameror"; });
  }
  $("webcams").checked = webcamsOn;
  $("webcams").onchange = function () {
    webcamsOn = this.checked; localStorage.setItem("webcams", webcamsOn ? "1" : "0"); $("wcErr").textContent = "";
    wcSeq++; if (webcamsOn) loadWebcams(); else clearWebcams();
  };
  var wcMap = null;
  setInterval(function () { if (map && map !== wcMap) { wcMap = map; wcMarkers = {}; map.on("moveend", loadWebcams); if (webcamsOn) loadWebcams(); } }, 1000);

  // Ships (AISStream via ais.php; the key stays on the server)
  var shipsAvail = !!window.HAS_AIS, shipsOn = shipsAvail && localStorage.getItem("ships") === "1";
  var shTimer = null, shMove = null, shMarkers = {}, shBusy = false;
  // Ships remembered in the browser so they show instantly on start or when the map moves.
  function shTtl(v) { return (v != null && v >= 0.5 ? 20 : 60) * 60000; }
  var shCache = {}; try { (JSON.parse(localStorage.getItem("ship_cache_v85") || "[]")).forEach(function (s) { if (Date.now() - s.at < shTtl(s.speed)) shCache[s.id] = s; }); } catch (e) {}
  function shSave() { var now = Date.now(), a = []; Object.keys(shCache).forEach(function (id) { if (now - shCache[id].at > shTtl(shCache[id].speed)) delete shCache[id]; else a.push(shCache[id]); }); try { localStorage.setItem("ship_cache_v85", JSON.stringify(a.slice(-1500))); } catch (e) {} }
  function shCached() { if (!map || !shipsOn || !zoomOk("ships")) return; var b = map.getBounds(), now = Date.now();
    shDraw(Object.keys(shCache).map(function (id) { return shCache[id]; }).filter(function (s) { return now - s.at < shTtl(s.speed) && s.lat >= b.getSouth() && s.lat <= b.getNorth() && s.lon >= b.getWest() && s.lon <= b.getEast(); }).slice(0, 400), now); }
  var SHIP_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5c2.6 2.4 4 5.5 4 9v11.5H8V10.5c0-3.5 1.4-6.6 4-9z" fill="currentColor" stroke="rgba(0,0,0,.7)" stroke-width="0.9" stroke-linejoin="round"/><rect x="9.6" y="15" width="4.8" height="4" rx=".6" fill="rgba(0,0,0,.35)"/></svg>';
  function shipKind(t) {
    if (t == null || t <= 0) return ["other", "Okänd typ"];
    var m = { 30: ["fishing", "Fiskefartyg"], 31: ["service", "Bogserbåt"], 32: ["service", "Bogserbåt"], 52: ["service", "Bogserbåt"], 33: ["service", "Muddring/undervattensarbete"], 34: ["service", "Dykfartyg"], 35: ["military", "Militärt fartyg"], 36: ["pleasure", "Segelbåt"], 37: ["pleasure", "Fritidsbåt"], 50: ["service", "Lotsbåt"], 51: ["service", "Sjöräddning"], 53: ["service", "Hamnfartyg"], 54: ["service", "Miljöskyddsfartyg"], 55: ["military", "Kustbevakning/polis"], 58: ["service", "Ambulansfartyg"] };
    if (m[t]) return m[t];
    if (t >= 40 && t <= 49) return ["fast", "Snabbgående fartyg"];
    if (t >= 60 && t <= 69) return ["passenger", "Passagerarfartyg/färja"];
    if (t >= 70 && t <= 79) return ["cargo", "Lastfartyg"];
    if (t >= 80 && t <= 89) return ["tanker", "Tankfartyg"];
    return ["other", "Övrigt fartyg"];
  }
  var SHIP_COLORS = { cargo: "#3ec96b", tanker: "#e5484d", passenger: "#6b7ff0", fishing: "#f0a02c", service: "#3fc3d9", pleasure: "#e06bb8", fast: "#f5d442", military: "#5b8a5a", other: "#9aa4b2" };
  function shipGuess(name) {
    if (!name) return null;
    var n = name.toUpperCase();
    if (/\b(KBV|HMS|COAST\s*GUARD|KUSTBEVAKNING|PATROL)\b/.test(n)) return ["military", "Militärt fartyg/kustbevakning"];
    if (/\b(PILOT|LOTS|TUG|BOGSER|RESCUE|SJÖRÄDDNING)\b/.test(n)) return ["service", "Servicefartyg"];
    if (/\b(STENA|TT-?LINE|DFDS|VIKING\s*LINE|TALLINK|SILJA|COLOR\s*LINE|FJORD\s*LINE|WASALINE|DESTINATION\s*GOTLAND|FERRY|FÄRJA)\b/.test(n)) return ["passenger", "Passagerarfartyg/färja"];
    if (/\b(TANKER|OIL|CHEM|GAS|LNG|LPG|BITUMEN)\b/.test(n)) return ["tanker", "Tankfartyg"];
    if (/\b(MSC|MAERSK|CMA|HAPAG|EVERGREEN|COSCO|GRIMALDI|WALLENIUS|HOEGH|EUKOR|CONTAINER|CARGO|BULK|CARRIER|FREIGHTER)\b/.test(n)) return ["cargo", "Lastfartyg"];
    if (/\b(TRAWLER|FISKERI|FISHING)\b/.test(n) || /^[A-Z]{1,3}\s?\d{1,4}$/.test(n.trim())) return ["fishing", "Fiskefartyg"];
    if (/\b(SAILING|YACHT|SEGEL)\b/.test(n)) return ["pleasure", "Fritidsbåt"];
    return null;
  }
  function shipSize(len, k) {
    if (len > 0) return len >= 200 ? 1 : len >= 100 ? 2 : len >= 25 ? 3 : 4;
    return k === "cargo" || k === "tanker" ? 2 : k === "pleasure" || k === "fishing" ? 4 : 3;
  }
  function shDraw(list, now) {
        list.forEach(function (s) {
          if (s.id === shTrackId) return; // followed ship has its own highlighted marker
          var e = shMarkers[s.id];
          if (!e) {
            var n = document.createElement("div"); n.className = "ship-marker";
            n.innerHTML = '<span class="ship-icon">' + SHIP_SVG + '</span><span class="ship-label"></span>';
            e = shMarkers[s.id] = { mk: new tt.Marker({ element: n, anchor: "center" }).setLngLat([s.lon, s.lat]).addTo(map), seen: now };
          }
          e.seen = now;
          e.mk.setLngLat([s.lon, s.lat]);
          var el = e.mk.getElement(), sk = shipKind(s.type), g = sk[0] === "other" ? shipGuess(s.name) : null, kind = g ? g[0] : sk[0], kindLabel = g ? g[1] : sk[1];
          el.dataset.k = kind; el.dataset.size = String(shipSize(s.len, kind));
          el.classList.toggle("ship-still", !(s.speed != null && s.speed >= 0.5));
          var ic = el.querySelector(".ship-icon");
          ic.style.color = SHIP_COLORS[kind];
          ic.style.transform = "rotate(calc(" + (s.heading || 0) + "deg + var(--map-rot, 0deg)))";
          el.querySelector(".ship-label").textContent = s.name;
          el.onclick = (function (s) { return function (ev) { ev.stopPropagation(); showShipInfo(s); }; })(s);
          el.title = s.name + " · " + (s.speed != null ? s.speed.toFixed(1) + " kn" : "?");
        });
  }
  function loadShips() { if (document.hidden) return;
    if (!map || !shipsOn || shBusy) return;
    if (!zoomOk("ships")) { Object.keys(shMarkers).forEach(function (id) { shMarkers[id].mk.remove(); }); shMarkers = {}; $("shErr").textContent = ""; return; }
    shBusy = true;
    var b = map.getBounds();
    fetch("ais.php?s=" + b.getSouth().toFixed(3) + "&w=" + b.getWest().toFixed(3) + "&n=" + b.getNorth().toFixed(3) + "&e=" + b.getEast().toFixed(3))
      .then(function (r) { if (!r.ok) throw new Error("Fartygsfel " + r.status); return r.json(); })
      .then(function (j) {
        if (!shipsOn) return;
        $("shErr").textContent = j.error || "";
        var now = Date.now();
        shDraw(j.ships || [], now);
        (j.ships || []).forEach(function (s) { var c = {}; for (var k in s) c[k] = s[k]; c.at = now; shCache[s.id] = c; });
        shSave();
        Object.keys(shMarkers).forEach(function (id) { if (now - shMarkers[id].seen > 3600000) { shMarkers[id].mk.remove(); delete shMarkers[id]; } });
      }).catch(function (e) { $("shErr").textContent = e.message || "Kunde inte ladda fartyg"; })
      .finally(function () { shBusy = false; });
  }
  function startShips() { stopShips(); shCached(); loadShips(); shTimer = setInterval(loadShips, dataSec(20) * 1000); }
  function stopShips() { clearInterval(shTimer); shTimer = null; Object.keys(shMarkers).forEach(function (id) { shMarkers[id].mk.remove(); }); shMarkers = {}; }
  function showShipInfo(s) {
    var sk = shipKind(s.type), g = sk[0] === "other" ? shipGuess(s.name) : null, kindLabel = g ? g[1] : sk[1];
    var on = shTrackId === s.id;
    showInfo("🚢", s.name, "", [["Typ", kindLabel], ["Storlek", s.len ? s.len + " × " + (s.beam || "?") + " m" : "Okänd"], ["Destination", s.destination || "Okänd (ej rapporterad än)"], ["Ankomst (ETA)", s.eta || "–"], ["Fart", s.speed != null ? s.speed.toFixed(1) + " knop" : "–"], ["MMSI", s.id]], false,
      '<button id="infoFollow" class="nav-here" type="button">' + (on ? "Sluta följa" : "🚢 Följ fartyget") + "</button>");
    $("infoFollow").onclick = function () { $("info").hidden = true; if (shTrackId === s.id) trackStop(); else shTrackStart(s); };
  }
  // Ship follow: search among recently seen ships, then poll a small area around the last position
  var shTrackId = null, shTrackTimer = null, shTrackMk = null, shTrackFirst = true, shTrackShip = null;
  function shTrackDraw(s) {
    if (!map || !s) return;
    shTrackShip = s;
    if (!shTrackMk) {
      var n = document.createElement("div"); n.className = "ship-marker ship-tracked";
      n.innerHTML = '<span class="ship-icon">' + SHIP_SVG + '</span><span class="ship-label"></span>';
      n.onclick = function (e) { e.stopPropagation(); if (shTrackShip) showShipInfo(shTrackShip); };
      shTrackMk = new tt.Marker({ element: n, anchor: "center" }).setLngLat([s.lon, s.lat]).addTo(map);
    }
    var el = shTrackMk.getElement(), sk2 = shipKind(s.type), g2 = sk2[0] === "other" ? shipGuess(s.name) : null, kind = g2 ? g2[0] : sk2[0];
    el.dataset.k = kind; el.dataset.size = String(Math.min(2, shipSize(s.len, kind)));
    var ic = el.querySelector(".ship-icon");
    ic.style.color = SHIP_COLORS[kind];
    ic.style.transform = "rotate(calc(" + (s.heading || 0) + "deg + var(--map-rot, 0deg)))";
    el.querySelector(".ship-label").textContent = s.name;
    shTrackMk.setLngLat([s.lon, s.lat]);
    $("tbName").innerHTML = "Följer <b>" + esc(s.name) + "</b>";
    $("tbStats").textContent = s.speed != null ? s.speed.toFixed(1) + " knop" : "";
    $("trackBadge").hidden = false;
    var cam = { center: [s.lon, s.lat], bearing: (follow || cockpit) ? (s.heading || 0) : 0, pitch: cockpit ? 72 : 0 }; if (cockpit) cam.zoom = Math.max(map.getZoom(), 15);
    if (shTrackFirst) { shTrackFirst = false; cam.zoom = Math.max(map.getZoom(), 11); map.flyTo(cam); } else { cam.duration = 1000; map.easeTo(cam); }
  }
  function shTrackStop() {
    var relS = shTrackId && shTrackShip;
    shTrackId = null; shTrackShip = null; clearInterval(shTrackTimer); shTrackTimer = null;
    if (shTrackMk) { shTrackMk.remove(); shTrackMk = null; }
    if ($("shTracked")) { $("shTracked").hidden = true; $("shBox").hidden = false; $("shList").innerHTML = ""; }
    if (relS && shTimer && map) shDraw([relS], Date.now());
  }
  function shTrackStart(s) {
    trackStop(); shTrackId = s.id; shTrackFirst = true; shTrackShip = s;
    if (shMarkers[s.id]) { shMarkers[s.id].mk.remove(); delete shMarkers[s.id]; }
    if ($("ships") && $("ships").onchange && !$("ships").checked) { $("ships").checked = true; $("ships").onchange(); }
    $("shName").textContent = s.name;
    $("shTracked").hidden = false; $("shBox").hidden = true; $("shList").innerHTML = ""; $("shQ").value = "";
    shTrackDraw(s);
    shTrackTimer = setInterval(function () {
      if (!shTrackId || !shTrackShip) return;
      var p = shTrackShip;
      fetch("ais.php?s=" + (p.lat - 0.5) + "&w=" + (p.lon - 1) + "&n=" + (p.lat + 0.5) + "&e=" + (p.lon + 1))
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var f = (j.ships || []).filter(function (x) { return x.id === shTrackId; })[0];
          if (f) shTrackDraw(f);
        }).catch(function () {});
    }, 15000);
  }
  if (shipsAvail) {
    $("shipsRow").hidden = false; $("shSearch").hidden = false; $("ships").checked = shipsOn;
    $("ships").onchange = function () {
      shipsOn = this.checked; localStorage.setItem("ships", shipsOn ? "1" : "0"); $("shErr").textContent = "";
      if (shipsOn) startShips(); else stopShips();
    };
    var shQT = null;
    $("shQ").oninput = function () {
      var q = this.value.trim().toUpperCase(); clearTimeout(shQT);
      if (q.length < 2) { $("shList").innerHTML = ""; return; }
      shQT = setTimeout(function () {
        var now = Date.now(), ul = $("shList"); ul.innerHTML = "";
        var hits = Object.keys(shCache).map(function (k) { return shCache[k]; })
          .filter(function (s) { return now - s.at < 3600000 && ((s.name || "").toUpperCase().indexOf(q) >= 0 || s.id.indexOf(q) >= 0); })
          .slice(0, 10);
        if (!hits.length) { ul.innerHTML = '<li class="fs-empty">Inget fartyg hittades – fartyg syns efter att kartan laddat dem</li>'; return; }
        hits.forEach(function (s) {
          var li = document.createElement("li"), b = document.createElement("button"); b.type = "button";
          b.innerHTML = "<b></b><small></small>";
          b.querySelector("b").textContent = s.name;
          b.querySelector("small").textContent = [s.id, s.destination, s.speed != null ? s.speed.toFixed(1) + " kn" : null].filter(Boolean).join(" · ");
          b.onclick = function () { shTrackStart(s); };
          li.appendChild(b); ul.appendChild(li);
        });
      }, 350);
    };
    $("shStop").onclick = trackStop;
  }

  // Buses and trains (Trafiklab via transit.php; keys stay on the server)
  var trAvail = !!window.HAS_TRANSIT, trainAvail = !!window.HAS_TRAINS;
  var TR = { bus: "buses", metro: "metro", tram: "tram", ferry: "ferry", train: "trains" }, trModes = {};
  Object.keys(TR).forEach(function (m) { trModes[m] = (m === "train" ? trainAvail : trAvail) && localStorage.getItem(TR[m]) === "1"; });
  function trList() { return Object.keys(trModes).filter(function (m) { return trModes[m]; }); }
  var trTimer = null, trMove = null, trMarkers = {}, trBusy = false;
  var MODE = { bus: "🚌", train: "🚆", metro: "🚇", tram: "🚊", ferry: "⛴️", unknown: "🚍" };
  function trOn() { return trList().length > 0; }
  function hhmm(t) { return t ? t.slice(11, 16) : "–"; }
  function loadTransit() { if (document.hidden) return;
    if (!map || !trOn() || trBusy) return;
    if (!zoomOk("transit")) { Object.keys(trMarkers).forEach(function (id) { trMarkers[id].remove(); }); trMarkers = {}; $("trErr").textContent = ""; return; }
    trBusy = true;
    var b = map.getBounds();
    fetch("transit.php?s=" + b.getSouth().toFixed(3) + "&w=" + b.getWest().toFixed(3) + "&n=" + b.getNorth().toFixed(3) + "&e=" + b.getEast().toFixed(3) + "&modes=" + trList().join(","))
      .then(function (r) { if (!r.ok) throw new Error("Trafikfel " + r.status); return r.json(); })
      .then(function (j) {
        if (!trOn()) return;
        $("trErr").textContent = j.error || "";
        trVehicles = j.vehicles || [];
        var seen = {};
        (j.vehicles || []).forEach(function (v) {
          if (!trModes[v.mode]) return;
          if (v.id === trTrackId) return; // followed vehicle has its own highlighted marker
          seen[v.id] = 1;
          var mk = trMarkers[v.id];
          if (!mk) {
            var n = document.createElement("div"); n.className = "transit-marker";
            n.innerHTML = '<span class="transit-dir"><span class="transit-arrow"></span><span class="transit-icon"></span></span><span class="transit-label"></span>';
            mk = trMarkers[v.id] = new tt.Marker({ element: n, anchor: "center" }).setLngLat([v.lon, v.lat]).addTo(map);
          }
          mk.setLngLat([v.lon, v.lat]);
          var el = mk.getElement();
          el.querySelector(".transit-icon").textContent = MODE[v.mode] || MODE.unknown;
          el.querySelector(".transit-arrow").style.transform = "rotate(calc(" + (v.bearing || 0) + "deg + var(--map-rot, 0deg)))";
          var lb = el.querySelector(".transit-label"); lb.textContent = v.line || ""; lb.hidden = !v.line;
          el.title = (v.line ? "Linje " + v.line : "") + (v.headsign ? " mot " + v.headsign : "");
          el.onclick = (function (v) { return function (ev) { ev.stopPropagation(); showVehicle(v); }; })(v);
        });
        Object.keys(trMarkers).forEach(function (id) { if (!seen[id]) { trMarkers[id].remove(); delete trMarkers[id]; } });
      }).catch(function (e) { $("trErr").textContent = e.message || "Kunde inte ladda kollektivtrafik"; })
      .finally(function () { trBusy = false; });
  }
  function showVehicle(v) {
    var title = v.line ? "Linje " + v.line : "Kollektivtrafik", icon = MODE[v.mode] || MODE.unknown;
    var speed = ["Fart", v.speed != null ? Math.round(v.speed * 3.6) + " km/h" : "–"];
    var showV = function (ic, t, sub, rows) {
      var on = trTrackId === v.id;
      showInfo(ic, t, sub, rows, false, '<button id="infoFollow" class="nav-here" type="button">' + (on ? "Sluta följa" : (MODE[v.mode] || "🚍") + " Följ fordonet") + "</button>");
      $("infoFollow").onclick = function () { $("info").hidden = true; if (trTrackId === v.id) trackStop(); else trTrackStart(v); };
    };
    showV(icon, title, v.headsign ? "mot " + v.headsign : "", [["Avgång", "Hämtar…"], ["Ankomst", "Hämtar…"], speed]);
    fetch("transit.php?trip=" + encodeURIComponent(v.tripId) + "&date=" + encodeURIComponent(v.startDate || ""))
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (j) {
        if (infoTitle !== title || $("info").hidden) return;
        var ti = j && j.trip;
        if (!ti) { showV(icon, title, v.headsign ? "mot " + v.headsign : "", [["Avgång", "Okänd"], ["Ankomst", "Okänd"], speed]); return; }
        var rows = [["Avgång", ti.from ? hhmm(ti.from.time) + " " + ti.from.name : "–"], ["Ankomst", ti.to ? hhmm(ti.to.time) + " " + ti.to.name : "–"]];
        if (ti.next) rows.push(["Nästa", hhmm(ti.next.time) + " " + ti.next.name]);
        rows.push(speed);
        showV(MODE[ti.mode] || icon, title, [ti.direction ? "mot " + ti.direction : "", ti.agency].filter(Boolean).join(" · ") + (String(v.tripId).indexOf("tv:") === 0 ? " · Data från Trafikverket" : String(v.tripId).indexOf("vt:") === 0 ? " · Data från Västtrafik" : " · Data från Trafiklab.se"), rows);
      });
  }
  function startTransit() { stopTransit(); loadTransit(); trTimer = setInterval(loadTransit, dataSec(15) * 1000); }
  function stopTransit() { clearInterval(trTimer); trTimer = null; Object.keys(trMarkers).forEach(function (id) { trMarkers[id].remove(); }); trMarkers = {}; }
  // Transit follow: search vehicles currently on the map, then poll a small area around the last position
  var trVehicles = [], trTrackId = null, trTrackTrip = "", trTrackTimer = null, trTrackMk = null, trTrackFirst = true, trTrackVeh = null;
  function trTrackDraw(v) {
    if (!map || !v) return;
    trTrackVeh = v;
    if (!trTrackMk) {
      var n = document.createElement("div"); n.className = "transit-marker transit-tracked";
      n.innerHTML = '<span class="transit-dir"><span class="transit-arrow"></span><span class="transit-icon"></span></span><span class="transit-label"></span>';
      n.onclick = function (e) { e.stopPropagation(); if (trTrackVeh) showVehicle(trTrackVeh); };
      trTrackMk = new tt.Marker({ element: n, anchor: "center" }).setLngLat([v.lon, v.lat]).addTo(map);
    }
    var el = trTrackMk.getElement();
    el.querySelector(".transit-icon").textContent = MODE[v.mode] || MODE.unknown;
    el.querySelector(".transit-arrow").style.transform = "rotate(calc(" + (v.bearing || 0) + "deg + var(--map-rot, 0deg)))";
    var lb = el.querySelector(".transit-label"); lb.textContent = v.line || ""; lb.hidden = !v.line;
    trTrackMk.setLngLat([v.lon, v.lat]);
    $("tbName").innerHTML = "Följer <b>" + esc(v.line ? "Linje " + v.line : "Fordon") + "</b>";
    $("tbStats").textContent = v.speed != null ? Math.round(v.speed * 3.6) + " km/h" : "";
    $("trackBadge").hidden = false;
    var cam = { center: [v.lon, v.lat], bearing: (follow || cockpit) ? (v.bearing || 0) : 0, pitch: cockpit ? 72 : 0 }; if (cockpit) cam.zoom = Math.max(map.getZoom(), 16);
    if (trTrackFirst) { trTrackFirst = false; cam.zoom = Math.max(map.getZoom(), 12); map.flyTo(cam); } else { cam.duration = 1000; map.easeTo(cam); }
  }
  function trTrackStop() {
    var relT = !!trTrackId;
    trTrackId = null; trTrackVeh = null; clearInterval(trTrackTimer); trTrackTimer = null;
    if (trTrackMk) { trTrackMk.remove(); trTrackMk = null; }
    if ($("trTracked")) { $("trTracked").hidden = true; $("trBox").hidden = false; $("trList").innerHTML = ""; }
    if (relT && trOn() && map) loadTransit();
  }
  function trTrackStart(v) {
    trackStop(); trTrackId = v.id; trTrackTrip = v.tripId || ""; trTrackFirst = true; trTrackVeh = v;
    if (trMarkers[v.id]) { trMarkers[v.id].remove(); delete trMarkers[v.id]; }
    if (v.mode && TR[v.mode] && !trModes[v.mode] && $("tr_" + v.mode) && $("tr_" + v.mode).onchange) { $("tr_" + v.mode).checked = true; $("tr_" + v.mode).onchange(); }
    $("trName").textContent = v.line ? "Linje " + v.line : "Fordon";
    $("trTracked").hidden = false; $("trBox").hidden = true; $("trList").innerHTML = ""; $("trQ").value = "";
    trTrackDraw(v);
    trTrackTimer = setInterval(function () {
      if (!trTrackId || !trTrackVeh) return;
      var p = trTrackVeh;
      fetch("transit.php?s=" + (p.lat - 0.3) + "&w=" + (p.lon - 0.6) + "&n=" + (p.lat + 0.3) + "&e=" + (p.lon + 0.6) + "&modes=bus,train,metro,tram,ferry")
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var f = (j.vehicles || []).filter(function (x) { return x.id === trTrackId || (trTrackTrip && x.tripId === trTrackTrip); })[0];
          if (f) trTrackDraw(f);
        }).catch(function () {});
    }, 15000);
  }
  Object.keys(TR).forEach(function (m) {
    if (!(m === "train" ? trainAvail : trAvail)) return;
    $("tr_" + m + "Row").hidden = false; $("tr_" + m).checked = trModes[m];
    $("tr_" + m).onchange = function () {
      trModes[m] = this.checked; localStorage.setItem(TR[m], this.checked ? "1" : "0"); $("trErr").textContent = "";
      if (trOn()) startTransit(); else stopTransit();
    };
  });
  if (trAvail || trainAvail) {
    $("trSearch").hidden = false;
    var trQT = null;
    $("trQ").oninput = function () {
      var q = this.value.trim().toLowerCase(); clearTimeout(trQT);
      if (q.length < 2) { $("trList").innerHTML = ""; return; }
      trQT = setTimeout(function () {
        var ul = $("trList"); ul.innerHTML = "";
        if (!trOn()) { ul.innerHTML = '<li class="fs-empty">Slå på ett kollektivtrafikslag först</li>'; return; }
        var hits = trVehicles.filter(function (v) { return ((v.line || "").toLowerCase().indexOf(q) >= 0 || (v.headsign || "").toLowerCase().indexOf(q) >= 0); }).slice(0, 10);
        if (!hits.length) { ul.innerHTML = '<li class="fs-empty">Inget fordon i kartbilden matchar</li>'; return; }
        hits.forEach(function (v) {
          var li = document.createElement("li"), b = document.createElement("button"); b.type = "button";
          b.innerHTML = "<b></b><small></small>";
          b.querySelector("b").textContent = (MODE[v.mode] || "") + " " + (v.line ? "Linje " + v.line : "Fordon");
          b.querySelector("small").textContent = [v.headsign ? "mot " + v.headsign : null, v.speed != null ? Math.round(v.speed * 3.6) + " km/h" : null].filter(Boolean).join(" · ");
          b.onclick = function () { trTrackStart(v); };
          li.appendChild(b); ul.appendChild(li);
        });
      }, 350);
    };
    $("trStop").onclick = trackStop;
  }

  // Cultural heritage (K-samsök via ksamsok.php)
  var heOn = localStorage.getItem("heritage") === "1", heMove = null, heMarkers = {}, heBusy = false;
  function loadHeritage() {
    if (!map || !heOn || heBusy) return;
    if (!zoomOk("ksamsok")) { clearHeritage(); $("heErr").textContent = ""; return; }
    heBusy = true;
    var b = map.getBounds();
    fetch("ksamsok.php?s=" + b.getSouth().toFixed(3) + "&w=" + b.getWest().toFixed(3) + "&n=" + b.getNorth().toFixed(3) + "&e=" + b.getEast().toFixed(3))
      .then(function (r) { if (!r.ok) throw new Error("K-samsök-fel " + r.status); return r.json(); })
      .then(function (j) {
        if (!heOn) return;
        $("heErr").textContent = j.error || "";
        var seen = {};
        (j.items || []).forEach(function (h) {
          seen[h.id] = 1;
          if (heMarkers[h.id]) return;
          var n = document.createElement("div"); n.className = "heritage-marker"; n.textContent = h.image ? "🖼️" : "🏛️"; n.title = h.title;
          n.onclick = function (ev) { ev.stopPropagation(); showHeritage(h); };
          heMarkers[h.id] = new tt.Marker({ element: n, anchor: "center" }).setLngLat([h.lon, h.lat]).addTo(map);
        });
        Object.keys(heMarkers).forEach(function (id) { if (!seen[id]) { heMarkers[id].remove(); delete heMarkers[id]; } });
      }).catch(function (e) { $("heErr").textContent = e.message || "Kunde inte ladda K-samsök"; })
      .finally(function () { heBusy = false; });
  }
  function clearHeritage() { Object.keys(heMarkers).forEach(function (id) { heMarkers[id].remove(); }); heMarkers = {}; }
  function showHeritage(h) {
    infoTitle = h.title;
    infoPhoto = h.image ? '<a class="ph" href="' + esc(h.link || h.image.src) + '" target="_blank" rel="noopener noreferrer"><img src="' + esc(h.image.src) + '" alt="" onerror="this.parentNode.hidden=true" /><small>© ' + esc(h.image.by) + ' · K-samsök</small></a>' : "";
    var rows = []; if (h.place) rows.push(["Plats", h.place]); if (h.time) rows.push(["Tid", h.time]);
    var extra = (h.description ? '<p class="itext">' + esc(h.description) + '</p>' : "") + (h.link ? '<a class="ilink" href="' + esc(h.link) + '" target="_blank" rel="noopener noreferrer">Mer information ↗</a>' : "") + '<small style="display:block;margin-top:6px;font-size:10px;color:var(--muted)">Data från K-samsök / Riksantikvarieämbetet</small>';
    showInfo("🏛️", h.title, [h.type, h.org].filter(Boolean).join(" · "), rows, true, extra);
  }
  $("heritage").checked = heOn;
  $("heritage").onchange = function () { heOn = this.checked; localStorage.setItem("heritage", heOn ? "1" : "0"); $("heErr").textContent = ""; if (heOn) loadHeritage(); else clearHeritage(); };

  // Lightning (Blitzortung.org live feed, collected in this browser for 24 h)
  var lOn = localStorage.getItem("lightning") === "1", lWs = null, lHost = 0, lRetry = null, lSave = null, lTimer = null, lMarkers = {}, lMap = null;
  var lStrikes = []; try { lStrikes = JSON.parse(localStorage.getItem("lightning_strikes") || "[]").filter(function (x) { return Date.now() - x.time < 86400000; }); } catch (e) { lStrikes = []; }
  function lDecode(b) { var e = {}, d = b.split(""), c = d[0], f = c, g = [c], o = 256; for (var i = 1; i < d.length; i++) { var n = d[i].charCodeAt(0); var a = n < 256 ? d[i] : e[n] ? e[n] : f + c; g.push(a); c = a.charAt(0); e[o++] = f + c; f = a; } return g.join(""); }
  function lErr(m) { $("lightErr").textContent = m || ""; $("lightErr").hidden = !m; }
  function lConnect() {
    var w = new WebSocket("wss://" + ["ws1", "ws7", "ws8"][lHost % 3] + ".blitzortung.org/"); lWs = w;
    w.onopen = function () { w.send('{"a":111}'); lErr(""); };
    w.onmessage = function (m) {
      try { var j = JSON.parse(lDecode(String(m.data)));
        lStrikes.push({ id: String(j.time), lat: j.lat, lon: j.lon, time: Math.round(j.time / 1e6), delay: j.delay, sensors: j.sig ? j.sig.length : null, dist: j.mds, amp: typeof j.pol === "number" && j.pol !== 0 ? Math.abs(j.pol) : null });
        if (lStrikes.length > 6000) lStrikes = lStrikes.slice(-5000);
        if (!lSave) lSave = setTimeout(function () { lSave = null; try { localStorage.setItem("lightning_strikes", JSON.stringify(lStrikes.slice(-5000))); } catch (e) {} }, 3000);
      } catch (e) {}
    };
    w.onclose = function () { if (lWs !== w) return; lHost++; lErr("Tappade anslutningen till Blitzortung, försöker igen…"); lRetry = setTimeout(lConnect, 3000); };
  }
  function lClear() { Object.keys(lMarkers).forEach(function (id) { lMarkers[id].mk.remove(); }); lMarkers = {}; }
  function lRender() { if (document.hidden) return;
    if (!map || !lOn) return;
    if (lMap !== map) { lMarkers = {}; lMap = map; }
    var b = map.getBounds(), now = Date.now(), seen = {}, n = 0;
    lStrikes = lStrikes.filter(function (x) { return now - x.time < 86400000; });
    lStrikes.forEach(function (x) {
      if (n > 800 || x.lat < b.getSouth() || x.lat > b.getNorth() || x.lon < b.getWest() || x.lon > b.getEast()) return;
      seen[x.id] = 1; n++;
      if (!lMarkers[x.id]) {
        var el = document.createElement("div"); el.className = "lightning-marker";
        el.onclick = function (ev) { ev.stopPropagation(); showStrike(x); };
        lMarkers[x.id] = { mk: new tt.Marker({ element: el, anchor: "center" }).setLngLat([x.lon, x.lat]).addTo(map), el: el, s: x };
      }
      var age = Math.min(1, (now - x.time) / 86400000), e2 = lMarkers[x.id].el;
      e2.style.opacity = String(1 - age * 0.9); e2.style.width = e2.style.height = (8 - age * 3) + "px";
    });
    Object.keys(lMarkers).forEach(function (id) { if (!seen[id]) { lMarkers[id].mk.remove(); delete lMarkers[id]; } });
  }
  function showStrike(x) {
    var mins = Math.round((Date.now() - x.time) / 60000);
    showInfo("⚡", "Blixtnedslag", mins < 60 ? mins + " min sedan" : Math.floor(mins / 60) + " h " + (mins % 60) + " min sedan", [
      ["Tid", new Date(x.time).toLocaleString("sv", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })],
      ["Styrka", x.amp != null ? Math.round(x.amp) + " kA" : "Ej tillgänglig"]
    ], false, '<small style="display:block;margin-top:6px;font-size:10px;color:var(--muted)">Data från Blitzortung.org (Blitzortung.org och bidragsgivare)</small>');
  }
  function lSet(on) {
    lOn = on; localStorage.setItem("lightning", on ? "1" : "0");
    $("lightBtn").classList.toggle("on", on); $("lightBtn").setAttribute("aria-pressed", on);
    if (on) { if (!lWs) lConnect(); lRender(); lTimer = setInterval(lRender, 5000); }
    else { var w = lWs; lWs = null; clearTimeout(lRetry); if (w) w.close(); clearInterval(lTimer); lClear(); lErr(""); }
  }
  $("lightBtn").onclick = function () { lSet(!lOn); };
  if (lOn) lSet(true);

  // Accidents (Trafikverket via accidents.php): switch, or automatically while driving with auto position
  var accOn = localStorage.getItem("accidents") === "1", accList = [], accMk = [], accMap = null, accTimer = null, accWarned = {}, accWarnT = null, accShown = false, incMap = null, incOn = null;
  function accDriving() { return isMobile && gpsOn && gpsAuto; }
  // Swedish services only while the position/map is in the Nordic area
  function inNordic(lat, lon) {
    if (lat >= 63 && lat <= 67 && lon >= -25 && lon <= -13) return true;
    if (lat < 54.5 || lat > 71.5 || lon < 4.5 || lon > 31.6) return false;
    if (lat < 59.7 && lon > 21.2) return false;
    if (lat < 55.5 && lon > 12.9 && lon < 14) return true;
    if (lat < 54.9 && lon < 12) return false;
    return true;
  }
  function seActive() {
    if (gpsOn && lastFix) return inNordic(lastFix.lat, lastFix.lon);
    if (map) { var c = map.getCenter(); return inNordic(c.lat, c.lng); }
    return true;
  }
  var seLast = null;
  function seTick() {
    var on = seActive(); if (on === seLast) return; seLast = on;
    ["accidents", "fuelStations", "restareas"].forEach(function (id) { var el = $(id); var row = el && el.closest(".optrow"); if (row) { row.classList.toggle("swedish-off", !on); row.setAttribute("aria-disabled", on ? "false" : "true"); } });
    var n = $("seNote"); if (n) n.hidden = on;
    try { accTick(); raTick(); if (fuelReady) { if (on && fuelOn) fuelLoad(); else fuelClear(); } } catch (e) {}
  }
  setInterval(seTick, 3000);
  function regionCodes() { var r = localStorage.getItem("search_region") || "se"; return r === "world" ? "" : "&countrycodes=" + (r === "nordic" ? "se,no,dk,fi,is" : "se"); }
  var accById = {};
  function accDraw() {
    if (!map || !accShown || accMap !== map) { Object.keys(accById).forEach(function (k) { accById[k].remove(); }); accById = {}; }
    accMk = [];
    if (!map || !accShown) return; accMap = map;
    var seen = {};
    accList.forEach(function (a) {
      seen[a.id] = 1;
      var mk = accById[a.id];
      if (!mk) {
        var el = document.createElement("div"); el.className = "accident-marker"; el.textContent = "💥";
        mk = accById[a.id] = new tt.Marker({ element: el, anchor: "center" }).setLngLat([a.lon, a.lat]).addTo(map);
      } else mk.setLngLat([a.lon, a.lat]);
      var n = mk.getElement(); n.title = a.road || "Olycka";
      n.onclick = function (ev) { ev.stopPropagation(); showAccident(a); };
      accMk.push(mk);
    });
    Object.keys(accById).forEach(function (k) { if (!seen[k]) { accById[k].remove(); delete accById[k]; } });
  }
  function accLoad() { if (document.hidden) return;
    fetch("accidents.php").then(function (r) { return r.json(); }).then(function (j) { accList = j.items || []; $("accErr").textContent = j.error || ""; accDraw(); accTick(); })
      .catch(function () { $("accErr").textContent = "Kunde inte ladda olyckor"; });
  }
  function accTick() { if (document.hidden) return;
    if (typeof accOn === "undefined") return;
    var want = (accOn || accDriving()) && seActive();
    if (want !== accShown) {
      accShown = want;
      if (want) { accLoad(); accTimer = setInterval(accLoad, 60000); } else { clearInterval(accTimer); accList = []; accDraw(); }
      try { camDraw(); } catch (e) {}
    }
    if (map && (incMap !== map || incOn !== accShown)) { try { if (accShown) map.showTrafficIncidents(); else map.hideTrafficIncidents(); incMap = map; incOn = accShown; } catch (e) {} }
    if (map && accMap !== map && accShown) accDraw();
    var f = lastFix;
    if (!accDriving() || !f || f.heading == null || isNaN(f.heading)) return;
    var r = Math.PI / 180;
    for (var i = 0; i < accList.length; i++) {
      var a = accList[i]; if (accWarned[a.id]) continue;
      var dLat = (a.lat - f.lat) * r, dLon = (a.lon - f.lon) * r;
      var h = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(f.lat * r) * Math.cos(a.lat * r) * Math.pow(Math.sin(dLon / 2), 2);
      var km = 6371 * 2 * Math.asin(Math.sqrt(h)); if (km > 25) continue;
      var b = (Math.atan2(Math.sin(dLon) * Math.cos(a.lat * r), Math.cos(f.lat * r) * Math.sin(a.lat * r) - Math.sin(f.lat * r) * Math.cos(a.lat * r) * Math.cos(dLon)) / r + 360) % 360;
      var diff = Math.abs(b - f.heading) % 360; if (diff > 180) diff = 360 - diff; if (diff > 45) continue;
      accWarned[a.id] = 1;
      $("accWarnText").textContent = "Olycka " + (a.road ? "på " + a.road + " " : "") + "– " + (Math.round(km * 10) / 10) + " km fram" + (a.location ? " · " + a.location : "") + (a.message ? " – " + a.message : "");
      $("accWarn").hidden = false; clearTimeout(accWarnT); accWarnT = setTimeout(function () { $("accWarn").hidden = true; }, 60000);
      break;
    }
  }
  function showAccident(a) {
    function t(x) { return x ? new Date(x).toLocaleString("sv", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "–"; }
    var rows = [["Start", t(a.start)], ["Beräknat slut", t(a.end)]]; if (a.direction) rows.push(["Riktning", a.direction]);
    var txt = [a.location, a.message].filter(Boolean).join("\n\n");
    showInfo("💥", a.road ? "Olycka – " + a.road : "Olycka", a.severity, rows, false, (txt ? '<p class="itext">' + esc(txt) + '</p>' : "") + '<small style="display:block;margin-top:6px;font-size:10px;color:var(--muted)">Data från Trafikverket</small>');
  }
  $("accWarnX").onclick = function () { $("accWarn").hidden = true; };
  $("accidents").checked = accOn;
  $("accidents").onchange = function () { accOn = this.checked; localStorage.setItem("accidents", accOn ? "1" : "0"); $("accErr").textContent = ""; accTick(); };
  setInterval(accTick, 2000);
  accTick();

  // Stations: one local Swedish snapshot per session and shared web/Loopia filters.
  var fuelOn = localStorage.getItem("fuel_stations") === "1", fuelType = localStorage.getItem("fuel_type") || "all", fuelChain = localStorage.getItem("fuel_chain") || "";
  var fuelMap = null, fuelMk = [], fuelTimer = null, fuelSeq = 0, fuelSnapshot = null;
  function fuelGetSnapshot() {
    if (fuelSnapshot) return fuelSnapshot;
    fuelSnapshot = fetch("stations-sweden-v96.json").then(function(r) { if (!r.ok) throw Error(); return r.json(); }).then(function(j) {
      if (!Array.isArray(j.elements) || !j.elements.length) throw Error();
      return FS.parseStations(j.elements);
    }).catch(function(e) { fuelSnapshot = null; throw e; });
    return fuelSnapshot;
  }
  var FS = window.FuelStations;
  var fuelReady = !!(FS && Array.isArray(FS.FUEL_CHAINS) && typeof FS.parseStations === "function" && typeof FS.filterStations === "function" && typeof FS.stationRows === "function");
  if (fuelReady) {
  if (["all", "fuel", "fast"].indexOf(fuelType) < 0) fuelType = "all";
  if (FS.FUEL_CHAINS.indexOf(fuelChain) < 0) fuelChain = "";
  FS.FUEL_CHAINS.forEach(function(c) { var o = document.createElement("option"); o.value = o.textContent = c; $("fuelChain").appendChild(o); });
  $("fuelStations").checked = fuelOn; $("fuelType").value = fuelType; $("fuelChain").value = fuelChain; $("fuelFilters").hidden = !fuelOn;
  } else { fuelOn = false; $("fuelStations").checked = false; $("fuelStations").disabled = true; $("fuelFilters").hidden = true; $("fuelErr").textContent = "Stationsfunktionen kunde inte starta – ladda om sidan"; }
  function fuelClear() { fuelMk.forEach(function(mk) { mk.remove(); }); fuelMk = []; }
  function fuelDraw(items) {
    fuelClear(); var b = map.getBounds();
    var matches = FS.filterStations(items, fuelType, fuelChain).filter(function(s) { return b.contains([s.lon, s.lat]); }).slice(0,150);
    if (!$("fuelErr").textContent && !matches.length) $("fuelErr").textContent = "Inga matchande stationer i kartområdet";
    matches.forEach(function(s) {
      var el = document.createElement("div"); el.className = "fuel-marker"; el.textContent = s.charging ? "⚡" : "⛽"; el.title = s.name;
      el.tabIndex = 0; el.setAttribute("role","button"); el.setAttribute("aria-label",s.name);
      function show() {
        showInfo(s.charging ? "⚡" : "⛽", s.name, "", FS.stationRows(s), false, '<button id="fuelGo" type="button">🧭 Navigera hit</button><small class="fuel-credit">© OpenStreetMap-bidragsgivare · uppgifter kan vara ofullständiga</small>');
        $("fuelGo").onclick = function() { $("info").hidden = true; planRoute({ name:s.name, lat:s.lat, lon:s.lon }); };
      }
      el.onclick = function(e) { e.stopPropagation(); show(); }; el.onkeydown = function(e) { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); show(); } };
      fuelMk.push(new tt.Marker({element:el,anchor:"center"}).setLngLat([s.lon,s.lat]).addTo(map));
    });
  }
  function fuelLoad() {
    var seq = ++fuelSeq;
    if (!fuelReady || !fuelOn || !map || document.hidden || !seActive()) return;
    if (map.getZoom()<10) { fuelClear(); $("fuelErr").textContent="Zooma in för att se stationer"; return; }
    $("fuelErr").textContent="Hämtar stationer…";
    fuelGetSnapshot().then(function(items) {
      if(seq!==fuelSeq || !fuelOn || !map) return;
      $("fuelErr").textContent=""; fuelDraw(items);
    }).catch(function(){if(seq===fuelSeq) $("fuelErr").textContent="Kunde inte ladda stationsfilen – ladda om sidan";});
  }
  function fuelSchedule() { ++fuelSeq; clearTimeout(fuelTimer); fuelTimer=setTimeout(fuelLoad,100); }
  function fuelBind() { if(map && map !== fuelMap) { if(fuelMap) fuelMap.off("moveend",fuelSchedule); fuelClear(); fuelMap=map; map.on("moveend",fuelSchedule); if(fuelOn) fuelLoad(); } }
  var fuelBindTimer = fuelReady ? setInterval(function(){fuelBind();},1500) : null;
  $("fuelStations").onchange=function(){fuelOn=this.checked; localStorage.setItem("fuel_stations",fuelOn?"1":"0"); $("fuelFilters").hidden=!fuelOn; ++fuelSeq; fuelClear(); $("fuelErr").textContent=""; if(fuelReady && fuelOn) {fuelBind(); fuelLoad();} };
  $("fuelType").onchange=function(){fuelType=this.value;localStorage.setItem("fuel_type",fuelType);fuelLoad();};
  $("fuelChain").onchange=function(){fuelChain=this.value;localStorage.setItem("fuel_chain",fuelChain);fuelLoad();};

  // Rest areas (Trafikverket via parkings.php): own switch, refreshed every 12 h
  var raOn = localStorage.getItem("restareas") === "1", ra = [], raById = {}, raMap = null, raTimer = null, raShown = false;
  function raLoad() { if (document.hidden) return; fetch("parkings.php").then(function (r) { return r.json(); }).then(function (j) { ra = j.items || []; raDraw(); }).catch(function () { $("raErr").textContent = "Kunde inte ladda rastplatser"; }); }
  function raDraw() {
    if (map && raMap !== map) { Object.keys(raById).forEach(function (k) { raById[k].remove(); }); raById = {}; if (raMap) raMap.off("moveend", raDraw); raMap = map; map.on("moveend", raDraw); }
    var seen = {}, n = 0;
    if (map && raShown && ra.length && map.getZoom() >= 8) { var b = map.getBounds();
      ra.forEach(function (p) { if (n > 300 || !b.contains([p.lon, p.lat])) return; n++; seen[p.id] = 1; if (raById[p.id]) return;
        var el = document.createElement("div"); el.className = "restarea-marker"; el.textContent = "🅿️"; el.title = p.name;
        el.onclick = function (ev) { ev.stopPropagation();
          var rows = [];
          if (p.cars != null) rows.push(["Bilplatser", String(p.cars)]);
          if (p.lorries != null) rows.push(["Lastbilsplatser", String(p.lorries)]);
          if (p.equipment && p.equipment.length) rows.push(["Utrustning", p.equipment.join(", ")]);
          showInfo("🅿️", p.name, p.open ? "Öppen" : "Tillfälligt stängd", rows, false, '<small style="display:block;margin-top:6px;font-size:10px;color:var(--muted)">Data från Trafikverket</small>'); };
        raById[p.id] = new tt.Marker({ element: el, anchor: "center" }).setLngLat([p.lon, p.lat]).addTo(map); }); }
    Object.keys(raById).forEach(function (k) { if (!seen[k]) { raById[k].remove(); delete raById[k]; } });
  }
  function raTick() { var raW = raOn && seActive(); if (raW !== raShown) { raShown = raW; clearInterval(raTimer); if (raW) { raLoad(); raTimer = setInterval(raLoad, 43200000); } else { ra = []; raDraw(); } } }
  $("restareas").checked = raOn;
  $("restareas").onchange = function () { raOn = this.checked; localStorage.setItem("restareas", raOn ? "1" : "0"); $("raErr").textContent = ""; raTick(); };
  raTick();

  // Polisens trafikhändelser (police.php) – följer olycksbrytaren, blå varning
  var pol = [], polById = {}, polMap = null, polShown = false, polTimer = null, polWarned = {}, polWarnT = null;
  function polKm(a, b, c, d) { var r = Math.PI / 180, dLa = (c - a) * r, dLo = (d - b) * r; var h = Math.pow(Math.sin(dLa / 2), 2) + Math.cos(a * r) * Math.cos(c * r) * Math.pow(Math.sin(dLo / 2), 2); return 6371 * 2 * Math.asin(Math.sqrt(h)); }
  function polLoad() { if (document.hidden) return; fetch("police.php").then(function (r) { return r.json(); }).then(function (j) { pol = j.items || []; polDraw(); }).catch(function () {}); }
  function polDraw() {
    if (map !== polMap) { Object.keys(polById).forEach(function (k) { polById[k].remove(); }); polById = {}; polMap = map; }
    var seen = {};
    if (map && polShown) pol.forEach(function (p) { seen[p.id] = 1; if (polById[p.id]) return;
      var el = document.createElement("div"); el.className = "police-marker"; el.textContent = "🚔"; el.title = p.type;
      el.onclick = function (ev) { ev.stopPropagation();
        var rows = p.time ? [["Tid", new Date(p.time).toLocaleString("sv", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })]] : [];
        showInfo("🚔", p.type, p.title, rows, false, (p.summary ? '<p class="itext">' + esc(p.summary) + '</p>' : "") + (p.url ? '<p><a href="' + esc(p.url) + '" target="_blank" rel="noopener">Läs mer på polisen.se</a></p>' : "") + '<small style="display:block;margin-top:6px;font-size:10px;color:var(--muted)">Data från Polisen · positionen är ungefärlig</small>'); };
      polById[p.id] = new tt.Marker({ element: el, anchor: "center" }).setLngLat([p.lon, p.lat]).addTo(map); });
    Object.keys(polById).forEach(function (k) { if (!seen[k]) { polById[k].remove(); delete polById[k]; } });
  }
  function polTick() { if (document.hidden) return;
    if (accShown !== polShown) { polShown = accShown; clearInterval(polTimer); if (polShown) { polLoad(); polTimer = setInterval(polLoad, 180000); } else { pol = []; } polDraw(); }
    else if (map !== polMap) polDraw();
    var f = lastFix; if (!accDriving() || !f || !pol.length) return;
    var co = navOn && navRoutes[navIdx] ? navRoutes[navIdx].coords : null, r = Math.PI / 180;
    for (var i = 0; i < pol.length; i++) { var p = pol[i]; if (polWarned[p.id]) continue;
      var d = polKm(f.lat, f.lon, p.lat, p.lon), hit = false;
      if (co) { for (var k = 0; k < co.length; k += 5) if (polKm(co[k][1], co[k][0], p.lat, p.lon) < 3) { hit = true; break; } }
      else if (d < 15 && f.heading != null && !isNaN(f.heading)) { var dLo = (p.lon - f.lon) * r;
        var b = (Math.atan2(Math.sin(dLo) * Math.cos(p.lat * r), Math.cos(f.lat * r) * Math.sin(p.lat * r) - Math.sin(f.lat * r) * Math.cos(p.lat * r) * Math.cos(dLo)) / r + 360) % 360;
        var df = Math.abs(b - f.heading) % 360; if (df > 180) df = 360 - df; hit = df <= 45 || d < 2; }
      if (!hit) continue;
      polWarned[p.id] = 1;
      $("polWarnText").textContent = "Polis: " + p.type + " – " + (Math.round(d * 10) / 10) + " km bort" + (p.summary ? " – " + p.summary : "");
      $("polWarn").hidden = false; clearTimeout(polWarnT); polWarnT = setTimeout(function () { $("polWarn").hidden = true; }, 60000);
      break; }
  }
  $("polWarnX").onclick = function () { $("polWarn").hidden = true; };
  setInterval(polTick, 2000);

  // Navigation (mobile): second search field = destination; TomTom Routing with alternatives
  var navDest = null, navRoutes = [], navIdx = 0, navOn = false, navReroute = 0, navOff = 0, navArr = 0, navFails = 0;
  function nDist(a, b, c, d) { var R = Math.PI / 180, x = Math.pow(Math.sin((c - a) * R / 2), 2) + Math.cos(a * R) * Math.cos(c * R) * Math.pow(Math.sin((d - b) * R / 2), 2); return 12742000 * Math.asin(Math.sqrt(x)); }
  function fmtD(m) { return m >= 1000 ? (m / 1000).toFixed(m >= 10000 ? 0 : 1).replace(".", ",") + " km" : Math.round(m / 10) * 10 + " m"; }
  function fmtT(s) { var m = Math.round(s / 60); return m >= 60 ? Math.floor(m / 60) + " h " + (m % 60) + " min" : m + " min"; }
  function nArrow(m) {
    if (/^ARRIVE/.test(m)) return "🏁"; if (/UTURN/.test(m)) return "↩"; if (/ROUNDABOUT/.test(m)) return "⟲";
    if (/SHARP_LEFT/.test(m)) return "↙"; if (/SHARP_RIGHT/.test(m)) return "↘";
    if (/(KEEP|BEAR)_LEFT/.test(m)) return "↖"; if (/(KEEP|BEAR)_RIGHT/.test(m)) return "↗";
    if (/LEFT/.test(m)) return "←"; if (/RIGHT/.test(m)) return "→"; return "↑";
  }
  function nExit(s) {
    var n = s.roundaboutExitNumber;
    return /ROUNDABOUT/.test(s.maneuver) && typeof n === "number" && Number.isInteger(n) && n > 0 ? n : null;
  }
  function nIcon(s) {
    if (!/ROUNDABOUT/.test(s.maneuver)) return nArrow(s.maneuver);
    var n = nExit(s);
    return '<span class="roundabout-icon" role="img" aria-label="' + (n == null ? 'Rondell' : 'Rondell, avfart ' + n) + '"><svg class="roundabout-symbol" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20A8 8 0 1 0 4 11V16"/><path d="M0.5 12.5L4 16L7.5 12.5"/></svg>' + (n == null ? '' : '<span class="roundabout-exit" aria-hidden="true">' + n + '</span>') + '</span>';
  }
  function fetchRoutes(from, to, alt) {
    return fetch("https://api.tomtom.com/routing/1/calculateRoute/" + from.lat + "," + from.lon + ":" + to.lat + "," + to.lon + "/json?key=" + encodeURIComponent(key) +
      "&maxAlternatives=" + alt + "&instructionsType=text&language=sv-SE&traffic=true&travelMode=car").then(function (r) {
      if (!r.ok) throw new Error(r.status === 403 ? "TomTom nekar ruttsökning" : "Kunde inte hitta väg (fel " + r.status + ")");
      return r.json();
    }).then(function (j) {
      return (j.routes || []).map(function (rt) {
        var c = [], cum = [0];
        (rt.legs || []).forEach(function (l) { (l.points || []).forEach(function (p) { c.push([p.longitude, p.latitude]); }); });
        for (var i = 1; i < c.length; i++) cum.push(cum[i - 1] + nDist(c[i - 1][1], c[i - 1][0], c[i][1], c[i][0]));
        var steps = ((rt.guidance || {}).instructions || []).map(function (s) { return { offset: s.routeOffsetInMeters || 0, maneuver: s.maneuver || "", message: s.message || s.street || "", roundaboutExitNumber: nExit(s) }; });
        return { coords: c, cum: cum, length: rt.summary.lengthInMeters, time: rt.summary.travelTimeInSeconds, delay: rt.summary.trafficDelayInSeconds || 0, steps: steps };
      });
    });
  }
  function drawRoutes() {
    if (!map || !map.isStyleLoaded || !map.getStyle) return;
    try {
      ["route-alt", "route-casing", "route-main"].forEach(function (id) { if (map.getLayer(id)) map.removeLayer(id); });
      ["route-alt", "route-main"].forEach(function (id) { if (map.getSource(id)) map.removeSource(id); });
    } catch (e) { return; }
    if (!navRoutes.length) return;
    var alt = navRoutes.map(function (r, i) { return { type: "Feature", properties: { i: i }, geometry: { type: "LineString", coordinates: r.coords } }; }).filter(function (_, i) { return i !== navIdx; });
    map.addSource("route-alt", { type: "geojson", data: { type: "FeatureCollection", features: alt } });
    map.addSource("route-main", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: navRoutes[navIdx].coords } } });
    var lay = { "line-join": "round", "line-cap": "round" };
    map.addLayer({ id: "route-alt", type: "line", source: "route-alt", layout: lay, paint: { "line-color": "#8a94a6", "line-width": 6, "line-opacity": 0.8 } });
    map.addLayer({ id: "route-casing", type: "line", source: "route-main", layout: lay, paint: { "line-color": "#0b3d91", "line-width": 9, "line-opacity": 0.25 } });
    map.addLayer({ id: "route-main", type: "line", source: "route-main", layout: lay, paint: { "line-color": "#3b8cff", "line-width": 2.5, "line-opacity": 0.85, "line-dasharray": [2, 1.5] } });
    if (!map._navClick) { map._navClick = true; map.on("click", "route-alt", function (e) { var f = e.features && e.features[0]; if (f) pickRoute(Number(f.properties.i)); }); }
  }
  function fitRoutes() {
    if (!map || !navRoutes.length) return;
    var x0 = 180, y0 = 90, x1 = -180, y1 = -90;
    navRoutes.forEach(function (r) { r.coords.forEach(function (c) { if (c && isFinite(c[0]) && isFinite(c[1])) { x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); y0 = Math.min(y0, c[1]); y1 = Math.max(y1, c[1]); } }); });
    if (x0 > x1) return;
    try { map.fitBounds([[x0, y0], [x1, y1]], { padding: { top: 120, bottom: 300, left: 40, right: 40 }, bearing: 0, pitch: 0, duration: 800 }); } catch (e) {}
  }
  function pickRoute(i) { navIdx = i; drawRoutes(); renderPick(); fitRoutes(); }
  function renderPick(msg) {
    var el = $("navPick"); el.hidden = !navDest || navOn; if (el.hidden) return;
    var h = '<div class="nh"><span>🧭 Till ' + esc(navDest.name) + '</span><button type="button" id="navCancel" aria-label="Avbryt navigering">✕</button></div>';
    if (msg) h += '<small>' + esc(msg) + '</small>';
    navRoutes.forEach(function (r, i) {
      h += '<button type="button" class="rt' + (i === navIdx ? " on" : "") + '" data-i="' + i + '"><b>' + fmtT(r.time) + '</b><small>' + fmtD(r.length) + (r.delay > 60 ? " · +" + fmtT(r.delay) + " kö" : "") + '</small><small>' + (i ? "Alternativ " + i : "Snabbast") + '</small></button>';
    });
    if (navRoutes.length) h += '<button type="button" class="go" id="navGo">▶ Starta navigering</button>';
    el.innerHTML = h;
    $("navCancel").onclick = stopNav;
    el.querySelectorAll(".rt").forEach(function (b) { b.onclick = function () { pickRoute(Number(b.getAttribute("data-i"))); }; });
    if ($("navGo")) $("navGo").onclick = startNav;
  }
  function planRoute(to) {
    var from = gpsOn && lastFix ? lastFix : city;
    addRecent(to);
    navDest = to; navRoutes = []; navIdx = 0; drawRoutes(); setTop(false); renderPick("Söker vägar…");
    fetchRoutes(from, to, 2).then(function (r) { navRoutes = r; drawRoutes(); fitRoutes(); renderPick(r.length ? "" : "Ingen väg hittades"); })
      .catch(function (e) { renderPick(e.message); });
  }
  function startNav() {
    setTrafficFlow(true);
    navOn = true; navOff = 0; navArr = 0; renderPick(); $("navInfo").hidden = false;
    $("navVoice").hidden = false; if (voiceOn) say("Navigeringen är igång"); // unlock iOS speech inside the tap with a real phrase
    // Navigation preset: position, follow, 3D and accidents on – everything else off
    function setCb(id, v) { var e = $(id); if (e && e.checked !== v) { e.checked = v; e.dispatchEvent(new Event("change")); } }
    setCb("gpsAuto", true); setCb("gpsFollow", true); setCb("gps3d", true); setCb("accidents", true);
    ["fuelStations", "webcams", "flights", "ships", "heritage", "restareas", "tr_bus", "tr_metro", "tr_tram", "tr_ferry", "tr_train"].forEach(function (id) { setCb(id, false); });
    if (radarOn || cloudsOn) { radarOn = false; cloudsOn = false; clearInterval(rLoad); clearInterval(cLoad); stopPlay(); radarLabel(); showRadar(); showClouds(); }
    if (lOn) lSet(false);
    try { localStorage.setItem("nav_dest", JSON.stringify(navDest)); } catch (e) {}
    if (!gpsOn) startGps(); else { gpsAutoStop(); gpsAutoStart(); }
    if (lastFix) navTick();
  }
  function stopNav() {
    if (navOn) setTrafficFlow(false);
    try { localStorage.removeItem("nav_dest"); } catch (e) {}
    navOn = false; navDest = null; navRoutes = []; drawRoutes(); renderPick(); rrHide();
    $("navVoice").hidden = true; if ("speechSynthesis" in window) speechSynthesis.cancel();
    $("navInfo").hidden = true; $("navArrow").hidden = true; $("turnBar").hidden = true;
    if (gpsOn && !gpsAuto) gpsAutoStop();
  }
  function showArrived(name) {
    var o = document.createElement("div"); o.className = "arrived"; o.setAttribute("role", "status");
    var cols = ["var(--primary)", "oklch(.63 .24 27)", "#fff", "oklch(.75 .17 150)", "oklch(.7 .18 300)"], h = "";
    for (var i = 0; i < 70; i++) h += '<i style="left:' + ((i * 37) % 100) + '%;background:' + cols[i % 5] + ';animation-delay:' + ((i % 14) * 0.15) + 's;animation-duration:' + (2.2 + (i % 5) * 0.4) + 's;--drift:' + (((i * 53) % 120) - 60) + 'px"></i>';
    o.innerHTML = h + '<div class="af"><b>🏁</b><p class="glass">Du är framme' + (name ? " – " + esc(name) : "") + '!</p></div>';
    var close = function () { if (o.parentNode) o.parentNode.removeChild(o); };
    o.onclick = close; document.querySelector("main").appendChild(o); setTimeout(close, 6000);
  }
  function navTick() {
    if (!navOn || !lastFix || !navDest) return;
    var wait = Math.min(120000, 20000 * Math.pow(2, navFails));
    function reroute() {
      navReroute = Date.now();
      fetchRoutes(lastFix, navDest, 0).then(function (r) { if (r.length && navOn) { navFails = 0; navOff = 0; navRoutes = r; navIdx = 0; drawRoutes(); } else navFails++; })
        .catch(function () { navFails++; }); // keep old route and destination on errors
    }
    if (!navRoutes.length) { if (Date.now() - navReroute > wait) reroute(); return; }
    var rt = navRoutes[navIdx], best = 0, bd = Infinity;
    rt.coords.forEach(function (c, i) { var d = nDist(lastFix.lat, lastFix.lon, c[1], c[0]); if (d < bd) { bd = d; best = i; } });
    var at = rt.cum[best] || 0, left = Math.max(0, rt.length - at);
    navArr = left < 40 && nDist(lastFix.lat, lastFix.lon, navDest.lat, navDest.lon) < 60 ? navArr + 1 : 0;
    if (navArr >= 2) { var dn = navDest.name; stopNav(); showArrived(dn); return; }
    navOff = bd > 80 ? navOff + 1 : 0;
    if (navOff >= 3 && Date.now() - navReroute > wait) reroute();
    var presentation = DrivingLookahead.routePosition(rt, lastFix.lat, lastFix.lon);
    var next = null; for (var i = 0; i < rt.steps.length; i++) if (rt.steps[i].offset > presentation.at + 8 && !/^(STRAIGHT|FOLLOW|DEPART|SWITCH_MAIN_ROAD|SWITCH_PARALLEL_ROAD|WAYPOINT_REACHED)$/.test(rt.steps[i].maneuver)) { next = rt.steps[i]; break; }
    if (!next) next = rt.steps[rt.steps.length - 1] || { maneuver: "", message: "", offset: rt.length };
    var toNext = DrivingLookahead.guidanceDistance(Math.max(0, next.offset - presentation.at), lastFix, presentation.offRoute, Date.now()), eta = rt.time * left / Math.max(1, rt.length), a = nIcon(next);
    $("navNext").innerHTML = "<b>" + a + "</b> " + fmtD(toNext) + " · " + esc(next.message || "Fortsätt rakt fram");
    $("navLeft").textContent = fmtT(eta) + " · " + fmtD(left) + " · framme " + new Date(Date.now() + eta * 1000).toLocaleTimeString("sv", { hour: "2-digit", minute: "2-digit" });
    var na = $("navArrow"); na.hidden = false;
    na.className = "navarrow " + (/LEFT/.test(next.maneuver) ? "l" : /RIGHT/.test(next.maneuver) ? "r" : "c") + (toNext < 400 ? " near" : "") + (toNext >= 600 ? " far" : "");
    $("navArrowIco").innerHTML = a; $("navArrowDist").textContent = fmtD(toNext);
    var tb = $("turnBar"), tm = next.maneuver || "", ts = /LEFT/.test(tm) ? "left" : /RIGHT/.test(tm) ? "right" : null;
    if (/ROUNDABOUT|UTURN|KEEP|BEAR/.test(tm) || !ts || !isMobile || !(toNext > 10) || toNext > 110) tb.hidden = true;
    else { tb.hidden = false; tb.className = "turn-bar turn-bar-" + ts; tb.style.height = (Math.min(1, (toNext - 10) / 100) * 100) + "%"; }
    featNav(next, toNext);
  }
  // Faster-route suggestions while driving; the chosen route stays until the driver accepts
  var RR = [["sensitive", "Känslig (3 min)", 3], ["standard", "Standard (5 min)", 5], ["conservative", "Försiktig (10 min)", 10], ["off", "Av", 0]];
  var rrLevel = "standard", rrOffer = null, rrT = null;
  try { var rv = localStorage.getItem("reroute_level"); if (RR.some(function (x) { return x[0] === rv; })) rrLevel = rv; } catch (e) {}
  function rrMin() { for (var i = 0; i < RR.length; i++) if (RR[i][0] === rrLevel) return RR[i][2] ? RR[i][2] * 60 : Infinity; return 300; }
  function rrUi() {
    $("rrRow").hidden = rrLevel === "standard";
    $("rrSel").innerHTML = RR.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === rrLevel ? " selected" : "") + ">" + x[1] + "</option>"; }).join("");
  }
  function rrSave(l) { rrLevel = l; try { localStorage.setItem("reroute_level", l); } catch (e) {} rrUi(); }
  $("rrSel").onchange = function () { rrSave(this.value); };
  rrUi();
  function rrHide() { $("rrBox").hidden = true; rrOffer = null; clearTimeout(rrT); }
  function rrArm() { clearTimeout(rrT); rrT = setTimeout(rrHide, 15000); }
  function rrOverlap(cur, cand) {
    if (!cur.length || !cand.length) return 0;
    var sc = Math.max(1, Math.floor(cand.length / 40)), sr = Math.max(1, Math.floor(cur.length / 400)), hit = 0, n = 0;
    for (var i = 0; i < cand.length; i += sc) { n++; for (var j = 0; j < cur.length; j += sr) if (nDist(cand[i][1], cand[i][0], cur[j][1], cur[j][0]) < 120) { hit++; break; } }
    return hit / n;
  }
  function rrCheck() {
    if (!navOn || !navRoutes.length || !lastFix || !navDest || rrLevel === "off" || document.hidden || rrOffer) return;
    var cur = navRoutes[navIdx].coords;
    fetchRoutes(lastFix, navDest, 2).then(function (fr) {
      if (!navOn) return;
      var same = null, alt = null;
      fr.forEach(function (r) { r._ov = rrOverlap(cur, r.coords); if (!same && r._ov > 0.9) same = r; });
      if (!same) return;
      fr.forEach(function (r) { if (r !== same && r._ov <= 0.9 && (!alt || r.time < alt.time)) alt = r; });
      if (!alt) return;
      var save = same.time - alt.time;
      if (save < rrMin()) return;
      rrOffer = alt; $("rrText").textContent = "Snabbare väg – sparar " + fmtT(save);
      $("rrBtns").hidden = false; $("rrLv").hidden = true; $("rrBox").hidden = false; rrArm();
    }).catch(function () {});
  }
  setInterval(rrCheck, 120000);
  $("rrX").onclick = rrHide; $("rrNo").onclick = rrHide;
  $("rrGo").onclick = function () { if (rrOffer && navOn) { navReroute = Date.now(); navRoutes = [rrOffer]; navIdx = 0; drawRoutes(); } rrHide(); };
  $("rrSet").onclick = function () {
    var el = $("rrLv");
    el.innerHTML = RR.map(function (x) { return '<button type="button" data-l="' + x[0] + '"' + (x[0] === rrLevel ? ' class="on"' : "") + ">" + x[1] + "</button>"; }).join("");
    el.querySelectorAll("button").forEach(function (b) { b.onclick = function () { rrSave(b.getAttribute("data-l")); rrHide(); }; });
    $("rrBtns").hidden = true; el.hidden = false; rrArm();
  };
  $("navStop").onclick = stopNav;
  try { var sd = JSON.parse(localStorage.getItem("nav_dest") || "null"); if (sd && sd.name && isFinite(sd.lat)) { setTimeout(function () { navDest = sd; startNav(); }, 1500); } } catch (e) {}
  if (isMobile) $("navSearch").hidden = false;
  var t2 = null, q2 = $("q2"), list2 = $("results2");
  q2.oninput = function () {
    clearTimeout(t2); var v = q2.value.trim();
    if (v.length < 2) { list2.hidden = true; return; }
    t2 = setTimeout(function () {
      fetch("https://nominatim.openstreetmap.org/search?format=json&limit=6" + regionCodes() + "&q=" + encodeURIComponent(v), { headers: { "Accept-Language": "sv" } })
        .then(function (r) { return r.json(); }).then(function (res) {
          list2.innerHTML = "";
          res.forEach(function (r) {
            var li = document.createElement("li"), b = document.createElement("button"), name = r.name || r.display_name.split(",")[0];
            b.innerHTML = "<b>" + esc(name) + "</b><small>" + esc(r.display_name) + "</small>";
            b.onclick = function () { list2.hidden = true; q2.value = ""; planRoute({ name: name, lat: +r.lat, lon: +r.lon }); };
            li.appendChild(b); list2.appendChild(li);
          });
          list2.hidden = res.length === 0;
        }).catch(function () {});
    }, 300);
  };

  // Debounced search
  var t = null, ctrl = null, q = $("q"), list = $("results");
  q.oninput = function () {
    clearTimeout(t); if (ctrl) ctrl.abort();
    var v = q.value.trim();
    if (v.length < 2) { list.hidden = true; return; }
    t = setTimeout(function () {
      ctrl = new AbortController(); $("spin").hidden = false;
      fetch("https://nominatim.openstreetmap.org/search?format=json&limit=6&featuretype=city" + regionCodes() + "&q=" + encodeURIComponent(v),
        { signal: ctrl.signal, headers: { "Accept-Language": "sv" } })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          list.innerHTML = "";
          res.forEach(function (r) {
            var li = document.createElement("li"), b = document.createElement("button");
            var name = r.name || r.display_name.split(",")[0];
            b.innerHTML = "<b>" + esc(name) + "</b><small>" + esc(r.display_name) + "</small>";
            b.onclick = function () {
              list.hidden = true; q.value = ""; setTop(false);
              selectCity({ name: name, lat: +r.lat, lon: +r.lon }, true);
            };
            li.appendChild(b); list.appendChild(li);
          });
          list.hidden = res.length === 0;
        }).catch(function () {}).finally(function () { $("spin").hidden = true; });
    }, 300);
  };

  // Hamburger menus
  var topOpen = false, botOpen = false;
  function setTop(v) { topOpen = v; $("topMenu").hidden = !v; $("topBtn").textContent = v ? "✕" : "☰"; $("topBtn").setAttribute("aria-expanded", v); }
  function updatePill() {
    $("botBtn").textContent = botOpen ? "✕ Dölj väder" : "☰ " + (weather ? Math.round(weather.current.temp) + "°C · " + city.name : "Väder");
  }
  setTop(false); $("weather").hidden = true; $("botBtn").setAttribute("aria-expanded", false); updatePill();
  $("topBtn").onclick = function () { setTop(!topOpen); };
  $("botBtn").onclick = function () { botOpen = !botOpen; $("weather").hidden = !botOpen; $("botBtn").setAttribute("aria-expanded", botOpen); updatePill(); };

  // Initial load from URL
  var p = new URLSearchParams(location.search), lat = parseFloat(p.get("lat")), lon = parseFloat(p.get("lon")), n = p.get("city");
  function start() { initMap(); loadWeather(); }
  if (!isNaN(lat) && !isNaN(lon)) { city = { name: n || lat + ", " + lon, lat: lat, lon: lon }; start(); }
  else if (n) {
    fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(n))
      .then(function (r) { return r.json(); })
      .then(function (r) { if (r[0]) city = { name: n, lat: +r[0].lat, lon: +r[0].lon }; })
      .catch(function () {}).finally(start);
  } else if (isMobile && "geolocation" in navigator) { initMap(); startGps(); }
  else start();
  window.onpopstate = function () { location.reload(); };
  var infoTitle = "";
  var infoPhoto = "";
  function showInfoBase(icon, title, sub, rows, keepPhoto, extra) { return showInfo(icon, title, sub, rows, keepPhoto, extra); }
  function showInfo(icon, title, sub, rows, keepPhoto, extra) {
    if (infoTitle !== title || !keepPhoto) infoPhoto = "";
    infoTitle = title;
    $("info").innerHTML = '<div class="ih"><span class="ii">' + icon + '</span><div><b>' + esc(title) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') +
      '</div><button id="infoX" aria-label="Stäng">✕</button></div>' + infoPhoto + '<dl>' + rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join("") + '</dl>' + (extra || '');
    $("info").hidden = false;
    $("infoX").onclick = function () { $("info").hidden = true; };
  }
  function showFlight(cs, s) {
    var alt = s[13] != null ? s[13] : s[7];
    var heli = s[17] === 8, fIcon = isPoliceHeli(s) ? "🚓🚁" : heli ? "🚁" : "✈️";
    var mdl = s[18] ? (AC_MODELS[String(s[18]).toUpperCase()] || s[18]) : null;
    var base = [["Typ", heli ? "Helikopter" : "Flygplan"]].concat(mdl ? [["Modell", mdl + (mdl !== s[18] ? " (" + s[18] + ")" : "")]] : [], s[20] ? [["Registrering", s[20]]] : [], [ ["Höjd", alt != null ? Math.round(alt) + " m" : "–"], ["Fart", s[9] != null ? Math.round(s[9] * 3.6) + " km/h" : "–"]]);
    var rowsNow = [["Från", "Hämtar…"], ["Till", "Hämtar…"]].concat(base), subNow = "";
    var showInfo = function (a, b, c, d, e) {
      var on = trackHex === s[0];
      showInfoBase(a, b, c, d, e, '<button id="infoFollow" class="nav-here" type="button">' + (on ? "Sluta följa" : "✈️ Följ planet") + '</button>');
      $("infoFollow").onclick = function () { $("info").hidden = true; if (trackHex === s[0]) trackStop(); else trackStart(s); };
    };
    showInfo(fIcon, cs, "", rowsNow);
    fetch("https://api.planespotters.net/pub/photos/hex/" + encodeURIComponent(s[0])).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (j) {
      var ph = j && j.photos && j.photos[0];
      if (!ph || infoTitle !== cs || $("info").hidden) return;
      var src = (ph.thumbnail_large || ph.thumbnail || {}).src;
      showInfo(fIcon, cs, subNow, rowsNow, true);
      infoPhoto = '<a class="ph" href="' + esc(ph.link) + '" target="_blank" rel="noopener noreferrer"><img src="' + esc(src) + '" alt="Foto av ' + esc(cs) + '" /><small>© ' + esc(ph.photographer) + ' · planespotters.net</small></a>';
      showInfo(fIcon, cs, subNow, rowsNow, true);
    });
    function ap(a) { return a ? (a.municipality || a.name) + " (" + (a.iata_code || a.icao_code) + ")" : "Okänd"; }
    fetch("https://api.adsbdb.com/v0/callsign/" + encodeURIComponent(cs)).then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; }).then(function (j) {
        if (infoTitle !== cs || $("info").hidden) return;
        var fr = j && j.response && j.response.flightroute;
        subNow = fr && fr.airline ? fr.airline.name : "";
        rowsNow = [["Från", fr ? ap(fr.origin) : "Okänd"], ["Till", fr ? ap(fr.destination) : "Okänd"]].concat(base);
        showInfo(fIcon, cs, subNow, rowsNow, true);
      });
  }

  // ===== Speed cameras, slippery-road warning, road works, voice guidance, saved places =====
  function hav(a, b, c, d) { var R = Math.PI / 180, x = Math.pow(Math.sin((c - a) * R / 2), 2) + Math.cos(a * R) * Math.cos(c * R) * Math.pow(Math.sin((d - b) * R / 2), 2); return { m: 12742000 * Math.asin(Math.sqrt(x)), b: (Math.atan2(Math.sin((d - b) * R) * Math.cos(c * R), Math.cos(a * R) * Math.sin(c * R) - Math.sin(a * R) * Math.cos(c * R) * Math.cos((d - b) * R)) / R + 360) % 360 }; }
  var cams = [], camAt = null, camById = {}, camMap = null;
  var ice = [], iceTimer = null, iceWant = false;
  var rw = [], rwById = {}, rwMap = null, rwTimer = null, rwShown = false;
  function featTick() {
    var f = gpsOn ? lastFix : null;
    // cameras: load around position, markers on map
    var se = seActive();
    if (!camAt && se) { camAt = 1;
      try { var cc = JSON.parse(localStorage.getItem("cam_cache") || "null"); if (cc && cc.items && cc.items.length) { cams = cc.items; if (Date.now() - cc.at < 86400000) camAt = 2; } } catch (e) {}
      if (camAt !== 2) fetch("cameras.php").then(function (r) { return r.json(); }).then(function (j) { if (!j.items || !j.items.length) return; cams = j.items; camDraw(); try { localStorage.setItem("cam_cache", JSON.stringify({ at: Date.now(), items: cams })); } catch (e) {} }).catch(function () {});
    }
    camDraw();
    var best = null;
    if (f && se) cams.forEach(function (c) {
      var d = hav(f.lat, f.lon, c.lat, c.lon); if (d.m > 600) return;
      if (f.heading != null && !isNaN(f.heading)) { var df = Math.abs(d.b - f.heading) % 360; if (df > 180) df = 360 - df; if (df > 90 || (df > 60 && d.m > 30)) return; if (c.bearing != null) { var d2 = Math.abs(c.bearing - f.heading) % 360; if (d2 > 180) d2 = 360 - d2; if (d2 < 90) return; } }
      if (!best || d.m < best.m) best = { m: d.m, max: c.maxspeed };
    });
    var kmh = f && f.speed != null && !isNaN(f.speed) ? Math.round(f.speed * 3.6) : null, lim = best ? (best.max || sLimit) : null;
    var speeding = !!best && kmh != null && lim != null && kmh > lim, cw = $("camWarn");
    // Only the urgent camera escapes the bottom panel's stacking context.
    var cameraParent = speeding ? document.body : $("iceWarn").parentNode;
    if (cw.parentNode !== cameraParent) {
      if (speeding) cameraParent.appendChild(cw);
      else cameraParent.insertBefore(cw, $("iceWarn"));
    }
    cw.hidden = !best; cw.classList.toggle("speeding", speeding);
    if (best) $("camWarnDist").textContent = Math.round(best.m / 10) * 10 + " m";
    // slippery road
    var want = se && !!f && (navOn || (kmh || 0) >= 20);
    if (want !== iceWant) { iceWant = want; clearInterval(iceTimer); if (want) { iceLoad(); iceTimer = setInterval(iceLoad, 600000); } }
    var risky = want ? ice.filter(function (s) { return s.risk; }) : [], show = false;
    if (risky.length) {
      var pts = [[f.lon, f.lat, 10000]];
      if (navOn && navRoutes[navIdx]) { var co = navRoutes[navIdx].coords, st = Math.max(1, Math.floor(co.length / 400)); for (var i = 0; i < co.length; i += st) pts.push([co[i][0], co[i][1], 5000]); }
      outer: for (var p = 0; p < pts.length; p++) for (var k = 0; k < risky.length; k++) if (hav(pts[p][1], pts[p][0], risky[k].lat, risky[k].lon).m <= pts[p][2]) { show = true; break outer; }
    }
    var iw = $("iceWarn"); iw.hidden = !show;
    // road works with accidents
    var rwWant = typeof accShown !== "undefined" && accShown;
    if (rwWant !== rwShown) { rwShown = rwWant; clearInterval(rwTimer); if (rwWant) { rwLoad(); rwTimer = setInterval(rwLoad, 600000); } else { rw = []; rwDraw(); } }
  }
  function camDraw() {
    if (!map) return;
    if (camMap !== map) { camById = {}; if (camMap) camMap.off("moveend", camDraw); camMap = map; map.on("moveend", camDraw); }
    var seen = {}, n = 0, bd = map.getBounds();
    if (accShown && map.getZoom() >= 10) cams.forEach(function (c) { if (n > 300 || !bd.contains([c.lon, c.lat])) return; seen[c.id] = 1; n++; if (camById[c.id]) return;
      var el = document.createElement("div"); el.className = "camera-marker"; el.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/><rect x="5.5" y="8.5" width="13" height="9" rx="1.5" fill="#fff"/><rect x="9" y="6.5" width="4" height="2.5" rx="0.6" fill="#fff"/><circle cx="12" cy="13" r="2.6" fill="#3b82f6"/></svg>'; el.title = ["Fartkamera", c.road ? "väg " + c.road : "", c.name || ""].filter(Boolean).join(" – ");
      camById[c.id] = new tt.Marker({ element: el, anchor: "center" }).setLngLat([c.lon, c.lat]).addTo(map); });
    Object.keys(camById).forEach(function (k) { if (!seen[k]) { camById[k].remove(); delete camById[k]; } });
  }
  function iceLoad() { if (document.hidden) return; fetch("ice.php").then(function (r) { return r.json(); }).then(function (j) { ice = j.items || []; }).catch(function () {}); }
  function rwLoad() { if (document.hidden) return; fetch("roadworks.php").then(function (r) { return r.json(); }).then(function (j) { rw = j.items || []; rwDraw(); }).catch(function () {}); }
  function rwDraw() {
    if (map && rwMap !== map) { rwById = {}; if (rwMap) rwMap.off("moveend", rwDraw); rwMap = map; map.on("moveend", rwDraw); }
    var seen = {}, n = 0;
    if (map && rw.length && map.getZoom() >= 9) { var b = map.getBounds();
      rw.forEach(function (w) { if (n > 300 || !b.contains([w.lon, w.lat])) return; n++; seen[w.id] = 1; if (rwById[w.id]) return;
        var el = document.createElement("div"); el.className = "roadwork-marker"; el.textContent = "🚧"; el.title = w.road || "Vägarbete";
        el.onclick = function (ev) { ev.stopPropagation(); var t = w.end ? new Date(w.end).toLocaleString("sv", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "–", txt = [w.location, w.message].filter(Boolean).join("\n\n");
          showInfo("🚧", w.road ? "Vägarbete – " + w.road : "Vägarbete", "", [["Beräknat slut", t]], false, (txt ? '<p class="itext">' + esc(txt) + '</p>' : "") + '<small style="display:block;margin-top:6px;font-size:10px;color:var(--muted)">Data från Trafikverket</small>'); };
        rwById[w.id] = new tt.Marker({ element: el, anchor: "center" }).setLngLat([w.lon, w.lat]).addTo(map); }); }
    Object.keys(rwById).forEach(function (k) { if (!seen[k]) { rwById[k].remove(); delete rwById[k]; } });
  }
  setInterval(featTick, 1000);

  // Voice guidance (Web Speech), muted by default
  var voiceOn = false, voiceLast = null; try { voiceOn = localStorage.getItem("nav_voice") === "1"; } catch (e) {}
  var voiceU = null; // keep a reference so iOS Safari does not garbage-collect it mid-speech
  function navVoices() { if (!("speechSynthesis" in window)) return []; var vs = speechSynthesis.getVoices(), sv = vs.filter(function (v) { return v.lang.toLowerCase().indexOf("sv") === 0; }); return sv.length ? sv : vs; }
  function chosenVoice() { var n = null; try { n = localStorage.getItem("nav_voice_name"); } catch (e) {} if (!n) return null; var vs = navVoices(); for (var i = 0; i < vs.length; i++) if (vs[i].name === n) return vs[i]; return null; }
  // cancel() + speak() in the same task is reliable on iOS; a delayed re-speak loses the tap context
  function say(t, priority) { if (!priority && Date.now() < phAlertUntil) return; if (!("speechSynthesis" in window)) return; var s = speechSynthesis, u = new SpeechSynthesisUtterance(t); u.lang = "sv-SE"; var v = chosenVoice(); if (v) u.voice = v; u.onend = u.onerror = function () { if (voiceU === u) { voiceU = null; window.dispatchEvent(new Event("traffic-speech-end")); } }; voiceU = u; s.cancel(); window.dispatchEvent(new Event("traffic-speech-start")); s.resume(); s.speak(u); }
  function featNav(next, toNext) {
    $("navVoice").hidden = !navOn;
    if (!voiceOn || !next) return;
    var key = next.offset + "|" + next.maneuver, stage = toNext < 150 ? 2 : toNext < 800 ? 1 : 0, txt = next.message || next.street || "Fortsätt rakt fram";
    if (voiceLast && voiceLast.key === key && voiceLast.stage >= stage) return;
    voiceLast = { key: key, stage: stage };
    say(stage === 2 ? txt : "Om " + fmtD(toNext).replace(" m", " meter").replace(" km", " kilometer") + ", " + txt);
  }
  function voiceUi(b) { b.classList.toggle("on", voiceOn); b.setAttribute("aria-pressed", voiceOn); b.setAttribute("aria-label", voiceOn ? "Stäng av röstvägledning" : "Slå på röstvägledning"); }
  voiceUi($("navVoice"));
  $("navVoice").onclick = function () { voiceOn = !voiceOn; voiceLast = null; try { localStorage.setItem("nav_voice", voiceOn ? "1" : "0"); } catch (e) {} this.classList.toggle("on", voiceOn); this.setAttribute("aria-pressed", voiceOn); this.setAttribute("aria-label", voiceOn ? "Stäng av röstvägledning" : "Slå på röstvägledning"); if (voiceOn) say("Röstvägledning på"); else if ("speechSynthesis" in window) speechSynthesis.cancel(); };

  // Voice choice for the guidance, saved in this browser
  var voiceSel = $("voiceSel"), savedVoice = "";
  try { savedVoice = localStorage.getItem("nav_voice_name") || ""; } catch (e) {}
  function fillVoices() { if (!voiceSel) return; voiceSel.innerHTML = '<option value="">Standard</option>' + navVoices().map(function (v) { return '<option value="' + esc(v.name) + '"' + (v.name === savedVoice ? " selected" : "") + '>' + esc(v.name) + "</option>"; }).join(""); }
  fillVoices(); if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = fillVoices;
  if (voiceSel) voiceSel.onchange = function () { savedVoice = this.value; try { if (savedVoice) localStorage.setItem("nav_voice_name", savedVoice); else localStorage.removeItem("nav_voice_name"); } catch (e) {} };
  var voicePlay = $("voicePlay"); if (voicePlay) voicePlay.onclick = function () { say("Om trehundra meter, sväng höger"); };


  // Independent five-minute GPS watch, using the same rules as the web app.
  var phOn = localStorage.getItem("police_heli_watch") === "1", phItems = [], phMarkers = [], phController = null, phTimer = null, phAlertUntil = 0;
  var phSymbol = '<g class="police-helicopter-symbol" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M27 43h46M50 43v8M30 60h12M29 55v10M44 70h23M47 66v4M62 65v5" fill="none"/><path d="M43 54h15c8 0 14 5 14 10H45c-6 0-7-10-2-10Z"/><path d="M58 55h5l6 6H58Z" class="police-helicopter-window" stroke="none"/></g>';
  $("phWarnSymbol").innerHTML = phSymbol;
  function phDraw(items) {
    phItems = items; phMarkers.forEach(function (m) { m.remove(); }); phMarkers = [];
    $("phWarn").hidden = !items.length;
    if (!map) return;
    items.forEach(function (f) {
      if (flMarkers[f.id]) { flMarkers[f.id].remove(); delete flMarkers[f.id]; }
      if (f.id === trackHex) return;
      var node = document.createElement("div"); node.className = "flight-marker flight-police";
      node.setAttribute("aria-label", "Polishelikopter " + f.callsign);
      node.innerHTML = '<span class="flight-icon">' + POLICE_HELI_SVG + '</span><span class="flight-label"></span>';
      node.querySelector(".flight-label").textContent = f.callsign;
      node.querySelector(".flight-icon").style.transform = "rotate(calc(" + f.heading + "deg + var(--map-rot, 0deg)))";
      node.onclick = function (e) { e.stopPropagation(); showFlight(f.callsign, f.state); };
      phMarkers.push(new tt.Marker({ element: node, anchor: "center" }).setLngLat([f.lon, f.lat]).addTo(map));
    });
  }
  function phStart() {
    if (phController) phController.stop(); clearInterval(phTimer); phDraw([]);
    if (!phOn) { $("phErr").textContent = ""; return; }
    phController = PoliceHelicopterWatch.createHelicopterWatch({
      position: function () { return gpsOn ? lastFix : null; }, visible: function () { return !document.hidden; },
      load: function (b) { return fetch("flights.php?s=" + b.south + "&w=" + b.west + "&n=" + b.north + "&e=" + b.east).then(function (r) { if (!r.ok) throw new Error("Flygdata-fel"); return r.json(); }).then(function (j) {
        if (j.error) throw new Error(j.error);
        return (j.states || []).map(function (s) { return { id: s[0], callsign: String(s[1] || s[0]).trim(), lon: s[5], lat: s[6], onGround: !!s[8], heading: s[10] || 0, heli: s[17] === 8, reg: s[20] || null, state: s }; });
      }); },
      result: phDraw, detected: function () { phAlertUntil = Date.now() + 4000; say("Polishelikopter", true); },
      error: function (message) { $("phErr").textContent = message || ""; }
    });
    phController.tick(); phTimer = setInterval(function () { phController.tick(); }, PoliceHelicopterWatch.HELICOPTER_INTERVAL);
  }
  $("policeHeliWatch").checked = phOn;
  $("policeHeliWatch").onchange = function () {
    phOn = this.checked; localStorage.setItem("police_heli_watch", phOn ? "1" : "0");
    if (phOn) { if (voiceOn) say("Polishelikopterkoll på", true); gpsAuto = true; $("gpsAuto").checked = true; localStorage.setItem("gps_auto", "1"); startGps(); }
    phStart();
  };
  document.addEventListener("visibilitychange", function () { if (phController && phOn) phController.tick(); });
  if (phOn) { gpsAuto = true; $("gpsAuto").checked = true; startGps(); }
  phStart();

  // Saved places: Hem, Jobb and the 5 latest destinations
  var spEdit = false;
  function spRead() { try { var s = JSON.parse(localStorage.getItem("saved_places") || "{}"); return { home: s.home || null, work: s.work || null, recent: s.recent || [] }; } catch (e) { return { home: null, work: null, recent: [] }; } }
  function spWrite(s) { try { localStorage.setItem("saved_places", JSON.stringify(s)); } catch (e) {} spRender(); }
  function addRecent(c) { var s = spRead(); s.recent = [c].concat(s.recent.filter(function (r) { return Math.abs(r.lat - c.lat) > 0.0005 || Math.abs(r.lon - c.lon) > 0.0005; })).slice(0, 5); spWrite(s); }
  function spRender() {
    var el = $("saved"); if (!el) return; el.hidden = !isMobile || navOn; el.innerHTML = ""; var s = spRead();
    function btn(txt, cls, fn) { var b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = txt; b.onclick = fn; el.appendChild(b); }
    [["home", "🏠", "Hem"], ["work", "💼", "Jobb"]].forEach(function (x) { var v = s[x[0]];
      btn(x[1] + " " + x[2] + (spEdit && v ? " ✕" : !v ? " +" : ""), "sp" + (spEdit && v ? " del" : v ? " set" : " empty"), function () {
        if (spEdit || !v) { if (v && spEdit) s[x[0]] = null; else { var h = gpsOn && lastFix ? lastFix : city; if (h && confirm("Spara din nuvarande plats som " + x[2] + "?")) s[x[0]] = { name: x[2], lat: h.lat, lon: h.lon }; } spEdit = false; spWrite(s); }
        else planRoute(v); }); });
    s.recent.forEach(function (r, i) { btn("🕘 " + r.name + (spEdit ? " ✕" : ""), "sp recent" + (spEdit ? " del" : ""), function () { if (spEdit) { s.recent.splice(i, 1); spWrite(s); } else planRoute(r); }); });
    btn(spEdit ? "Klar" : "✎", "sp edit", function () { spEdit = !spEdit; spRender(); });
  }
  spRender(); setInterval(function () { var el = $("saved"); if (el && el.hidden !== (!isMobile || navOn)) spRender(); }, 1000);

  // Lower menu card: at most two layers on at once – turning on a third switches off the oldest
  (function () {
    var IDS = ["webcams", "flights", "ships", "tr_bus", "tr_metro", "tr_tram", "tr_ferry", "tr_train", "heritage"], order = [];
    function on() { return IDS.filter(function (id) { var e = $(id); return e && e.checked; }); }
    setTimeout(function () { order = on(); while (order.length > 2) { var e = $(order.shift()); e.checked = false; if (e.onchange) e.onchange.call(e); } }, 0);
    document.addEventListener("change", function (ev) {
      var id = ev.target && ev.target.id; if (IDS.indexOf(id) < 0) return;
      var act = on(); order = order.filter(function (x) { return act.indexOf(x) >= 0 && x !== id; });
      act.forEach(function (x) { if (x !== id && order.indexOf(x) < 0) order.unshift(x); });
      if (!ev.target.checked) return;
      while (order.length >= 2) { var e = $(order.shift()); e.checked = false; if (e.onchange) e.onchange.call(e); }
      order.push(id);
    });
  })();

  // HUD (windshield) mode – mirrors the existing speed, limit, arrow and warnings
  (function () {
    var hud = $("hud"), mir = $("hudMirror"), t = null;
    mir.checked = localStorage.getItem("hud_mirror") !== "0";
    mir.addEventListener("change", function () { localStorage.setItem("hud_mirror", mir.checked ? "1" : "0"); });
    function upd() {
      var na = $("navArrow"), lim = $("speedLimit"), cw = $("camWarn"), sp = $("speedVal").textContent;
      $("hudNav").hidden = na.hidden; $("hudArrow").innerHTML = $("navArrowIco").innerHTML; $("hudDist").textContent = $("navArrowDist").textContent;
      $("hudSpeed").textContent = sp; var l = parseInt(lim.textContent, 10);
      $("hudLimit").hidden = isNaN(l); $("hudLimit").textContent = isNaN(l) ? "" : l;
      $("hudSpeed").className = "hud-speed " + (!isNaN(l) && parseInt(sp, 10) > l ? "over" : "hud-glow");
      $("hudCam").hidden = cw.hidden; $("hudCamDist").textContent = "Fartkamera " + $("camWarnDist").textContent; $("hudCam").classList.toggle("hud-warning-urgent", cw.classList.contains("speeding"));
      $("hudIce").hidden = $("iceWarn").hidden;
      $("hudAccident").hidden = $("accWarn").hidden; $("hudPolice").hidden = $("polWarn").hidden && $("phWarn").hidden;
      var symbol = $("hudPolice").querySelector("g");
      if (symbol) { symbol.setAttribute("class", $("phWarn").hidden ? "hud-police-symbol" : "police-helicopter-symbol"); symbol.innerHTML = $("phWarn").hidden ? '<rect x="46" y="35" width="8" height="25" rx="3"/><circle cx="50" cy="70" r="4"/>' : phSymbol; }
    }
    $("hudStart").addEventListener("click", function () {
      hud.style.transform = mir.checked ? "scaleX(-1)" : ""; hud.hidden = false; upd(); t = setInterval(upd, 500);
    });
    hud.addEventListener("click", function () { hud.hidden = true; if (t) { clearInterval(t); t = null; } });
  })();
})();
