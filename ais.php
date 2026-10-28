<?php
// Ships proxy: AISStream does not allow browser connections, so this script
// opens the stream for a few seconds, collects position reports and returns JSON.
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$cacheFile = sys_get_temp_dir() . '/ais_static.json';
$statics = is_file($cacheFile) ? (json_decode(@file_get_contents($cacheFile), true) ?: []) : [];
function out($ships, $err = null) {
  global $statics, $cacheFile;
  foreach ($ships as $id => $sh) { $ships[$id]['destination'] = $statics[$id]['destination'] ?? null; $ships[$id]['eta'] = $statics[$id]['eta'] ?? null; foreach (['type','len','beam'] as $k) $ships[$id][$k] = $statics[$id][$k] ?? null; }
  if (count($statics) > 5000) $statics = array_slice($statics, -3000, null, true);
  @file_put_contents($cacheFile, json_encode($statics));
  echo json_encode(['ships' => array_values($ships), 'error' => $err]); exit; }

$key = trim($AISSTREAM_API_KEY);
if ($key === '') out([], 'AISStream key missing in config.php');

$s = isset($_GET['s']) ? floatval($_GET['s']) : null; $w = isset($_GET['w']) ? floatval($_GET['w']) : null;
$n = isset($_GET['n']) ? floatval($_GET['n']) : null; $e = isset($_GET['e']) ? floatval($_GET['e']) : null;
if ($s === null || $w === null || $n === null || $e === null || $s < -90 || $n > 90 || $w < -180 || $e > 180) out([], 'Ogiltigt område');

// Ships seen in the last 10 minutes are remembered; the same area asked again within 15 s is answered from memory.
$seenFile = sys_get_temp_dir() . '/ais_seen.json';
$seen = is_file($seenFile) ? (json_decode(@file_get_contents($seenFile), true) ?: []) : [];
$box = sprintf('%.2f,%.2f,%.2f,%.2f', $s, $w, $n, $e);
function inBox() { global $seen, $s, $w, $n, $e; $r = []; $now = time();
  foreach ($seen as $id => $sh) { if ($now - $sh['at'] > ((($sh['speed'] ?? 0) >= 0.5) ? 1200 : 3600)) { unset($seen[$id]); continue; }
    if ($sh['lat'] >= $s && $sh['lat'] <= $n && $sh['lon'] >= $w && $sh['lon'] <= $e) { $x = $sh; unset($x['at']); $r[$id] = $x; if (count($r) >= 400) break; } }
  return $r; }
if (($seen['_box'] ?? '') === $box && time() - ($seen['_at'] ?? 0) < 15) { unset($seen['_box'], $seen['_at']); out(inBox()); }
unset($seen['_box'], $seen['_at']);
$fp = @stream_socket_client('ssl://stream.aisstream.io:443', $errno, $errstr, 10);
if (!$fp) out([], 'Kunde inte nå AISStream');
stream_set_timeout($fp, 0, 300000);

$wsKey = base64_encode(random_bytes(16));
fwrite($fp, "GET /v0/stream HTTP/1.1\r\nHost: stream.aisstream.io\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: $wsKey\r\nSec-WebSocket-Version: 13\r\n\r\n");
$head = '';
while (!feof($fp) && strpos($head, "\r\n\r\n") === false) { $c = fread($fp, 1024); if ($c === false || $c === '') break; $head .= $c; }
if (strpos($head, ' 101 ') === false) out([], 'AISStream refused the connection');
$buf = substr($head, strpos($head, "\r\n\r\n") + 4);

function ws_send($fp, $text) {
  $len = strlen($text); $h = chr(0x81);
  if ($len < 126) $h .= chr(0x80 | $len);
  elseif ($len < 65536) $h .= chr(0x80 | 126) . pack('n', $len);
  else $h .= chr(0x80 | 127) . pack('J', $len);
  $mask = random_bytes(4); $h .= $mask;
  for ($i = 0; $i < $len; $i++) $text[$i] = $text[$i] ^ $mask[$i % 4];
  fwrite($fp, $h . $text);
}

ws_send($fp, json_encode([
  'APIKey' => $key,
  'BoundingBoxes' => [[[max(-90, $s - ($n - $s) * 0.25), max(-180, $w - ($e - $w) * 0.25)], [min(90, $n + ($n - $s) * 0.25), min(180, $e + ($e - $w) * 0.25)]]],
  'FilterMessageTypes' => ['PositionReport', 'StandardClassBPositionReport', 'ExtendedClassBPositionReport', 'ShipStaticData'],
]));

// Busy waters: stop 0.8 s after the last new ship (max 3 s). Quiet waters: listen up to 6 s.
$ships = []; $msg = ''; $t0 = microtime(true); $end = $t0 + 6; $lastNew = microtime(true);
while (microtime(true) < $end && !($ships && microtime(true) > $t0 + 3) && count($ships) < 500 && (!$ships || microtime(true) - $lastNew < 0.8)) {
  // need at least 2 header bytes
  while (strlen($buf) < 2) { $c = fread($fp, 8192); if ($c === false || $c === '') { if (feof($fp)) break 2; continue 2; } $buf .= $c; }
  $b1 = ord($buf[0]); $b2 = ord($buf[1]); $op = $b1 & 0x0f; $fin = $b1 & 0x80;
  $len = $b2 & 0x7f; $off = 2;
  if ($len === 126) { if (strlen($buf) < 4) { $buf .= fread($fp, 8192); continue; } $len = unpack('n', substr($buf, 2, 2))[1]; $off = 4; }
  elseif ($len === 127) { if (strlen($buf) < 10) { $buf .= fread($fp, 8192); continue; } $len = unpack('J', substr($buf, 2, 8))[1]; $off = 10; }
  while (strlen($buf) < $off + $len) { $c = fread($fp, 65536); if ($c === false || $c === '') { if (feof($fp) || microtime(true) > $end) break 2; continue; } $buf .= $c; }
  $payload = substr($buf, $off, $len); $buf = substr($buf, $off + $len);
  if ($op === 8) break;                       // close
  if ($op === 9) continue;                    // ping (ignored)
  if ($op === 1 || $op === 2 || $op === 0) {
    $msg .= $payload;
    if (!$fin) continue;
    $m = json_decode($msg, true); $msg = '';
    if (!$m) continue;
    if (isset($m['error'])) out([], 'AISStream: ' . $m['error']);
    $md = $m['MetaData'] ?? null; $st = $m['Message']['ShipStaticData'] ?? null;
    if ($st && $md) {
      $et = $st['Eta'] ?? null;
      $eta = ($et && !empty($et['Month']) && !empty($et['Day'])) ? sprintf('%02d/%02d %02d:%02d', $et['Day'], $et['Month'], $et['Hour'] ?? 0, $et['Minute'] ?? 0) : null;
      $statics[(string)($md['MMSI'] ?? $st['UserID'])] = ['destination' => trim($st['Destination'] ?? '') ?: null, 'eta' => $eta, 'type' => isset($st['Type']) ? (int)$st['Type'] : null, 'len' => (($l = ($st['Dimension']['A'] ?? 0) + ($st['Dimension']['B'] ?? 0)) > 0 && $l < 511) ? $l : null, 'beam' => (($b = ($st['Dimension']['C'] ?? 0) + ($st['Dimension']['D'] ?? 0)) > 0 && $b < 127) ? $b : null];
      continue;
    }
    $p = $m['Message']['PositionReport'] ?? $m['Message']['StandardClassBPositionReport'] ?? $m['Message']['ExtendedClassBPositionReport'] ?? null;
    if (!$p || !$md) continue;
    $id = (string)($md['MMSI'] ?? $p['UserID']);
    $hd = (isset($p['TrueHeading']) && $p['TrueHeading'] < 360) ? $p['TrueHeading'] : ($p['Cog'] ?? 0);
    $lastNew = microtime(true);
    $ships[$id] = [
      'id' => $id, 'name' => trim($md['ShipName'] ?? '') ?: $id,
      'lat' => $md['latitude'] ?? $p['Latitude'], 'lon' => $md['longitude'] ?? $p['Longitude'],
      'heading' => $hd, 'speed' => $p['Sog'] ?? null,
    ];
  }
}
fclose($fp);
$now = time();
foreach ($ships as $id => $sh) { $sh['at'] = $now; $seen[$id] = $sh; }
if (count($seen) > 20000) $seen = [];
$res = inBox();
$seen['_box'] = $box; $seen['_at'] = $now;
@file_put_contents($seenFile, json_encode($seen));
out($res);
