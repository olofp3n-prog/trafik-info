<?php
// Public read-only EUMETSAT cloud-mask proxy. No API key or arbitrary upstream URL.
function failCloud($code = 502) { http_response_code($code); header('Cache-Control: no-store'); exit('Molnbilder tillfälligt otillgängliga'); }
function upstreamCloud($query) {
  $ch = curl_init('https://view.eumetsat.int/geoserver/wms?' . http_build_query($query));
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_CONNECTTIMEOUT => 8]);
  $body = curl_exec($ch); $status = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  if ($body === false || $status !== 200) failCloud();
  return $body;
}
function upstreamCloudSoft($query) {
  $ch = curl_init('https://view.eumetsat.int/geoserver/wms?' . http_build_query($query));
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_CONNECTTIMEOUT => 8]);
  $body = curl_exec($ch); $status = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return ($body !== false && $status === 200) ? $body : null;
}
function blurCloud($a) {
  $t=[]; $o=[];
  for ($y=0;$y<256;$y++) for ($x=0;$x<256;$x++) { $s=0;$n=0; for ($k=-2;$k<=2;$k++){ $xx=$x+$k; if($xx>=0&&$xx<256){$s+=$a[$y*256+$xx];$n++;} } $t[$y*256+$x]=$s/$n; }
  for ($y=0;$y<256;$y++) for ($x=0;$x<256;$x++) { $s=0;$n=0; for ($k=-2;$k<=2;$k++){ $yy=$y+$k; if($yy>=0&&$yy<256){$s+=$t[$yy*256+$x];$n++;} } $o[$y*256+$x]=$s/$n; }
  return $o;
}
if (!function_exists('curl_init')) failCloud();
$dir = sys_get_temp_dir() . '/traffic-clouds-v131';
if (!is_dir($dir) && !@mkdir($dir, 0700, true)) failCloud();
if (isset($_GET['frames'])) {
  $cache = $dir . '/frames.json';
  if (!is_file($cache) || time() - filemtime($cache) > 300) {
    $xml = upstreamCloud(['service'=>'WMS','version'=>'1.3.0','request'=>'GetCapabilities']);
    $start = strpos($xml, '<Name>msg_fes:clm</Name>');
    if ($start === false || !preg_match('/<Dimension\b[^>]*name="time"[^>]*default="([^"]+)"/', substr($xml, $start), $m)) failCloud();
    $latest = strtotime($m[1]); if (!$latest) failCloud();
    $frames = []; for ($i=8; $i>=0; $i--) { $t=$latest-$i*900; $frames[]=['time'=>$t,'url'=>(string)$t]; }
    $body=json_encode(['frames'=>$frames]); @file_put_contents($cache, $body, LOCK_EX);
  } else $body=file_get_contents($cache);
  header('Content-Type: application/json'); header('Cache-Control: public, max-age=300'); exit($body);
}
$t=filter_input(INPUT_GET,'t',FILTER_VALIDATE_INT); $z=filter_input(INPUT_GET,'z',FILTER_VALIDATE_INT);
$x=filter_input(INPUT_GET,'x',FILTER_VALIDATE_INT); $y=filter_input(INPUT_GET,'y',FILTER_VALIDATE_INT);
if ($t===false || $t===null || $z===false || $z===null || $x===false || $x===null || $y===false || $y===null || $t%900!==0 || $t>time() || $t<time()-86400 || $z<0 || $z>7 || $x<0 || $y<0 || $x>=2**$z || $y>=2**$z) failCloud(400);
if (!function_exists('imagecreatefromstring')) failCloud();
$file="$dir/$t-$z-$x-$y.png";
if (!is_file($file)) {
  $edge=20037508.342789244; $size=$edge*2/(2**$z);
  $bbox=implode(',',[$x*$size-$edge,$edge-($y+1)*$size,($x+1)*$size-$edge,$edge-$y*$size]);
  $q=['service'=>'WMS','version'=>'1.1.1','request'=>'GetMap','styles'=>'','format'=>'image/png','transparent'=>'true','srs'=>'EPSG:3857','width'=>256,'height'=>256,'bbox'=>$bbox,'time'=>gmdate('Y-m-d\TH:i:s\Z',$t)];
  $src=@imagecreatefromstring(upstreamCloud($q+['layers'=>'msg_fes:clm'])); if (!$src || imagesx($src)!==256 || imagesy($src)!==256) failCloud();
  $ir=null; $irBody=@upstreamCloudSoft($q+['layers'=>'msg_fes:ir108']); if ($irBody) $ir=@imagecreatefromstring($irBody);
  if ($ir && (imagesx($ir)!==256 || imagesy($ir)!==256)) $ir=null;
  // Mask decides where clouds are; blurred twice (box radius 2) for soft edges; IR gives texture.
  $m=[]; for ($i=0;$i<65536;$i++){ $c=imagecolorsforindex($src,imagecolorat($src,$i%256,intdiv($i,256))); $m[$i]=($c['red']>240&&$c['green']>240&&$c['blue']>240&&$c['alpha']<127)?1.0:0.0; }
  $soft=blurCloud(blurCloud($m));
  $out=imagecreatetruecolor(256,256); imagealphablending($out,false); imagesavealpha($out,true);
  imagefill($out,0,0,imagecolorallocatealpha($out,255,255,255,127));
  for ($i=0;$i<65536;$i++) {
    $e=$m[$i]?$soft[$i]:$soft[$i]*0.6; if ($e<=0.02) continue;
    $v=0.5; if ($ir) { $c=imagecolorsforindex($ir,imagecolorat($ir,$i%256,intdiv($i,256))); if ($c['alpha']<127) $v=($c['red']+$c['green']+$c['blue'])/765; }
    $tone=(int)round(190+65*$v); $a=$e*(0.3+0.55*$v);
    imagesetpixel($out,$i%256,intdiv($i,256),imagecolorallocatealpha($out,$tone,$tone,min(255,$tone+6),127-(int)round(127*$a)));
  }
  if ($ir) imagedestroy($ir);
  ob_start(); imagepng($out); $png=ob_get_clean(); imagedestroy($src); imagedestroy($out);
  @file_put_contents($file,$png,LOCK_EX);
  // Bound disk storage and remove expired observations.
  $files=glob($dir.'/*.png') ?: []; usort($files,fn($a,$b)=>filemtime($a)<=>filemtime($b));
  foreach ($files as $i=>$f) if (time()-filemtime($f)>86400 || $i<count($files)-256) @unlink($f);
} else $png=file_get_contents($file);
header('Content-Type: image/png'); header('Cache-Control: public, max-age=3600'); echo $png;
