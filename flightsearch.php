<?php
// Global aircraft search by callsign, registration or ICAO hex (adsb.lol, adsb.fi fallback).
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$q = strtoupper(preg_replace('/[^A-Za-z0-9-]/', '', $_GET['q'] ?? ''));
$hexOnly = !empty($_GET['hex']);
if (strlen($q) < 2 || strlen($q) > 12) { echo '{"states":[]}'; exit; }
function getAc($p) {
  foreach (["https://api.adsb.lol/v2$p", "https://opendata.adsb.fi/api/v2$p"] as $u) {
    $ch = curl_init($u);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 6, CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4, CURLOPT_USERAGENT => 'meteo-traffic']);
    $r = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    if ($r && $code == 200) { $j = json_decode($r, true); return $j['ac'] ?? $j['aircraft'] ?? []; }
  }
  return [];
}
$paths = [];
if ($hexOnly) $paths[] = '/hex/' . strtolower($q);
else {
  $paths[] = '/callsign/' . $q;
  $reg = strpos($q, '-') !== false ? $q : preg_replace('/^([A-Z]{1,2})([A-Z0-9]{3,})$/', '$1-$2', $q);
  $paths[] = '/reg/' . $reg;
  if (preg_match('/^[0-9A-F]{6}$/', $q)) $paths[] = '/hex/' . strtolower($q);
}
$out = []; $seen = [];
foreach ($paths as $p) foreach (getAc($p) as $a) {
  $lat = $a['lat'] ?? ($a['lastPosition']['lat'] ?? null); $lon = $a['lon'] ?? ($a['lastPosition']['lon'] ?? null);
  if ($lat === null || $lon === null || isset($seen[$a['hex']])) continue;
  $seen[$a['hex']] = 1;
  $ft = is_numeric($a['alt_geom'] ?? null) ? $a['alt_geom'] : (is_numeric($a['alt_baro'] ?? null) ? $a['alt_baro'] : null);
  $m = $ft !== null ? $ft * 0.3048 : null;
  $heli = ($a['category'] ?? '') === 'A7' || preg_match('/^[HG]/', $a['desc'] ?? '');
  $mil = (($a['dbFlags'] ?? 0) & 1) === 1 ? 1 : 0;
  $out[] = [$a['hex'], trim($a['flight'] ?? ($a['r'] ?? $a['hex'])), null, null, null, $lon, $lat, $m, ($a['alt_baro'] ?? '') === 'ground',
    isset($a['gs']) ? $a['gs'] * 0.5144 : null, $a['track'] ?? ($a['true_heading'] ?? 0), null, null, $m, null, null, null,
    $heli ? 8 : 0, $a['t'] ?? null, $heli ? 3 : 2, $a['r'] ?? null, $mil];
  if (count($out) >= 10) break 2;
}
echo json_encode(['states' => $out]);
