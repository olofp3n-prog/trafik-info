<?php
// Active road works in Sweden from Trafikverket (Situation / Deviation "Vägarbete"). Key stays on the server.
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');
$TV = trim($TRAFIKVERKET_API_KEY ?? '');
if ($TV === '') { echo '{"items":[]}'; exit; }
$cf = sys_get_temp_dir() . '/mt_roadworks.json';
if (is_file($cf) && time() - filemtime($cf) < 600) { readfile($cf); exit; }
$q = '<REQUEST><LOGIN authenticationkey="' . htmlspecialchars($TV) . '"/><QUERY objecttype="Situation" namespace="road.trafficinfo" schemaversion="1.6" limit="4000"><FILTER><EQ name="Deviation.MessageType" value="Vägarbete"/></FILTER><INCLUDE>Deviation</INCLUDE></QUERY></REQUEST>';
$ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: text/xml\r\n", 'content' => $q, 'timeout' => 10, 'ignore_errors' => true]]);
$r = @file_get_contents('https://api.trafikinfo.trafikverket.se/v2/data.json', false, $ctx);
$j = $r ? json_decode($r, true) : null;
if (!$j) { if (is_file($cf)) readfile($cf); else echo '{"items":[]}'; exit; }
$items = [];
foreach ($j['RESPONSE']['RESULT'][0]['Situation'] ?? [] as $s) foreach ($s['Deviation'] ?? [] as $d) {
  if (($d['MessageType'] ?? '') !== 'Vägarbete') continue;
  if (!empty($d['StartTime']) && strtotime($d['StartTime']) > time()) continue;
  if (!empty($d['EndTime']) && strtotime($d['EndTime']) < time()) continue;
  $g = $d['Geometry']['Point']['WGS84'] ?? ($d['Geometry']['WGS84'] ?? '');
  if (!preg_match('/POINT \(([-\d.]+) ([-\d.]+)\)/', $g, $m)) continue;
  $items[] = ['id' => $d['Id'] ?? ($m[1] . ',' . $m[2]), 'lon' => floatval($m[1]), 'lat' => floatval($m[2]), 'road' => $d['RoadNumber'] ?? '',
    'message' => $d['Message'] ?? '', 'location' => $d['LocationDescriptor'] ?? '', 'end' => $d['EndTime'] ?? null];
}
$out = json_encode(['items' => $items], JSON_UNESCAPED_UNICODE);
@file_put_contents($cf, $out); echo $out;
