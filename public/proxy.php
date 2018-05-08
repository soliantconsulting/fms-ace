<?php
require '../vendor/autoload.php';

$jsonString = file_get_contents("./fms-ace-config.json");
$proxyConfig = json_decode($jsonString, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    die('Invalid JSON syntax in fms-ace-config.json.');
}

$whitelist = array_key_exists('fmsHosts', $proxyConfig)
    ? $proxyConfig['fmsHosts']
    : [];

$sslVerify = array_key_exists('sslVerify', $proxyConfig)
    ? (bool) $proxyConfig['sslVerify']
    : true;

$curlOpts = [
    CURLOPT_SSL_VERIFYPEER => $sslVerify ? 1 : 0,
    CURLOPT_SSL_VERIFYHOST => $sslVerify ? 2 : 0,
];

Geekality\CrossOriginProxy::proxy($whitelist, $curlOpts);
