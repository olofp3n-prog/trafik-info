<?php
function isMilT($t){ return (bool)preg_match('/^(JS39|GRIF|EUFI|F16|F35|F18|FA18|F15|F22|TOR|RFAL|M2000|C130|C30J|C17|C5M?|A400|K35R|KC\d|A332K|MRTT|E3TF|E3CF|E737|P8|RC135|U2|GLF4M|C295|CN35|HAWK|PC21|SK60|S100B|UH60|H60|NH90|EH10|CH47|AH64|TIGR|KOAL)$/i', (string)$t); }
function isMil($a){ return ((int)($a['dbFlags'] ?? 0) & 1) === 1 || isMilT($a['t'] ?? ''); }
// Flight proxy: OpenSky + adsb.lol fetched in parallel and merged (OpenSky misses low traffic).
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function num($k) { return isset($_GET[$k]) && is_numeric($_GET[$k]) ? (float)$_GET[$k] : null; }
$s = num('s'); $w = num('w'); $n = num('n'); $e = num('e');
if ($s === null || $w === null || $n === null || $e === null || $s < -90 || $n > 90 || $w < -180 || $e > 180) { echo json_encode(['states' => [], 'error' => 'Ogiltigt område']); exit; }
$lat = ($s + $n) / 2; $lon = ($w + $e) / 2;
$nm = (int)min(250, max(5, round(max($n - $s, ($e - $w) * cos(deg2rad($lat))) * 60 / 2 * 1.42)));
$urls = [
  'os' => sprintf('https://opensky-network.org/api/states/all?lamin=%.3f&lomin=%.3f&lamax=%.3f&lomax=%.3f&extended=1', $s, $w, $n, $e),
  'ad' => sprintf('https://api.adsb.lol/v2/lat/%.3f/lon/%.3f/dist/%d', $lat, $lon, $nm),
  'fi' => sprintf('https://opendata.adsb.fi/api/v2/lat/%.3f/lon/%.3f/dist/%d', $lat, $lon, $nm),
];
function getJson($u, $t = 5) { $h = curl_init($u); curl_setopt_array($h, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $t, CURLOPT_CONNECTTIMEOUT => 3, CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4, CURLOPT_FOLLOWLOCATION => true, CURLOPT_USERAGENT => 'meteo-traffic']);
  $b = curl_exec($h); $c = curl_getinfo($h, CURLINFO_HTTP_CODE); curl_close($h); return $c === 200 ? json_decode($b, true) : null; }
// adsb.lol answers in ~0.1 s; OpenSky (often 5-8 s) only as fallback.
$res = ['ad' => getJson($urls['ad']), 'os' => null];
if (!$res['ad']) { $fi = getJson($urls['fi']); if ($fi) { if (!isset($fi['ac']) && isset($fi['aircraft'])) $fi['ac'] = $fi['aircraft']; $res['ad'] = $fi; } }
if (!$res['ad']) $res['os'] = getJson($urls['os'], 6);
if (!$res['os'] && !$res['ad']) { echo json_encode(['states' => [], 'error' => 'Kunde inte ladda flyg']); exit; }
$S1 = '/^(A38|A35|A34|A33|A30|A310|B74|B77|B78|B76|B75|IL76|AN12|AN22|A124|A225|C17|C5|A400|KC|MD11|DC10)/i';
$S2 = '/^(A31|A32|A2\d|BCS|B73|B3\d|B71|B72|E17|E19|E27|E29|E75|E70|CRJ9|CRJX|SU95|C130|C30J|S92|EH10|EC25|EC22|AS32|AS33|H225|H215|H60|UH60|NH90|A189|MI8|CH47)/i';
$S3 = '/^(AT\d|DH8|SF34|SB20|JS\d|F50|F70|F100|D328|E1[2-4]\d|E135|E145|CRJ|LJ|C25|C5\d|C68|C700|GLF|GLEX|CL\d|FA\d|F2TH|F900|PC12|PC24|BE20|BE30|BE35|BE9|B350|H25|PRM|EC35|EC45|EC55|EC65|H135|H145|H160|H175|AW1|A139|A169|A109|A119|B412|B429|B407|B212|S76|BK17|AS65|AS50|AS35|AS55|MD9)/i';
function rotorSize($t) { $t = (string)($t ?? '');
  if (preg_match('/^(S92|S61|NH90|H225|H215|EC25|EC22|AS32|AS33|H60|UH60|MI8|CH47|EH10|A189)/i', $t)) return 2;
  if (preg_match('/^(R22|R44|R66|CABR|G2CA|MT|MTO|B06|EC20|EC30|AS50|AS35|H125|H120|ELIT|UH1)/i', $t)) return 4; return 3; }
function flightSize($t, $cat, $os, $heli = false) { global $S1, $S2, $S3; if ($heli) return rotorSize($t);
  $cs = ['A1'=>4,'A2'=>3,'A3'=>2,'A4'=>1,'A5'=>1,'A6'=>3,'A7'=>4,'B1'=>4,'B2'=>4,'B4'=>4,'B6'=>4]; $oc = [2=>4,3=>3,4=>2,5=>1,6=>1,7=>3,8=>4,9=>4,12=>4];
  $t = (string)($t ?? '');
  if ($t !== '') { if (preg_match($S1, $t)) return 1; if (preg_match($S2, $t)) return 2; if (preg_match($S3, $t)) return 3; }
  if ($cat && isset($cs[$cat])) return $cs[$cat];
  if (is_int($os) && isset($oc[$os])) return $oc[$os];
  return $t !== '' ? 4 : 2; }
$map = [];
foreach (($res['os']['states'] ?? []) as $st) $map[strtolower($st[0])] = $st;
$rot = '/^(MT|MTO|R22|R44|R66|EC\d|B06|B407|B429|A109|A119|A139|A169|AW\d|H1\d\d|AS3\d|AS50|S76|S92|NH90|UH|BK17|MD\d|CABR|G2CA|ELIT)/i';
foreach (($res['ad']['ac'] ?? []) as $a) {
  $pl = $a['lat'] ?? null; $po = $a['lon'] ?? null;
  if (($pl === null || $po === null) && isset($a['lastPosition']) && ($a['lastPosition']['seen_pos'] ?? 999) < 120) { $pl = $a['lastPosition']['lat']; $po = $a['lastPosition']['lon']; }
  if ($pl === null || $po === null || $pl < $s || $pl > $n || $po < $w || $po > $e) continue;
  $c = $a['category'] ?? '';
  $heli = ($c === 'A7' || $c === 'B4' || preg_match('/^[HG]/', $a['desc'] ?? '') || preg_match($rot, $a['t'] ?? '')) ? 8 : 0;
  $k = strtolower($a['hex']);
  if (isset($map[$k])) { if ($heli) $map[$k][17] = 8; if (empty($map[$k][18]) && !empty($a['t'])) $map[$k][18] = $a['t']; $map[$k][19] = flightSize($a['t'] ?? $map[$k][18], $c, null, $map[$k][17] === 8); $map[$k][20] = $a['r'] ?? null; $map[$k][21] = isMil($a) ? 1 : 0; continue; }
  $ft = is_numeric($a['alt_geom'] ?? null) ? $a['alt_geom'] : (is_numeric($a['alt_baro'] ?? null) ? $a['alt_baro'] : null);
  $m = $ft !== null ? $ft * 0.3048 : null;
  $map[$k] = [$a['hex'], trim($a['flight'] ?? $a['r'] ?? $a['hex']), null, null, null, $po, $pl, $m, ($a['alt_baro'] ?? '') === 'ground',
    isset($a['gs']) ? $a['gs'] * 0.5144 : null, $a['track'] ?? ($a['true_heading'] ?? 0), null, null, $m, null, null, null, $heli, $a['t'] ?? null, flightSize($a['t'] ?? null, $c, null, $heli === 8), $a['r'] ?? null, isMil($a) ? 1 : 0];
}
foreach ($map as $k => $v) { if (!isset($v[19])) $map[$k][19] = flightSize($v[18] ?? null, null, $v[17] ?? null, ($v[17] ?? 0) === 8); if (!isset($v[21])) $map[$k][21] = isMilT($v[18] ?? '') ? 1 : 0; }
echo json_encode(['states' => array_values($map), 'error' => null]);
