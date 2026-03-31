<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewContractRequest extends Model
{
    protected $fillable = [
        'investor_id', 'amount', 'proposed_start_date', 'note',
        'status', 'admin_note', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:0',
        'proposed_start_date' => 'date',
        'reviewed_at' => 'datetime',
    ];

    public function investor(): BelongsTo
    {
        return $this->belongsTo(Investor::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
