<?php
header('Content-Type: application/json; charset=utf-8');
if (!function_exists('curl_init')) { echo json_encode(['elements'=>[], 'error'=>'Stationer kunde inte hämtas – servern saknar cURL']); exit; }
$b = []; foreach (['south','west','north','east'] as $k) { $v = filter_input(INPUT_GET, $k, FILTER_VALIDATE_FLOAT); if ($v === false || $v === null) { http_response_code(400); echo json_encode(['elements'=>[], 'error'=>'Ogiltigt kartområde']); exit; } $b[$k] = $v; }
if ($b['south'] < -90 || $b['north'] > 90 || $b['west'] < -180 || $b['east'] > 180 || $b['north'] <= $b['south'] || $b['east'] <= $b['west'] || $b['north']-$b['south'] > .6 || $b['east']-$b['west'] > 1.2) { http_response_code(400); echo json_encode(['elements'=>[], 'error'=>'Ogiltigt kartområde']); exit; }
$key = implode(',', $b); $dir = sys_get_temp_dir().'/traffic-stations-v95'; if (!is_dir($dir)) @mkdir($dir,0700,true);
$file = $dir.'/'.hash('sha256',$key).'.json'; $old = is_file($file) ? @file_get_contents($file) : false;
if ($old && time()-filemtime($file)<3600) { echo $old; exit; }
$q = '[out:json][timeout:15];(nwr[amenity=fuel]('.$key.');nwr[amenity=charging_station][access!=private]('.$key.'););out center tags;';
foreach (['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'] as $host) {
  $ch=curl_init($host); curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>http_build_query(['data'=>$q]),CURLOPT_TIMEOUT=>18,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_IPRESOLVE=>CURL_IPRESOLVE_V4,CURLOPT_USERAGENT=>'Traffic station map']);
  $raw=curl_exec($ch); $code=curl_getinfo($ch,CURLINFO_HTTP_CODE); curl_close($ch); $j=json_decode($raw ?: '',true);
  if ($code==200 && isset($j['elements']) && is_array($j['elements']) && empty($j['remark'])) {
    $out=json_encode(['elements'=>array_slice($j['elements'],0,1000),'error'=>null],JSON_UNESCAPED_UNICODE); @file_put_contents($file,$out,LOCK_EX);
    $files=glob($dir.'/*.json') ?: []; if (count($files)>24) { usort($files,function($a,$b){return filemtime($a)-filemtime($b);}); foreach(array_slice($files,0,count($files)-24) as $f) @unlink($f); }
    echo $out; exit;
  }
}
$j=$old ? json_decode($old,true) : ['elements'=>[]]; $j['error']='Kunde inte ladda stationer – försök igen'; echo json_encode($j,JSON_UNESCAPED_UNICODE);
