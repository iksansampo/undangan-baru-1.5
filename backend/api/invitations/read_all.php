<?php
// Sertakan file inisialisasi utama
include_once '../../core/initialize.php';

try {
    $invitation = new Invitation($db);
    $result = $invitation->read_all_with_bride_groom();
    
    $invitations = $result->fetchAll(PDO::FETCH_ASSOC);

    // Kirim respons dengan data yang ditemukan
    echo json_encode(['data' => $invitations]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Database Error di read_all.php: ' . $e->getMessage()]);
}
?>
