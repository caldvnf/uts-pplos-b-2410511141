public string $filesPath;
public array $default = [
    'DSN'          => '',
    'hostname'     => env('DB_HOST', 'localhost'),
    'username'     => env('DB_USER', 'root'),
    'password'     => env('DB_PASS', ''),
    'database'     => env('DB_NAME', 'event_db'),
    'DBDriver'     => 'MySQLi',
    'DBPrefix'     => '',
    'pConnect'     => false,
    'DBDebug'      => true,
    'charset'      => 'utf8mb4',
    'DBCollat'     => 'utf8mb4_general_ci',
    'swapPre'      => '',
    'encrypt'      => false,
    'compress'     => false,
    'strictOn'     => false,
    'failover'     => [],
    'port'         => (int) env('DB_PORT', 3306),
    'numberNative' => false,
    'foundRows'    => false,
];

public function __construct()
{
    parent::__construct();

    $this->filesPath = APPPATH . 'Database' . DIRECTORY_SEPARATOR;

    $this->default = [
        'DSN'      => '',
        'hostname' => env('DB_HOST', 'localhost'),
        'username' => env('DB_USER', 'root'),
        'password' => env('DB_PASS', ''),
        'database' => env('DB_NAME', 'event_db'),
        'DBDriver' => 'MySQLi',
        'DBPrefix' => '',
        'pConnect' => false,
        'DBDebug'  => true,
        'charset'  => 'utf8mb4',
        'DBCollat' => 'utf8mb4_general_ci',
        'swapPre'  => '',
        'encrypt'  => false,
        'compress' => false,
        'strictOn' => false,
        'failover' => [],
        'port'     => (int) env('DB_PORT', 3306),
    ];

    if (ENVIRONMENT === 'testing') {
        $this->defaultGroup = 'tests';
    }
}