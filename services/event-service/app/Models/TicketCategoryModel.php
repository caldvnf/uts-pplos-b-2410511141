<?php

namespace App\Models;

use CodeIgniter\Model;

class TicketCategoryModel extends Model
{
    protected $table         = 'ticket_categories';
    protected $primaryKey    = 'id';
    protected $allowedFields = [
        'event_id', 'nama', 'deskripsi',
        'harga', 'kuota', 'terjual',
    ];

    public function ambilByEventId(int $eventId): array
    {
        return $this->where('event_id', $eventId)->findAll();
    }

    public function kurangiKuota(int $categoryId, int $jumlah = 1): bool
    {
        return $this->db->query(
            'UPDATE ticket_categories 
             SET terjual = terjual + ? 
             WHERE id = ? AND (kuota - terjual) >= ?',
            [$jumlah, $categoryId, $jumlah]
        );
    }
}