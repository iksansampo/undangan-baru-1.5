<?php
// Sertakan file inisialisasi utama
include_once '../../core/initialize.php';

// Validasi ID undangan dari URL
if (!isset($_GET['invitation_id'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Error: ID Undangan tidak disertakan.']);
    exit();
}

$invitation_id = $_GET['invitation_id'];

// **PERBAIKAN**: Mengambil dari kolom 'nama_tamu' dan menamainya 'guest_name' untuk frontend
$query = 'SELECT id, nama_tamu AS guest_name FROM tamu WHERE undangan_id = :invitation_id ORDER BY id DESC';

try {
    $stmt = $db->prepare($query);
    $stmt->bindParam(':invitation_id', $invitation_id);
    $stmt->execute();
    
    $guests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['data' => $guests]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Database Error saat membaca tamu: ' . $e->getMessage()]);
}
?>
