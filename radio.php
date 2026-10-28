<?php
// Public radio directory only: never proxies arbitrary URLs or audio streams.
header('Content-Type: application/json; charset=utf-8');
$action = $_GET['action'] ?? 'search';
$q = trim(substr($_GET['q'] ?? '', 0, 100));
$country = $_GET['country'] ?? 'SE';
if (!preg_match('/^([A-Z]{2})?$/', $country)) { http_response_code(400); echo '{"stations":[],"error":"Ogiltigt land"}'; exit; }
if ($action === 'countries') $path = 'countries';
elseif ($action === 'click' && preg_match('/^[a-f0-9-]{36}$/i', $_GET['id'] ?? '')) $path = 'url/' . rawurlencode($_GET['id']);
elseif ($action === 'search') $path = 'stations/search?' . http_build_query(['name'=>$q, 'countrycode'=>$country, 'hidebroken'=>'true', 'order'=>'clickcount', 'reverse'=>'true', 'limit'=>150]);
else { http_response_code(400); echo '{}'; exit; }
$rows = null;
foreach (['all.api.radio-browser.info', 'de1.api.radio-browser.info'] as $host) {
  $ch = curl_init('https://' . $host . '/json/' . $path);
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_CONNECTTIMEOUT=>4, CURLOPT_TIMEOUT=>8, CURLOPT_USERAGENT=>'WeatherTrafficRadio/1.0', CURLOPT_SSL_VERIFYPEER=>true]);
  $body = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  if ($code === 200 && is_string($body)) { $rows = json_decode($body, true); if (is_array($rows)) break; }
}
if (!is_array($rows)) { echo json_encode(['stations'=>[], 'error'=>'Radiokatalogen svarar inte. Försök igen.']); exit; }
if ($action === 'countries') { $out=[]; foreach ($rows as $r) if (preg_match('/^[A-Z]{2}$/', $r['iso_3166_1'] ?? '')) $out[]=['code'=>$r['iso_3166_1'], 'name'=>$r['name']]; echo json_encode($out); exit; }
if ($action === 'click') { echo '{"ok":true}'; exit; }
$out=[]; $seen=[];
foreach ($rows as $r) {
  $url = $r['url_resolved'] ?? ''; $p = parse_url($url); $id = $r['stationuuid'] ?? '';
  if (($p['scheme'] ?? '') !== 'https' || empty($p['host']) || isset($p['user']) || isset($p['pass']) || !$id || isset($seen[$id])) continue;
  $seen[$id]=true; $br = intval($r['bitrate'] ?? 0);
  $out[]=['id'=>$id, 'name'=>$r['name'], 'url'=>$url, 'country'=>$r['country'] ?? '', 'codec'=>$r['codec'] ?? '', 'bitrate'=>$br > 0 ? $br : 0];
}
// Lägre bitrate först: lätta strömmar klarar svag mobiltäckning bättre. Okänd bitrate (0) sist.
usort($out, function ($a, $b) { $x = $a['bitrate'] ?: PHP_INT_MAX; $y = $b['bitrate'] ?: PHP_INT_MAX; return $x <=> $y; });
$out = array_slice($out, 0, 40);
echo json_encode(['stations'=>$out, 'error'=>null], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
