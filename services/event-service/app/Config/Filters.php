<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

class Filters extends BaseConfig
{
    public $aliases = [
        'csrf'     => \CodeIgniter\Filters\CSRF::class,
        'toolbar'  => \CodeIgniter\Filters\DebugToolbar::class,
        'honeypot' => \CodeIgniter\Filters\Honeypot::class,
        'invalidchars' => \CodeIgniter\Filters\InvalidChars::class,
        'secureheaders' => \CodeIgniter\Filters\SecureHeaders::class,

        // custom
        'jwt'      => \App\Filters\JwtFilter::class,
    ];

    // 🔥 PENTING: kosongkan dulu biar tidak error alias
    public $required = [
        'before' => [],
        'after'  => [
            'toolbar',
        ],
    ];

    public $globals = [
        'before' => [],
        'after'  => [],
    ];

    public $methods = [];

    public $filters = [];
}