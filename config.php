<?php
// ===== Your keys =====
// TomTom API key (map + traffic). When set, the Settings panel is hidden.
$TOMTOM_API_KEY = "";
// AISStream API key (ships, https://aisstream.io). Stays on the server, never sent to visitors.
$AISSTREAM_API_KEY = "";
// Trafiklab keys (https://developer.trafiklab.se), both needed for buses and trains:
// "GTFS Sweden 3 Realtime" (vehicle positions)
$TRAFIKLAB_GTFS_RT_KEY = "";
// "Trafiklab Realtime APIs" (line, from/to stops and times)
$TRAFIKLAB_REALTIME_KEY = "";
// Optional: Trafikverket key (https://api.trafikinfo.trafikverket.se) – trains in the whole of Sweden.
$TRAFIKVERKET_API_KEY = "";
// Windy Webcams key (https://api.windy.com/webcams) – webcams on the map. Stays on the server.
$WINDY_API_KEY = "";
// Västtrafik "Planera Resa v4": base64 of "client id:secret" (Basic auth). Token is fetched and cached on the server.
$VASTTRAFIK_AUTH = "";
// Minimum map zoom level before each service fetches data (higher = more zoomed in).
// Below the level nothing is fetched and the markers are hidden.
$MIN_ZOOM = ['flights' => 6, 'ships' => 7, 'transit' => 11, 'ksamsok' => 13];
// =====================

if (realpath($_SERVER['SCRIPT_FILENAME']) === realpath(__FILE__)) {
  header('Content-Type: application/javascript; charset=utf-8');
  header('Cache-Control: no-store');
  echo 'window.TOMTOM_API_KEY = ' . json_encode(trim($TOMTOM_API_KEY)) . ";\n";
  echo 'window.HAS_TRANSIT = ' . (trim($TRAFIKLAB_GTFS_RT_KEY) !== '' || trim($VASTTRAFIK_AUTH) !== '' ? 'true' : 'false') . ";\n";
  echo 'window.HAS_TRAINS = ' . (trim($TRAFIKLAB_GTFS_RT_KEY) !== '' || trim($TRAFIKVERKET_API_KEY) !== '' || trim($VASTTRAFIK_AUTH) !== '' ? 'true' : 'false') . ";\n";
  echo 'window.MIN_ZOOM = ' . json_encode($MIN_ZOOM) . ";\n";
  echo 'window.HAS_AIS = ' . (trim($AISSTREAM_API_KEY) !== '' ? 'true' : 'false') . ";\n";
}
