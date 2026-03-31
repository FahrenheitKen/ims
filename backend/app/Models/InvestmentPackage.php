<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvestmentPackage extends Model
{
    protected $fillable = [
        'name', 'min_amount', 'max_amount', 'interest_rate',
        'features', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'min_amount'    => 'decimal:0',
            'max_amount'    => 'decimal:0',
            'interest_rate' => 'decimal:4',
            'features'      => 'array',
            'is_active'     => 'boolean',
        ];
    }
}
