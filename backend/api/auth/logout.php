<?php
// Selalu mulai session sebelum mengaksesnya
session_start();

// Hapus semua variabel session
$_SESSION = array();

// Hancurkan session
if (session_destroy()) {
    // Kirim respons sukses
    http_response_code(200);
    echo json_encode(array("message" => "Logout berhasil."));
} else {
    // Kirim respons gagal
    http_response_code(500);
    echo json_encode(array("message" => "Logout gagal."));
}
?>
