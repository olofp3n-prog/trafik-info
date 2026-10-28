<?php
// All Swedish speed cameras from Trafikverket (TrafficSafetyCamera), cached 12 h.
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/config.php';
$cf = sys_get_temp_dir() . '/mt_cam_tv.json';
if (is_file($cf) && time() - filemtime($cf) < 43200) { readfile($cf); exit; }
$key = $TRAFIKVERKET_API_KEY ?? '';
$xml = '<REQUEST><LOGIN authenticationkey="' . $key . '"/><QUERY objecttype="TrafficSafetyCamera" schemaversion="1"><FILTER><EQ name="Deleted" value="false"/></FILTER><INCLUDE>Id</INCLUDE><INCLUDE>Geometry.WGS84</INCLUDE><INCLUDE>Bearing</INCLUDE><INCLUDE>Name</INCLUDE><INCLUDE>RoadNumber</INCLUDE></QUERY></REQUEST>';
$ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: text/xml\r\n", 'content' => $xml, 'timeout' => 10, 'ignore_errors' => true]]);
$r = @file_get_contents('https://api.trafikinfo.trafikverket.se/v2/data.json', false, $ctx);
$j = $r ? json_decode($r, true) : null;
$items = [];
foreach ($j['RESPONSE']['RESULT'][0]['TrafficSafetyCamera'] ?? [] as $c) {
  if (!preg_match('/POINT \(([-\d.]+) ([-\d.]+)\)/', $c['Geometry']['WGS84'] ?? '', $m)) continue;
  $items[] = ['id' => (string)$c['Id'], 'lat' => round((float)$m[2], 6), 'lon' => round((float)$m[1], 6), 'maxspeed' => null, 'bearing' => $c['Bearing'] ?? null, 'road' => $c['RoadNumber'] ?? null, 'name' => $c['Name'] ?? null];
}
if (!$items) { if (is_file($cf)) readfile($cf); else echo '{"items":[]}'; exit; }
$out = json_encode(['items' => $items], JSON_UNESCAPED_UNICODE);
@file_put_contents($cf, $out); echo $out;
