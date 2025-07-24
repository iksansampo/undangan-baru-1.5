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

// **PERBAIKAN KUNCI**: Menggunakan nama kolom yang benar dari daftar Anda
// dan menamainya kembali (AS) agar sesuai dengan frontend.
$query = 'SELECT 
            id, 
            nama_tamu AS guest_name, 
            kehadiran AS attendance, 
            ucapan AS message, 
            waktu AS created_at 
          FROM 
            rsvp 
          WHERE 
            undangan_id = :invitation_id 
          ORDER BY 
            waktu DESC';

try {
    $stmt = $db->prepare($query);
    $stmt->bindParam(':invitation_id', $invitation_id);
    $stmt->execute();
    
    $rsvps = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['data' => $rsvps]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Database Error saat membaca RSVP: ' . $e->getMessage()]);
}
?>
