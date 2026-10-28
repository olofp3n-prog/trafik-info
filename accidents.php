<?php
// Road accidents in Sweden from Trafikverket (Situation / Deviation "Olycka"). Key stays on the server.
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$TV = trim($TRAFIKVERKET_API_KEY ?? '');
if ($TV === '') { echo json_encode(['items' => [], 'error' => 'Trafikverket-nyckel saknas']); exit; }
$cf = sys_get_temp_dir() . '/mt_accidents.json';
if (is_file($cf) && time() - filemtime($cf) < 60) { readfile($cf); exit; }
$q = '<REQUEST><LOGIN authenticationkey="' . htmlspecialchars($TV) . '"/><QUERY objecttype="Situation" namespace="road.trafficinfo" schemaversion="1.6" limit="500"><FILTER><EQ name="Deviation.MessageType" value="Olycka"/></FILTER></QUERY></REQUEST>';
$ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: text/xml\r\n", 'content' => $q, 'timeout' => 8, 'ignore_errors' => true]]);
$r = @file_get_contents('https://api.trafikinfo.trafikverket.se/v2/data.json', false, $ctx);
$j = $r ? json_decode($r, true) : null;
if (!$j) { echo json_encode(['items' => [], 'error' => 'Servern når inte Trafikverket']); exit; }
$items = [];
foreach ($j['RESPONSE']['RESULT'][0]['Situation'] ?? [] as $s) foreach ($s['Deviation'] ?? [] as $d) {
  if (($d['MessageType'] ?? '') !== 'Olycka') continue;
  if (!empty($d['StartTime']) && strtotime($d['StartTime']) > time()) continue;
  if (!empty($d['EndTime']) && strtotime($d['EndTime']) < time()) continue;
  $g = $d['Geometry']['Point']['WGS84'] ?? ($d['Geometry']['WGS84'] ?? '');
  if (!preg_match('/POINT \(([-\d.]+) ([-\d.]+)\)/', $g, $m)) continue;
  $items[] = ['id' => $d['Id'] ?? ($m[1] . ',' . $m[2]), 'lon' => floatval($m[1]), 'lat' => floatval($m[2]), 'road' => $d['RoadNumber'] ?? '',
    'message' => $d['Message'] ?? '', 'location' => $d['LocationDescriptor'] ?? '', 'direction' => $d['AffectedDirection'] ?? '',
    'severity' => $d['SeverityText'] ?? '', 'start' => $d['StartTime'] ?? null, 'end' => $d['EndTime'] ?? null];
}
$out = json_encode(['items' => $items, 'error' => null], JSON_UNESCAPED_UNICODE);
@file_put_contents($cf, $out); echo $out;
