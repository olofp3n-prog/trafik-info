<?php
// Buses and trains (Trafiklab GTFS Sweden 3 Realtime + Trafiklab Trips). Keys stay on the server.
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$RT = trim($TRAFIKLAB_GTFS_RT_KEY ?? ''); $API = trim($TRAFIKLAB_REALTIME_KEY ?? ''); $TV = trim($TRAFIKVERKET_API_KEY ?? ''); $VT = trim($VASTTRAFIK_AUTH ?? '');
function out($a) { echo json_encode($a); exit; }
if ($RT === '' && $TV === '' && $VT === '') out(['vehicles' => [], 'error' => 'Trafiklab-nyckel saknas i config.php']);

$tmp = sys_get_temp_dir();
$tripFile = $tmp . '/tl_trips.json';
$trips = is_file($tripFile) ? (json_decode(@file_get_contents($tripFile), true) ?: []) : [];
$tripsChanged = false;

function http($url, $gzip = false) {
  $ch = curl_init($url);
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_ENCODING => $gzip ? 'gzip' : '', CURLOPT_USERAGENT => 'meteo-traffic']);
  $body = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return [$code, $body];
}

// ---- Minimal protobuf reader (GTFS-RT VehiclePositions) ----
function pv($b, &$p) { $r = 0; $s = 1; do { $x = ord($b[$p++]); $r += ($x & 127) * $s; $s *= 128; } while ($x & 128); return $r; }
function pskip($b, &$p, $wt) { if ($wt == 0) pv($b, $p); elseif ($wt == 1) $p += 8; elseif ($wt == 2) { $n = pv($b, $p); $p += $n; } elseif ($wt == 5) $p += 4; else throw new Exception('pb'); }
function pfields($b, $p, $end, $fn) { while ($p < $end) { $k = pv($b, $p); $f = intdiv($k, 8); $wt = $k & 7;
  if ($wt == 2) { $n = pv($b, $p); $fn($f, $wt, $p, $p + $n); $p += $n; }
  elseif ($wt == 5) { $fn($f, $wt, $p, $p + 4); $p += 4; }
  else pskip($b, $p, $wt); } }
function decode($b) {
  $out = [];
  pfields($b, 0, strlen($b), function ($f, $wt, $s, $e) use ($b, &$out) {
    if ($f != 2 || $wt != 2) return;
    $v = null; $eid = '';
    pfields($b, $s, $e, function ($f2, $w2, $s2, $e2) use ($b, &$v, &$eid) {
      if ($f2 == 1 && $w2 == 2) { $eid = substr($b, $s2, $e2 - $s2); return; }
      if ($f2 != 4 || $w2 != 2) return;
      $r = ['id' => '', 'tripId' => '', 'startDate' => '', 'lat' => null, 'lon' => null, 'bearing' => 0, 'speed' => null];
      pfields($b, $s2, $e2, function ($f3, $w3, $s3, $e3) use ($b, &$r) {
        if ($w3 != 2) return;
        if ($f3 == 1) pfields($b, $s3, $e3, function ($f4, $w4, $a, $z) use ($b, &$r) { if ($w4 != 2) return; if ($f4 == 1) $r['tripId'] = substr($b, $a, $z - $a); if ($f4 == 3) $r['startDate'] = substr($b, $a, $z - $a); });
        if ($f3 == 2) pfields($b, $s3, $e3, function ($f4, $w4, $a, $z) use ($b, &$r) { if ($w4 != 5) return; $x = unpack('g', substr($b, $a, 4))[1];
          if ($f4 == 1) $r['lat'] = $x; elseif ($f4 == 2) $r['lon'] = $x; elseif ($f4 == 3) $r['bearing'] = $x; elseif ($f4 == 5) $r['speed'] = $x; });
        if ($f3 == 8) pfields($b, $s3, $e3, function ($f4, $w4, $a, $z) use ($b, &$r) { if ($f4 == 1 && $w4 == 2) $r['id'] = substr($b, $a, $z - $a); });
      });
      $v = $r;
    });
    if ($v && $v['lat'] !== null) { if ($v['id'] === '') $v['id'] = $eid; $out[] = $v; }
  });
  return $out;
}

function modeOf($m) {
  switch (strtoupper((string)$m)) {
    case 'BUS': case 'COACH': return 'bus';
    case 'TRAIN': case 'RAIL': return 'train';
    case 'METRO': case 'SUBWAY': return 'metro';
    case 'TRAM': return 'tram';
    case 'FERRY': case 'BOAT': case 'WATER': return 'ferry';
    default: return 'unknown';
  }
}
function isoDate($d) { if ($d === '') { $t = new DateTime('now', new DateTimeZone('Europe/Stockholm')); return $t->format('Y-m-d'); } return strlen($d) == 8 ? substr($d, 0, 4) . '-' . substr($d, 4, 2) . '-' . substr($d, 6) : $d; }

// ---- Trafikverket: national train positions (all of Sweden) ----
function tvQuery($q) {
  global $TV;
  $ch = curl_init('https://api.trafikinfo.trafikverket.se/v2/data.json');
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_POST => true, CURLOPT_HTTPHEADER => ['Content-Type: text/xml'],
    CURLOPT_POSTFIELDS => '<REQUEST><LOGIN authenticationkey="' . htmlspecialchars($TV) . '"/>' . $q . '</REQUEST>']);
  $body = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  if ($code != 200) return null;
  $j = json_decode($body, true);
  return $j['RESPONSE']['RESULT'][0] ?? [];
}
function tvStations() {
  $f = sys_get_temp_dir() . '/tv_stations.json';
  if (is_file($f) && time() - filemtime($f) < 86400) return json_decode(file_get_contents($f), true) ?: [];
  $r = tvQuery('<QUERY objecttype="TrainStation" namespace="rail.infrastructure" schemaversion="1.5"><INCLUDE>LocationSignature</INCLUDE><INCLUDE>AdvertisedLocationName</INCLUDE></QUERY>');
  $m = []; foreach (($r['TrainStation'] ?? []) as $st) $m[$st['LocationSignature']] = $st['AdvertisedLocationName'];
  if ($m) @file_put_contents($f, json_encode($m));
  return $m;
}
function tvTrains($s, $w, $n, $e) {
  $box = sprintf('%.3f %.3f, %.3f %.3f', $w, $s, $e, $n);
  $r = tvQuery('<QUERY objecttype="TrainPosition" namespace="järnväg.trafikinfo" schemaversion="1.1" limit="400"><FILTER><AND><GT name="TimeStamp" value="$dateadd(-0.00:10:00)"/><WITHIN name="Position.WGS84" shape="box" value="' . $box . '"/></AND></FILTER></QUERY>');
  if ($r === null) return null;
  $out = [];
  foreach (($r['TrainPosition'] ?? []) as $p) {
    if (!preg_match('/POINT \(([-\d.]+) ([-\d.]+)\)/', $p['Position']['WGS84'] ?? '', $m)) continue;
    $num = (string)($p['Train']['AdvertisedTrainNumber'] ?? $p['Train']['OperationalTrainNumber'] ?? '');
    if ($num === '') continue;
    $out[] = ['id' => 'tv-' . $num, 'tripId' => 'tv:' . $num, 'startDate' => substr((string)($p['Train']['JourneyPlanDepartureDate'] ?? ''), 0, 10),
      'lat' => (float)$m[2], 'lon' => (float)$m[1], 'bearing' => $p['Bearing'] ?? 0, 'speed' => isset($p['Speed']) ? $p['Speed'] / 3.6 : null,
      'line' => $num, 'mode' => 'train', 'headsign' => null];
  }
  return $out;
}
function tvTrip($num) {
  $num = preg_replace('/\D/', '', $num);
  $r = tvQuery('<QUERY objecttype="TrainAnnouncement" schemaversion="1.9" orderby="AdvertisedTimeAtLocation"><FILTER><AND><EQ name="AdvertisedTrainIdent" value="' . $num . '"/><EQ name="Advertised" value="true"/><GT name="AdvertisedTimeAtLocation" value="$dateadd(-0.14:00:00)"/><LT name="AdvertisedTimeAtLocation" value="$dateadd(0.14:00:00)"/></AND></FILTER></QUERY>');
  $a = $r['TrainAnnouncement'] ?? [];
  if (!$a) return null;
  $names = tvStations();
  $nm = function ($x) use ($names) { return $names[$x['LocationSignature']] ?? $x['LocationSignature']; };
  $tm = function ($x) { return substr(preg_replace('/\.\d+/', '', (string)($x['EstimatedTimeAtLocation'] ?? $x['AdvertisedTimeAtLocation'] ?? '')), 0, 19); };
  $dep = array_values(array_filter($a, function ($x) { return ($x['ActivityType'] ?? '') === 'Avgang'; }));
  $arr = array_values(array_filter($a, function ($x) { return ($x['ActivityType'] ?? '') === 'Ankomst'; }));
  $first = $dep[0] ?? $a[0]; $last = $arr ? $arr[count($arr) - 1] : $a[count($a) - 1]; $next = null;
  foreach ($a as $x) if (empty($x['TimeAtLocation'])) { $next = $x; break; }
  $to = $a[0]['ToLocation'][0]['LocationName'] ?? null;
  $prod = $a[0]['ProductInformation'][0]['Description'] ?? '';
  return ['line' => $num, 'mode' => 'train', 'name' => $prod, 'direction' => $to ? ($names[$to] ?? $to) : $nm($last),
    'agency' => implode(' · ', array_filter([$prod, $a[0]['Operator'] ?? ''])),
    'from' => ['name' => $nm($first), 'time' => $tm($first)], 'to' => ['name' => $nm($last), 'time' => $tm($last)],
    'next' => $next ? ['name' => $nm($next), 'time' => $tm($next)] : null];
}

// ---- Västtrafik Planera Resa v4 (token cached on the server) ----
function vtGet($path, &$code = null) {
  global $VT;
  $tf = sys_get_temp_dir() . '/vt_token.json';
  $tok = is_file($tf) ? json_decode(file_get_contents($tf), true) : null;
  if (!$tok || time() > $tok['until']) {
    $ch = curl_init('https://ext-api.vasttrafik.se/token');
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 6, CURLOPT_POST => true, CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
      CURLOPT_HTTPHEADER => ['Authorization: Basic ' . $VT, 'Content-Type: application/x-www-form-urlencoded']]);
    $j = json_decode(curl_exec($ch), true); curl_close($ch);
    if (empty($j['access_token'])) { $code = 401; return null; }
    $tok = ['value' => $j['access_token'], 'until' => time() + (int)($j['expires_in'] ?? 3600) - 60];
    @file_put_contents($tf, json_encode($tok));
  }
  $ch = curl_init('https://ext-api.vasttrafik.se/pr/v4' . $path);
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $tok['value']]]);
  $body = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return $code == 200 ? json_decode($body, true) : null;
}
function vtVehicles($s, $w, $n, $e, $modes, &$err) {
  global $VT;
  $want = array_values(array_intersect($modes, ['bus', 'tram', 'ferry', 'train']));
  if ($VT === '' || !$want || 57.1 > $n || 59.3 < $s || 11.0 > $e || 14.6 < $w) return [];
  $q = "lowerLeftLat=$s&lowerLeftLong=$w&upperRightLat=$n&upperRightLong=$e&limit=200";
  foreach ($want as $m) $q .= '&transportModes=' . $m;
  $arr = vtGet('/positions?' . $q, $code);
  if ($arr === null) { $err = $code == 403 ? 'Västtrafik nekar åtkomst (prenumerera på Planera Resa v4)' : "Kunde inte ladda Västtrafik (fel $code)"; return []; }
  $out = [];
  foreach ($arr as $v) { if (!isset($v['latitude'], $v['detailsReference'])) continue;
    $out[] = ['id' => 'vt-' . $v['detailsReference'], 'tripId' => 'vt:' . $v['detailsReference'], 'startDate' => '', 'lat' => $v['latitude'], 'lon' => $v['longitude'],
      'bearing' => 0, 'speed' => null, 'line' => $v['line']['name'] ?? null, 'mode' => modeOf($v['line']['transportMode'] ?? ''), 'headsign' => $v['direction'] ?? null]; }
  return $out;
}
function vtTrip($ref) {
  $j = vtGet('/journeys/' . rawurlencode($ref) . '/details?includes=servicejourneycalls');
  $sj = $j['serviceJourneys'][0] ?? null; if (!$sj) return null;
  $calls = $sj['callsOnServiceJourney'] ?? [];
  $t = function ($c) { return substr((string)($c['estimatedDepartureTime'] ?? $c['plannedDepartureTime'] ?? $c['estimatedArrivalTime'] ?? $c['plannedArrivalTime'] ?? ''), 0, 19); };
  $first = $calls[0] ?? null; $last = $calls ? $calls[count($calls) - 1] : null; $next = null; $now = time();
  foreach ($calls as $c) if (strtotime($t($c)) > $now) { $next = $c; break; }
  return ['line' => $sj['line']['name'] ?? '', 'mode' => modeOf($sj['line']['transportMode'] ?? ''), 'name' => $sj['line']['name'] ?? '', 'direction' => $sj['direction'] ?? '', 'agency' => 'Västtrafik',
    'from' => $first ? ['name' => $first['stopPoint']['name'] ?? '', 'time' => $t($first)] : null, 'to' => $last ? ['name' => $last['stopPoint']['name'] ?? '', 'time' => $t($last)] : null,
    'next' => $next ? ['name' => $next['stopPoint']['name'] ?? '', 'time' => $t($next)] : null];
}

function lookupTrip($tripId, $startDate) {
  global $API, $trips, $tripsChanged;
  $k = $tripId . '/' . $startDate;
  if (array_key_exists($k, $trips)) return $trips[$k];
  if (strpos($tripId, 'vt:') === 0) { $info = vtTrip(substr($tripId, 3)); if ($info) { $trips[$k] = $info; $tripsChanged = true; } return $info; }
  if (strpos($tripId, 'tv:') === 0) { $info = tvTrip(substr($tripId, 3)); if ($info) { $trips[$k] = $info; $tripsChanged = true; } return $info; }
  if ($API === '') return null;
  [$code, $body] = http('https://realtime-api.trafiklab.se/v1/trips/' . rawurlencode($tripId) . '/' . isoDate($startDate) . '?key=' . rawurlencode($API));
  if ($code == 404) { $trips[$k] = null; $tripsChanged = true; return null; }
  $j = $code == 200 ? json_decode($body, true) : null;
  if (!$j) return null;
  $calls = $j['calls'] ?? [];
  $t = function ($c, $dep) { return $dep ? ($c['realtimeDeparture'] ?? $c['scheduledDeparture'] ?? '') : ($c['realtimeArrival'] ?? $c['scheduledArrival'] ?? ''); };
  $now = (new DateTime('now', new DateTimeZone('Europe/Stockholm')))->format('Y-m-d\TH:i:s');
  $first = $calls[0] ?? null; $last = $calls ? $calls[count($calls) - 1] : null; $next = null;
  foreach ($calls as $c) if ($t($c, false) > $now || $t($c, true) > $now) { $next = $c; break; }
  $info = [
    'line' => (string)($j['route']['designation'] ?? ''), 'mode' => modeOf($j['route']['transport_mode'] ?? ''),
    'name' => $j['route']['name'] ?? '', 'direction' => $j['route']['direction'] ?? ($j['route']['destination']['name'] ?? ''), 'agency' => $j['agency']['name'] ?? '',
    'from' => $first ? ['name' => $first['stop']['name'] ?? '', 'time' => $t($first, true)] : null,
    'to' => $last ? ['name' => $last['stop']['name'] ?? '', 'time' => $t($last, false)] : null,
    'next' => $next ? ['name' => $next['stop']['name'] ?? '', 'time' => $t($next, false) ?: $t($next, true)] : null,
  ];
  $trips[$k] = $info; $tripsChanged = true;
  return $info;
}
function saveTrips() { global $trips, $tripsChanged, $tripFile; if (!$tripsChanged) return; if (count($trips) > 20000) $trips = array_slice($trips, -10000, null, true); @file_put_contents($tripFile, json_encode($trips)); }

if (($_GET['trip'] ?? '') !== '') {
  $id = substr(preg_replace('/[^0-9A-Za-z_:\-.]/', '', $_GET['trip']), 0, 64);
  $sd = substr(preg_replace('/[^0-9\-]/', '', $_GET['date'] ?? ''), 0, 10);
  $info = lookupTrip($id, $sd); saveTrips(); out(['trip' => $info]);
}

function num($k) { return isset($_GET[$k]) && is_numeric($_GET[$k]) ? (float)$_GET[$k] : null; }
$s = num('s'); $w = num('w'); $n = num('n'); $e = num('e');
if ($s === null || $w === null || $n === null || $e === null || $s < -90 || $n > 90 || $w < -180 || $e > 180) out(['vehicles' => [], 'error' => 'Ogiltigt område']);

$OPS = ['sl' => [58.7, 17.2, 60.3, 19.4], 'ul' => [59.3, 16.6, 60.8, 18.6], 'otraf' => [57.7, 14.4, 58.9, 17.0],
  'jlt' => [57.1, 13.5, 58.2, 15.6], 'krono' => [56.4, 13.4, 57.3, 15.6], 'klt' => [56.2, 15.3, 58.0, 17.2],
  'gotland' => [56.8, 17.9, 58.5, 19.4], 'blekinge' => [56.0, 14.4, 56.6, 16.1], 'skane' => [55.3, 12.4, 56.5, 14.6],
  'halland' => [56.3, 11.8, 57.7, 13.6], 'varm' => [58.8, 11.6, 61.0, 14.5], 'orebro' => [58.7, 14.3, 59.9, 15.8],
  'vastmanland' => [59.2, 15.4, 60.2, 16.9], 'dt' => [60.0, 12.1, 62.3, 16.8], 'xt' => [60.2, 14.5, 62.3, 17.6], 'dintur' => [62.0, 14.9, 64.0, 19.4]];
$modes = array_values(array_intersect(explode(',', (string)($_GET['modes'] ?? 'bus,train')), ['bus', 'metro', 'tram', 'ferry', 'train']));
$useTv = $TV !== '' && in_array('train', $modes);
$tvList = $useTv ? tvTrains($s, $w, $n, $e) : [];
$needTl = $RT !== '' && count(array_diff($modes, $useTv ? ['train'] : [])) > 0;
$ops = [];
if ($needTl) foreach ($OPS as $op => $bb) if ($bb[0] <= $n && $bb[2] >= $s && $bb[1] <= $e && $bb[3] >= $w) $ops[] = $op;
$ops = array_slice($ops, 0, 4);
$all = []; $failed = 0; $last = 0;
foreach ($ops as $op) {
  $cf = $tmp . '/tl_vp_' . $op . '.bin';
  if (is_file($cf) && time() - filemtime($cf) < 10) { $body = file_get_contents($cf); }
  else {
    [$code, $body] = http('https://opendata.samtrafiken.se/gtfs-rt-sweden/' . $op . '/VehiclePositionsSweden.pb?key=' . rawurlencode($RT), true);
    if ($code != 200) { $failed++; $last = $code; continue; }
    @file_put_contents($cf, $body);
  }
  try { $all = array_merge($all, decode($body)); } catch (Exception $ex) { $failed++; }
}
$in = [];
foreach ($all as $v) if ($v['tripId'] !== '' && $v['lat'] >= $s && $v['lat'] <= $n && $v['lon'] >= $w && $v['lon'] <= $e) { $in[] = $v; if (count($in) >= 400) break; }
$looked = 0;
foreach ($in as &$v) {
  $k = $v['tripId'] . '/' . $v['startDate'];
  if (!array_key_exists($k, $trips) && $looked < 30) { lookupTrip($v['tripId'], $v['startDate']); $looked++; }
  $ti = $trips[$k] ?? null;
  $v['line'] = $ti['line'] ?? null; $v['mode'] = $ti['mode'] ?? 'unknown'; $v['headsign'] = $ti['direction'] ?? null;
}
unset($v);
$in = array_values(array_filter($in, function ($v) use ($modes, $useTv) { return in_array($v['mode'], $modes) && !($useTv && $v['mode'] === 'train'); }));
$vtErr = null;
foreach (vtVehicles($s, $w, $n, $e, $useTv ? array_diff($modes, ['train']) : $modes, $vtErr) as $v) if (in_array($v['mode'], $modes)) $in[] = $v;
foreach (($tvList ?: []) as $v) { $ti = $trips[$v['tripId'] . '/' . $v['startDate']] ?? null; $v['headsign'] = $ti['direction'] ?? null; $in[] = $v; }
saveTrips();
if ($vtErr && !$in) out(['vehicles' => [], 'error' => $vtErr]);
if ($useTv && $tvList === null && !$in) out(['vehicles' => [], 'error' => 'Kunde inte ladda tåg från Trafikverket']);
out(['vehicles' => $in, 'error' => ($ops && $failed == count($ops)) ? ($last == 401 || $last == 403 ? 'Trafiklab nekar nyckeln (GTFS Sweden 3 Realtime-nyckel krävs)' : ($last == 429 ? 'Trafiklabs anropsgräns nådd, försök senare' : 'Kunde inte ladda kollektivtrafik' . ($last ? " (fel $last)" : ' (servern når inte Trafiklab)'))) : null]);
