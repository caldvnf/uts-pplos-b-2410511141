<?php

namespace App\Filters;

use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Filters\FilterInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $authHeader = $request->getHeaderLine('Authorization');
        $token = null;

        if (!empty($authHeader) && str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7);
        }

        $userIdFromGateway = $request->getHeaderLine('X-User-Id');

        if (!$token && !$userIdFromGateway) {
            return service('response')->setStatusCode(401)->setJSON([
                'status'  => 'error',
                'message' => 'Token tidak ditemukan',
            ]);
        }

        if ($userIdFromGateway) {
            return;
        }

        try {
            $secret = getenv('JWT_SECRET');
            if (!$secret) {
                throw new \Exception('JWT_SECRET tidak ditemukan');
            }

            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
            $request->user = $decoded;

        } catch (\Exception $e) {
            return service('response')->setStatusCode(401)->setJSON([
                'status'  => 'error',
                'message' => 'Token tidak valid: ' . $e->getMessage(),
            ]);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}