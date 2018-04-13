<?php

require '../vendor/autoload.php';

Geekality\CrossOriginProxy::proxy([
    ['host' => 'soliant-fms-02.soliant.cloud', 'scheme' => 'https'],
]);