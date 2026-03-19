<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('schedules:mark-overdue')->daily();
