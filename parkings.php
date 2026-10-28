<?php
// Official rest areas in Sweden from Trafikverket (Parking). Key stays on the server.
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');
$TV = trim($TRAFIKVERKET_API_KEY ?? '');
if ($TV === '') { echo '{"items":[]}'; exit; }
$cf = sys_get_temp_dir() . '/mt_parkings.json';
if (is_file($cf) && time() - filemtime($cf) < 43200) { readfile($cf); exit; }
$q = '<REQUEST><LOGIN authenticationkey="' . htmlspecialchars($TV) . '"/><QUERY objecttype="Parking" schemaversion="1.4" limit="1000"/></REQUEST>';
$ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: text/xml\r\n", 'content' => $q, 'timeout' => 10, 'ignore_errors' => true]]);
$r = @file_get_contents('https://api.trafikinfo.trafikverket.se/v2/data.json', false, $ctx);
$j = $r ? json_decode($r, true) : null;
if (!$j) { if (is_file($cf)) readfile($cf); else echo '{"items":[]}'; exit; }
$items = [];
foreach ($j['RESPONSE']['RESULT'][0]['Parking'] ?? [] as $p) {
  if (!empty($p['Deleted'])) continue;
  if (!preg_match('/POINT \(([-\d.]+) ([-\d.]+)\)/', $p['Geometry']['WGS84'] ?? '', $m)) continue;
  $eq = [];
  foreach ($p['Equipment'] ?? [] as $e) {
    $t = $e['Type'] ?? '';
    if ($t === 'toilet') $eq[] = (($e['Accessibility'] ?? '') === 'handicappedAccessible') ? 'Handikapptoalett' : 'Toalett';
    elseif ($t === 'playground') $eq[] = 'Lekplats';
    elseif ($t === 'picnicFacilities') $eq[] = 'Picknickbord';
    elseif ($t === 'refuseBin') $eq[] = 'Papperskorg';
    elseif ($t === 'latrineEmptying') $eq[] = 'Latrintömning';
    elseif ($t === 'shower') $eq[] = 'Dusch';
    elseif ($t === 'electricChargingPoint') $eq[] = 'Laddstolpe';
  }
  $cars = null; $lorries = null;
  foreach ($p['VehicleCharacteristics'] ?? [] as $v) {
    if (($v['VehicleType'] ?? '') === 'car') $cars = $v['NumberOfSpaces'] ?? null;
    if (($v['VehicleType'] ?? '') === 'lorry') $lorries = $v['NumberOfSpaces'] ?? null;
  }
  $items[] = ['id' => $p['Id'] ?? ($m[1] . ',' . $m[2]), 'lon' => floatval($m[1]), 'lat' => floatval($m[2]),
    'name' => $p['Name'] ?? 'Rastplats', 'open' => ($p['OpenStatus'] ?? '') !== 'closed',
    'equipment' => array_values(array_unique($eq)), 'cars' => $cars, 'lorries' => $lorries];
}
$out = json_encode(['items' => $items], JSON_UNESCAPED_UNICODE);
@file_put_contents($cf, $out); echo $out;
