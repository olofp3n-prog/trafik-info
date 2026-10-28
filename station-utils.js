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
