<?php
// Sertakan file inisialisasi utama
include_once '../../core/initialize.php';

// Validasi ID undangan dari URL, pastikan ada
if (!isset($_GET['id'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['message' => 'Error: ID Undangan tidak disertakan.']);
    exit();
}

// Buat instance Invitation dan set ID-nya dari URL
$invitation = new Invitation($db);
$invitation->id = $_GET['id'];

try {
    // Panggil fungsi untuk mengambil semua data detail undangan
    if ($invitation->read_single()) {
        // Jika data ditemukan, buat array untuk respons JSON
        $invitation_arr = [
            'id' => (int)$invitation->id,
            'title' => $invitation->title,
            'theme' => $invitation->theme,
            'layout_order' => $invitation->layout_order,
            'cover_image' => $invitation->cover_image,
            'music' => $invitation->music,
            'bride_groom_data' => $invitation->bride_groom_data,
            'events_data' => $invitation->events_data,
            'galleries_data' => $invitation->galleries_data,
            'stories_data' => $invitation->stories_data,
            'gift_data' => $invitation->gift_data
        ];
        // Kirim data sebagai JSON
        echo json_encode($invitation_arr);
    } else {
        // Jika tidak ada undangan dengan ID tersebut
        http_response_code(404); // Not Found
        echo json_encode(['message' => 'Undangan tidak ditemukan.']);
    }
} catch (PDOException $e) {
    // Tangkap error jika terjadi masalah dengan database
    http_response_code(500);
    echo json_encode(['message' => 'Database Error di read_single.php: ' . $e->getMessage()]);
}
?>
