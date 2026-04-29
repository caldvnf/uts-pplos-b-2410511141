<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');


$routes->post('events/internal/kurangi-kuota', 'EventController::kurangiKuota');

$routes->group('events', ['filter' => 'jwt'], function ($routes) {
    $routes->get('/',          'EventController::index');
    $routes->get('(:num)',     'EventController::show/$1');
    $routes->post('/',         'EventController::create');
    $routes->put('(:num)',     'EventController::update/$1');
    $routes->delete('(:num)',  'EventController::delete/$1');
    $routes->get('(:num)/categories', 'EventController::categories/$1');
});