<?php
// Recolours RainViewer radar tiles to a blue ramp (light transparent blue -> dark navy). Cached 10 min.
$f = $_GET['f'] ?? ''; $z = (int)($_GET['z'] ?? -1); $x = (int)($_GET['x'] ?? -1); $y = (int)($_GET['y'] ?? -1);
if (!preg_match('/^[A-Za-z0-9]{1,40}$/', $f) || $z < 0 || $z > 7 || $x < 0 || $y < 0) { http_response_code(400); exit; }
$dir = sys_get_temp_dir() . '/radar_tiles'; @mkdir($dir);
$cache = "$dir/$f-$z-$x-$y.png";
header('Content-Type: image/png'); header('Cache-Control: public, max-age=600');
if (is_file($cache) && filemtime($cache) > time() - 600) { readfile($cache); exit; }
$ch = curl_init("https://tilecache.rainviewer.com/v2/radar/$f/256/$z/$x/$y/2/1_0.png");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4]);
$raw = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
if (!$raw || $code != 200) { http_response_code(502); exit; }
if (!function_exists('imagecreatefromstring')) { echo $raw; exit; }
$im = @imagecreatefromstring($raw); if (!$im) { echo $raw; exit; }
$w = imagesx($im); $h = imagesy($im);
$out = imagecreatetruecolor($w, $h); imagealphablending($out, false); imagesavealpha($out, true);
imagefill($out, 0, 0, imagecolorallocatealpha($out, 0, 0, 0, 127));
$PAL = [[-10,0x636159],[-9,0x66635a],[-8,0x69665c],[-7,0x6c685d],[-6,0x6f6b5f],[-5,0x726e61],[-4,0x757062],[-3,0x787364],[-2,0x7c7565],[-1,0x7f7867],[0,0x827b69],[1,0x857d6a],[2,0x88806c],[3,0x8b826d],[4,0x8e856f],[5,0x928871],[6,0x9e9375],[7,0xaa9e79],[8,0xb6a97e],[9,0xc2b482],[10,0xcec087],[11,0xd2c48b],[12,0xd6c88f],[13,0xdacc93],[14,0xded097],[15,0x88ddee],[16,0x6cd1eb],[17,0x51c5e8],[18,0x36bae5],[19,0x1baee2],[20,0x00a3e0],[21,0x009ad5],[22,0x0091ca],[23,0x0088bf],[24,0x007fb4],[25,0x0077aa],[26,0x0070a3],[27,0x00699c],[28,0x006295],[29,0x005b8e],[30,0x005588],[31,0x005180],[32,0x004e78],[33,0x004a70],[34,0x004768],[35,0xffee00],[36,0xffe000],[37,0xffd200],[38,0xffc500],[39,0xffb700],[40,0xffaa00],[41,0xff9f00],[42,0xff9500],[43,0xff8b00],[44,0xff8100],[45,0xff4400],[46,0xf23600],[47,0xe62800],[48,0xd91b00],[49,0xcd0d00],[50,0xc10000],[51,0xa80000],[52,0x8f0000],[53,0x760000],[54,0x5d0000],[55,0xffaaff],[56,0xff9fff],[57,0xff95ff],[58,0xff8bff],[59,0xff81ff],[60,0xff77ff],[61,0xff6cff],[62,0xff62ff],[63,0xff58ff],[64,0xff4eff],[65,0xffffff],[66,0xffffff],[67,0xffffff],[68,0xffffff],[69,0xffffff],[70,0xffffff],[71,0xffffff],[72,0xffffff],[73,0xffffff],[74,0xffffff],[75,0x00ff00],[76,0x00ff00],[77,0x00ff00],[78,0x00ff00],[79,0x00ff00],[80,0x00ff00],[81,0x00ff00],[82,0x00ff00],[83,0x00ff00],[84,0x00ff00],[85,0x00ff00],[86,0x00ff00],[87,0x00ff00],[88,0x00ff00],[89,0x00ff00],[90,0x00ff00],[91,0x00ff00],[92,0x00ff00],[93,0x00ff00],[94,0x00ff00],[95,0x00ff00]];
$STOPS = [[-10,191,219,254,.15],[10,147,197,253,.35],[25,59,130,246,.6],[40,29,78,216,.8],[55,30,58,138,.92],[65,23,37,84,.97]];
function blue($d, $S) { if ($d <= $S[0][0]) return $S[0]; for ($i = 1; $i < count($S); $i++) { $a = $S[$i-1]; $b = $S[$i]; if ($d <= $b[0]) { $t = ($d-$a[0])/($b[0]-$a[0]); $r = []; for ($k = 0; $k < 5; $k++) $r[$k] = $a[$k] + ($b[$k]-$a[$k])*$t; return $r; } } return $S[count($S)-1]; }
$lut = [];
for ($j = 0; $j < $h; $j++) for ($i = 0; $i < $w; $i++) {
  $c = imagecolorsforindex($im, imagecolorat($im, $i, $j));
  $a = 255 - (int)round($c['alpha'] * 255 / 127); if ($a <= 0) continue;
  $key = ($c['red'] << 16) | ($c['green'] << 8) | $c['blue'];
  if (!isset($lut[$key])) { $best = 0; $bd = PHP_INT_MAX; foreach ($PAL as $p) { $dr = $c['red'] - ($p[1] >> 16); $dg = $c['green'] - (($p[1] >> 8) & 255); $db = $c['blue'] - ($p[1] & 255); $dd = $dr*$dr + $dg*$dg + $db*$db; if ($dd < $bd) { $bd = $dd; $best = $p[0]; } } $lut[$key] = blue($best, $STOPS); }
  $b = $lut[$key]; $oa = $a < 200 ? $b[4] * $a / 255 : $b[4];
  imagesetpixel($out, $i, $j, imagecolorallocatealpha($out, (int)round($b[1]), (int)round($b[2]), (int)round($b[3]), 127 - (int)round($oa * 127)));
}
ob_start(); imagepng($out); $png = ob_get_clean(); @file_put_contents($cache, $png); echo $png;
