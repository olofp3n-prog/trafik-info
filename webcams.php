<?php
// Webcams from Trafikverket (cached 30 min) and Windy, around ?lat&lon&km.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require __DIR__ . '/config.php';
$lat = (float)($_GET['lat'] ?? 0); $lon = (float)($_GET['lon'] ?? 0);
$km = max(1, min(250, (float)($_GET['km'] ?? 20)));
function wc_get($url, $headers = [], $post = null) {
  $ch = curl_init($url);
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4, CURLOPT_HTTPHEADER => $headers]);
  if ($post !== null) { curl_setopt($ch, CURLOPT_POST, true); curl_setopt($ch, CURLOPT_POSTFIELDS, $post); }
  $r = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return ($r !== false && $code < 400) ? json_decode($r, true) : null;
}
$cf = sys_get_temp_dir() . '/mt_webcam_tv.json';
$tv = (is_file($cf) && time() - filemtime($cf) < 1800) ? json_decode(file_get_contents($cf), true) : null;
if (!$tv) {
  $xml = '<REQUEST><LOGIN authenticationkey="' . ($TRAFIKVERKET_API_KEY ?? '') . '"/><QUERY objecttype="Camera" schemaversion="1"><FILTER><EQ name="Active" value="true"/></FILTER><INCLUDE>Id</INCLUDE><INCLUDE>Name</INCLUDE><INCLUDE>Geometry.WGS84</INCLUDE><INCLUDE>PhotoUrl</INCLUDE><INCLUDE>PhotoTime</INCLUDE></QUERY></REQUEST>';
  $j = wc_get('https://api.trafikinfo.trafikverket.se/v2/data.json', ['Content-Type: text/xml'], $xml);
  $tv = [];
  foreach ($j['RESPONSE']['RESULT'][0]['Camera'] ?? [] as $c) {
    if (!preg_match('/POINT \(([-\d.]+) ([-\d.]+)\)/', $c['Geometry']['WGS84'] ?? '', $m)) continue;
    $tv[] = ['id' => 'tv' . $c['Id'], 'lat' => (float)$m[2], 'lon' => (float)$m[1], 'name' => $c['Name'] ?? 'Trafikkamera', 'image' => isset($c['PhotoUrl']) ? $c['PhotoUrl'] . '?type=fullsize' : null, 'link' => $c['PhotoUrl'] ?? null, 'time' => $c['PhotoTime'] ?? null, 'source' => 'Trafikverket'];
  }
  if ($tv) @file_put_contents($cf, json_encode($tv)); elseif (is_file($cf)) $tv = json_decode(file_get_contents($cf), true) ?: [];
}
$k = cos(deg2rad($lat)); $items = [];
foreach ($tv as $c) { if (hypot($c['lat'] - $lat, ($c['lon'] - $lon) * $k) * 111 <= $km) { $items[] = $c; if (count($items) >= 300) break; } }
if (trim($WINDY_API_KEY ?? '') !== '') {
  $j = wc_get('https://api.windy.com/webcams/api/v3/webcams?nearby=' . round($lat, 4) . ',' . round($lon, 4) . ',' . round($km) . '&include=location,images,urls&limit=50', ['x-windy-api-key: ' . trim($WINDY_API_KEY)]);
  foreach ($j['webcams'] ?? [] as $w) {
    if (!isset($w['location']['latitude'])) continue;
    $items[] = ['id' => 'wy' . $w['webcamId'], 'lat' => $w['location']['latitude'], 'lon' => $w['location']['longitude'], 'name' => $w['title'] ?? 'Webbkamera', 'image' => $w['images']['current']['preview'] ?? null, 'link' => $w['urls']['detail'] ?? null, 'time' => $w['lastUpdatedOn'] ?? null, 'source' => 'Windy'];
  }
}
echo json_encode(['items' => $items], JSON_UNESCAPED_UNICODE);
