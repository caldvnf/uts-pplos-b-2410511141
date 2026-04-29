<?php

namespace App\Models;

use CodeIgniter\Model;

class EventModel extends Model
{
    protected $table      = 'events';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'organizer_id', 'judul', 'deskripsi', 'lokasi',
        'tanggal_mulai', 'tanggal_selesai', 'banner_url',
        'status', 'dibuat_oleh',
    ];

    public function ambilSemuaEvent(array $filter = [], int $page = 1, int $perPage = 10): array
    {
        $builder = $this->db->table('events e')
            ->select('e.*, o.nama as nama_organizer')
            ->join('organizers o', 'o.id = e.organizer_id', 'left')
            ->join('event_categories ec', 'ec.id = e.category_id', 'left');

        if (!empty($filter['status'])) {
            $builder->where('e.status', $filter['status']);
        }

        if (!empty($filter['search'])) {
            $builder->like('e.judul', $filter['search']);
        }

        if (!empty($filter['lokasi'])) {
            $builder->like('e.lokasi', $filter['lokasi']);
        }

        if (!empty($filter['kategori'])) {
            $builder->where('ec.nama', $filter['kategori']);
}

        $total = $builder->countAllResults(false);

        $offset = ($page - 1) * $perPage;
        $data   = $builder->limit($perPage, $offset)
                          ->orderBy('e.tanggal_mulai', 'ASC')
                          ->get()
                          ->getResultArray();

        return [
            'data'     => $data,
            'total'    => $total,
            'page'     => $page,
            'per_page' => $perPage,
            'total_pages' => ceil($total / $perPage),
        ];
    }

    public function ambilEventById(int $id): ?array
    {
        $event = $this->db->table('events e')
            ->select('e.*, o.nama as nama_organizer, o.email as email_organizer')
            ->join('organizers o', 'o.id = e.organizer_id', 'left')
            ->where('e.id', $id)
            ->get()
            ->getRowArray();

        if (!$event) return null;

        $event['kategori_tiket'] = $this->db->table('ticket_categories')
            ->where('event_id', $id)
            ->get()
            ->getResultArray();

        $event['kategori_event'] = $this->db->table('event_categories ec')
            ->select('ec.id, ec.nama, ec.deskripsi')
            ->join('events e', 'e.category_id = ec.id', 'left')
            ->where('e.id', $id)
            ->get()
            ->getRowArray();

        return $event;
    }
}