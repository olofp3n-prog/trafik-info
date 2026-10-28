<?php
// Cultural heritage objects from Riksantikvarieämbetet's K-samsök within the visible area (no key needed).
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function out($a) { echo json_encode($a); exit; }
function num($k) { return isset($_GET[$k]) && is_numeric($_GET[$k]) ? (float)$_GET[$k] : null; }
$s = num('s'); $w = num('w'); $n = num('n'); $e = num('e');
if ($s === null || $w === null || $n === null || $e === null || $s < -90 || $n > 90 || $w < -180 || $e > 180) out(['items' => [], 'error' => 'Ogiltigt område']);
$box = sprintf('%.3f %.3f %.3f %.3f', $w, $s, $e, $n);
$cf = sys_get_temp_dir() . '/ks_' . md5($box) . '.json';
if (is_file($cf) && time() - filemtime($cf) < 600) { echo file_get_contents($cf); exit; }

$url = 'https://kulturarvsdata.se/ksamsok/api?method=search&hitsPerPage=200&recordSchema=presentation&query=' . rawurlencode('boundingBox=/WGS84 "' . $box . '"');
$ch = curl_init($url);
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_USERAGENT => 'meteo-traffic']);
$xml = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
if ($code != 200 || !$xml) out(['items' => [], 'error' => 'Kunde inte ladda K-samsök' . ($code ? " (fel $code)" : '')]);

function dec($x) { return trim(html_entity_decode(str_replace(['<![CDATA[', ']]>'], '', $x), ENT_QUOTES | ENT_XML1, 'UTF-8')); }
function one($x, $t) { return preg_match('#<pres:' . $t . '[^>]*>([\s\S]*?)</pres:' . $t . '>#', $x, $m) ? dec($m[1]) : ''; }
function many($x, $t) { preg_match_all('#<pres:' . $t . '[^>]*>([\s\S]*?)</pres:' . $t . '>#', $x, $m); return array_values(array_filter(array_map('dec', $m[1]))); }
function https($u) { return preg_replace('#^http://#', 'https://', $u); }

$items = [];
foreach (array_slice(explode('<record>', $xml), 1) as $rec) {
  if (!preg_match('#<gml:coordinates[^>]*>\s*([-\d.]+)\s*,\s*([-\d.]+)#', $rec, $co)) continue;
  $img = preg_match('#<pres:image>([\s\S]*?)</pres:image>#', $rec, $im) ? $im[1] : '';
  $src = preg_match('#<pres:src type="lowres">([^<]+)#', $img, $m) ? $m[1] : (preg_match('#<pres:src type="thumbnail">([^<]+)#', $img, $m) ? $m[1] : '');
  $html = preg_match('#<pres:representation format="HTML">([^<]+)#', $rec, $m) ? $m[1] : one($rec, 'url');
  $desc = one($rec, 'description');
  $items[] = [
    'id' => one($rec, 'entityUri') ?: ($co[1] . ',' . $co[2]), 'lon' => (float)$co[1], 'lat' => (float)$co[2],
    'title' => one($rec, 'itemLabel') ?: 'Kulturarv', 'type' => one($rec, 'type'),
    'description' => function_exists('mb_substr') ? mb_substr($desc, 0, 600) : substr($desc, 0, 600),
    'org' => one($rec, 'organization'), 'place' => implode(', ', array_slice(many($rec, 'placeLabel'), 0, 3)),
    'time' => implode(', ', array_slice(many($rec, 'timeLabel'), 0, 2)),
    'image' => $src ? ['src' => https(dec($src)), 'by' => one($img, 'byline') ?: one($img, 'copyright')] : null,
    'link' => $html ? https(dec($html)) : null,
  ];
}
$json = json_encode(['items' => $items, 'error' => null]);
@file_put_contents($cf, $json);
echo $json;
