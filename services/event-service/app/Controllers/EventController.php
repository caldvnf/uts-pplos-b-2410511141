<?php

namespace App\Controllers;

use App\Models\EventModel;
use App\Models\TicketCategoryModel;
use CodeIgniter\HTTP\ResponseInterface;

class EventController extends BaseController
{
    protected EventModel          $eventModel;
    protected TicketCategoryModel $categoryModel;

    public function __construct()
    {
        $this->eventModel    = new EventModel();
        $this->categoryModel = new TicketCategoryModel();
    }

    // GET /events 
    public function index(): ResponseInterface
    {
        $page    = (int) ($this->request->getGet('page')     ?? 1);
        $perPage = (int) ($this->request->getGet('per_page') ?? 10);

        $perPage = min($perPage, 50);

        $filter = [
            'status' => $this->request->getGet('status'),
            'search' => $this->request->getGet('search'),
            'lokasi' => $this->request->getGet('lokasi'),
        ];

        $hasil = $this->eventModel->ambilSemuaEvent($filter, $page, $perPage);

        return $this->response->setStatusCode(200)->setJSON([
            'status'  => 'success',
            'data'    => $hasil['data'],
            'paging'  => [
                'page'        => $hasil['page'],
                'per_page'    => $hasil['per_page'],
                'total'       => $hasil['total'],
                'total_pages' => $hasil['total_pages'],
            ],
        ]);
    }

    // GET /events/:id 
    public function show(int $id): ResponseInterface
    {
        $event = $this->eventModel->ambilEventById($id);

        if (!$event) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Event tidak ditemukan',
            ]);
        }

        return $this->response->setStatusCode(200)->setJSON([
            'status' => 'success',
            'data'   => $event,
        ]);
    }

    // POST /events 
    public function create(): ResponseInterface
    {
        $userId   = $this->request->getHeaderLine('X-User-Id');
        $userRole = $this->request->getHeaderLine('X-User-Role');

        if ($userRole !== 'admin') {
            return $this->response->setStatusCode(403)->setJSON([
                'status'  => 'error',
                'message' => 'Hanya admin yang bisa membuat event',
            ]);
        }

        $body = $this->request->getJSON(true);

        $rules = [
            'organizer_id'    => 'required|integer',
            'judul'           => 'required|min_length[3]|max_length[200]',
            'lokasi'          => 'required|min_length[3]',
            'tanggal_mulai'   => 'required',
            'tanggal_selesai' => 'required',
        ];

        if (!$this->validate($rules, $body)) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Validasi gagal',
                'errors'  => $this->validator->getErrors(),
            ]);
        }

        $body['dibuat_oleh'] = $userId;
        $body['status']      = $body['status'] ?? 'draft';

        $id = $this->eventModel->insert($body);

        $eventBaru = $this->eventModel->ambilEventById($id);

        return $this->response->setStatusCode(201)->setJSON([
            'status'  => 'success',
            'message' => 'Event berhasil dibuat',
            'data'    => $eventBaru,
        ]);
    }

    // ── PUT /events/:id ───────────────────────────────────
    public function update(int $id): ResponseInterface
    {
        $userRole = $this->request->getHeaderLine('X-User-Role');

        if ($userRole !== 'admin') {
            return $this->response->setStatusCode(403)->setJSON([
                'status'  => 'error',
                'message' => 'Hanya admin yang bisa mengubah event',
            ]);
        }

        $event = $this->eventModel->find($id);
        if (!$event) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Event tidak ditemukan',
            ]);
        }

        $body = $this->request->getJSON(true);
        $this->eventModel->update($id, $body);

        return $this->response->setStatusCode(200)->setJSON([
            'status'  => 'success',
            'message' => 'Event berhasil diperbarui',
            'data'    => $this->eventModel->ambilEventById($id),
        ]);
    }

    // DELETE /events/:id 
    public function delete(int $id): ResponseInterface
    {
        $userRole = $this->request->getHeaderLine('X-User-Role');

        if ($userRole !== 'admin') {
            return $this->response->setStatusCode(403)->setJSON([
                'status'  => 'error',
                'message' => 'Hanya admin yang bisa menghapus event',
            ]);
        }

        $event = $this->eventModel->find($id);
        if (!$event) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Event tidak ditemukan',
            ]);
        }

        $this->eventModel->delete($id);

        return $this->response->setStatusCode(200)->setJSON([
            'status'  => 'success',
            'message' => 'Event berhasil dihapus',
        ]);
    }

    // GET /events/:id/categories 
    public function categories(int $eventId): ResponseInterface
    {
        $event = $this->eventModel->find($eventId);

        if (!$event) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Event tidak ditemukan',
            ]);
        }

        $kategori = $this->categoryModel->ambilByEventId($eventId);

        return $this->response->setStatusCode(200)->setJSON([
            'status' => 'success',
            'data'   => $kategori,
        ]);
    }

    // POST /events/internal/kurangi-kuota
    public function kurangiKuota(): ResponseInterface
    {
        $body        = $this->request->getJSON(true);
        $categoryId  = $body['category_id'] ?? null;
        $jumlah      = $body['jumlah']       ?? 1;

        if (!$categoryId) {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'category_id wajib diisi',
            ]);
        }

        $berhasil = $this->categoryModel->kurangiKuota($categoryId, $jumlah);

        if (!$berhasil) {
            return $this->response->setStatusCode(409)->setJSON([
                'status'  => 'error',
                'message' => 'Kuota tidak mencukupi',
            ]);
        }

        return $this->response->setStatusCode(200)->setJSON([
            'status'  => 'success',
            'message' => 'Kuota berhasil dikurangi',
        ]);
    }
}