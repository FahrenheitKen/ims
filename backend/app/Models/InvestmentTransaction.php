<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvestmentTransaction extends Model
{
    protected $fillable = ['investor_id', 'contract_id', 'type', 'amount', 'date', 'note'];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'date' => 'date',
        ];
    }

    public function investor(): BelongsTo
    {
        return $this->belongsTo(Investor::class);
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Contract::class);
    }
}
