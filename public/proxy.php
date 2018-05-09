<?php

require '../vendor/autoload.php';

$string = file_get_contents("./fms-ace-config.json");

$jsonConfig = json_decode($string, TRUE);

Geekality\CrossOriginProxy::proxy($jsonConfig['proxyServers']);