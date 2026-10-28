<?php
// Trafikverket road weather stations with a slippery-road risk flag. Key stays on the server.
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');
$TV = trim($TRAFIKVERKET_API_KEY ?? '');
if ($TV === '') { echo '{"items":[]}'; exit; }
$cf = sys_get_temp_dir() . '/mt_ice.json';
if (is_file($cf) && time() - filemtime($cf) < 600) { readfile($cf); exit; }
$inc = '';
foreach (['Id', 'Geometry.WGS84', 'Observation.Sample', 'Observation.Surface.Temperature.Value', 'Observation.Air.Temperature.Value', 'Observation.Air.Dewpoint.Value', 'Observation.Weather.Precipitation'] as $f) $inc .= '<INCLUDE>' . $f . '</INCLUDE>';
$q = '<REQUEST><LOGIN authenticationkey="' . htmlspecialchars($TV) . '"/><QUERY objecttype="WeatherMeasurepoint" namespace="Road.WeatherInfo" schemaversion="2.1"><FILTER/>' . $inc . '</QUERY></REQUEST>';
$ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: text/xml\r\n", 'content' => $q, 'timeout' => 10, 'ignore_errors' => true]]);
$r = @file_get_contents('https://api.trafikinfo.trafikverket.se/v2/data.json', false, $ctx);
$j = $r ? json_decode($r, true) : null;
if (!$j) { if (is_file($cf)) readfile($cf); else echo '{"items":[]}'; exit; }
$items = [];
foreach ($j['RESPONSE']['RESULT'][0]['WeatherMeasurepoint'] ?? [] as $s) {
  $o = $s['Observation'] ?? null;
  if (!$o || !preg_match('/POINT \(([-\d.]+) ([-\d.]+)\)/', $s['Geometry']['WGS84'] ?? '', $m)) continue;
  if (time() - strtotime($o['Sample'] ?? '') > 7200) continue;
  $t = $o['Surface']['Temperature']['Value'] ?? ($o['Air']['Temperature']['Value'] ?? null);
  $dew = $o['Air']['Dewpoint']['Value'] ?? null; $p = $o['Weather']['Precipitation'] ?? 'no';
  $risk = $t !== null && ($t <= 0.5 || ($t <= 2 && (($p && $p !== 'no') || ($dew !== null && $t - $dew <= 1))));
  $items[] = ['id' => (string)$s['Id'], 'lon' => floatval($m[1]), 'lat' => floatval($m[2]), 'risk' => $risk];
}
$out = json_encode(['items' => $items]);
@file_put_contents($cf, $out); echo $out;
