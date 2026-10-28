<?php
// Speed limit (Trafikverket NVDB "Hastighetsgräns") for the road nearest a point. Key stays on the server.
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$TV = trim($TRAFIKVERKET_API_KEY ?? '');
$lat = floatval($_GET['lat'] ?? 0); $lon = floatval($_GET['lon'] ?? 0);
$h = isset($_GET['h']) && $_GET['h'] !== '' ? floatval($_GET['h']) : null;
function segScore($pts, $h) { $best = INF;
  for ($i = 0; $i + 1 < count($pts); $i++) {
    $ax = $pts[$i][0]; $ay = $pts[$i][1]; $dx = $pts[$i + 1][0] - $ax; $dy = $pts[$i + 1][1] - $ay; $l2 = $dx * $dx + $dy * $dy;
    if (!$l2) continue;
    $t = max(0, min(1, -($ax * $dx + $ay * $dy) / $l2)); $s = hypot($ax + $t * $dx, $ay + $t * $dy);
    if ($h !== null) { $sb = fmod(rad2deg(atan2($dx, $dy)) + 360, 180); $diff = abs($sb - fmod($h, 180)); if ($diff > 90) $diff = 180 - $diff; $s += $diff > 40 ? 1000 : $diff * 0.4; }
    $best = min($best, $s);
  } return $best; }
// OpenStreetMap maxspeed via Overpass – used outside Sweden
function osmLimit($lat, $lon, $h) {
  $q = '[out:json][timeout:5];way(around:35,' . $lat . ',' . $lon . ')[highway][maxspeed];out tags geom;';
  $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/x-www-form-urlencoded\r\nUser-Agent: meteo-traffic\r\n", 'content' => 'data=' . urlencode($q), 'timeout' => 6, 'ignore_errors' => true]]);
  $r = @file_get_contents('https://overpass-api.de/api/interpreter', false, $ctx);
  $j = $r ? json_decode($r, true) : null; $kx = cos(deg2rad($lat)); $M = 111320; $best = null;
  foreach (($j['elements'] ?? []) as $w) {
    if (!preg_match('/^(\d+)\s*(mph)?$/i', trim($w['tags']['maxspeed'] ?? ''), $m)) continue;
    $limit = !empty($m[2]) ? (int) round($m[1] * 1.609) : (int) $m[1];
    $pts = array_map(function ($g) use ($lat, $lon, $kx, $M) { return [($g['lon'] - $lon) * $kx * $M, ($g['lat'] - $lat) * $M]; }, $w['geometry'] ?? []);
    $s = segScore($pts, $h);
    if ($best === null || $s < $best[1]) $best = [$limit, $s];
  }
  return $best ? $best[0] : null;
}
$inSweden = $lat >= 55 && $lat <= 69.1 && $lon >= 10.9 && $lon <= 24.2;
if ($TV === '' || !$inSweden || ($_GET['se'] ?? '1') === '0') { echo json_encode(['limit' => osmLimit($lat, $lon, $h)]); exit; }
$q = '<REQUEST><LOGIN authenticationkey="' . htmlspecialchars($TV) . '"/><QUERY namespace="vägdata.nvdb_dk_o" objecttype="Hastighetsgräns" schemaversion="1.4" limit="20"><FILTER><NEAR name="Geometry.WKT-WGS84-3D" value="' . $lon . ' ' . $lat . '" maxdistance="40m"/></FILTER><INCLUDE>Högsta_tillåtna_hastighet</INCLUDE><INCLUDE>Geometry.WKT-WGS84-3D</INCLUDE></QUERY></REQUEST>';
$ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: text/xml\r\n", 'content' => $q, 'timeout' => 6, 'ignore_errors' => true]]);
$r = @file_get_contents('https://api.trafikinfo.trafikverket.se/v2/data.json', false, $ctx);
$j = $r ? json_decode($r, true) : null;
$rows = $j['RESPONSE']['RESULT'][0]['Hastighetsgräns'] ?? [];
$h = isset($_GET['h']) && $_GET['h'] !== '' ? floatval($_GET['h']) : null;
$prev = isset($_GET['prev']) && $_GET['prev'] !== '' ? intval($_GET['prev']) : null;
$kx = cos(deg2rad($lat)); $M = 111320; $cands = [];
foreach ($rows as $row) {
  $limit = intval($row['Högsta_tillåtna_hastighet'] ?? 0); if (!$limit) continue;
  preg_match_all('/(-?\d+\.\d+) (-?\d+\.\d+)/', $row['Geometry']['WKT-WGS84-3D'] ?? '', $m, PREG_SET_ORDER);
  $pts = array_map(function ($p) use ($lon, $lat, $kx, $M) { return [($p[1] - $lon) * $kx * $M, ($p[2] - $lat) * $M]; }, $m);
  for ($i = 0; $i + 1 < count($pts); $i++) {
    $ax = $pts[$i][0]; $ay = $pts[$i][1]; $dx = $pts[$i + 1][0] - $ax; $dy = $pts[$i + 1][1] - $ay; $l2 = $dx * $dx + $dy * $dy;
    if (!$l2) continue;
    $t = max(0, min(1, -($ax * $dx + $ay * $dy) / $l2));
    $dist = hypot($ax + $t * $dx, $ay + $t * $dy); $pen = 0;
    if ($h !== null) { $sb = fmod(rad2deg(atan2($dx, $dy)) + 360, 180); $diff = abs($sb - fmod($h, 180)); if ($diff > 90) $diff = 180 - $diff; $pen = $diff > 40 ? 1000 : $diff * 0.4; }
    $cands[] = ['limit' => $limit, 'score' => $dist + $pen];
  }
}
usort($cands, function ($a, $b) { return $a['score'] <=> $b['score']; });
$best = $cands ? $cands[0]['limit'] : osmLimit($lat, $lon, $h);
echo json_encode(['limit' => $best]);
