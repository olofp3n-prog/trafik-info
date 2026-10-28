<?php
// Polisens trafikhändelser (senaste 6 h). Cachas 3 min.
header('Content-Type: application/json; charset=utf-8');
$cf = sys_get_temp_dir() . '/mt_police.json';
if (is_file($cf) && time() - filemtime($cf) < 180) { readfile($cf); exit; }
$ctx = stream_context_create(['http' => ['timeout' => 8, 'header' => "User-Agent: meteo-traffic\r\n", 'ignore_errors' => true]]);
$r = @file_get_contents('https://polisen.se/api/events', false, $ctx);
$j = $r ? json_decode($r, true) : null;
if (!is_array($j)) { if (is_file($cf)) readfile($cf); else echo '{"items":[]}'; exit; }
$items = [];
foreach ($j as $e) {
  $type = $e['type'] ?? '';
  if (!preg_match('/trafik|rattfylleri|olycka/iu', $type)) continue;
  $t = strtotime($e['datetime'] ?? '');
  if ($t && time() - $t > 6 * 3600) continue;
  $g = explode(',', $e['location']['gps'] ?? '');
  if (count($g) < 2 || !floatval($g[0])) continue;
  $items[] = ['id' => (string)($e['id'] ?? ''), 'lat' => floatval($g[0]), 'lon' => floatval($g[1]), 'type' => $type, 'title' => $e['name'] ?? $type,
    'summary' => $e['summary'] ?? '', 'time' => $t ? date('c', $t) : '', 'url' => !empty($e['url']) ? 'https://polisen.se' . $e['url'] : ''];
}
$out = json_encode(['items' => $items], JSON_UNESCAPED_UNICODE);
@file_put_contents($cf, $out); echo $out;
