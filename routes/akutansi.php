<?php

use App\Http\Controllers\Akutansi\PendapatanRajalController;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\CheckRole;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;


Route::prefix('akutansi')->group(function () {
    Route::get('/pendapatan-rajal', [PendapatanRajalController::class, 'index'])->name('akt.pendapatan_rajal.index');
    Route::get('/pendapatan-rajal-data', [PendapatanRajalController::class, 'index_data'])->name('akt.pendapatan_rajal.index_data');
});
