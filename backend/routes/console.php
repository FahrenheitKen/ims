<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('schedules:mark-overdue')->daily();
Schedule::command('contracts:auto-complete')->daily();
