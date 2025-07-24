<?php
// Sertakan file inisialisasi utama
include_once '../../core/initialize.php';

// Ambil data JSON yang dikirim dari frontend
$data = json_decode(file_get_contents("php://input"));

// Validasi data
if (empty($data->invitation_id) || empty($data->guest_name) || empty($data->attendance)) {
    http_response_code(400);
    echo json_encode(['message' => 'Data tidak lengkap.']);
    exit();
}

// **PERBAIKAN KUNCI**: Menggunakan nama kolom yang benar dari daftar Anda
$query = 'INSERT INTO rsvp 
          SET 
            undangan_id = :invitation_id, 
            nama_tamu = :guest_name, 
            kehadiran = :attendance, 
            ucapan = :message';

try {
    $stmt = $db->prepare($query);

    // Bersihkan data
    $invitation_id = htmlspecialchars(strip_tags($data->invitation_id));
    $guest_name = htmlspecialchars(strip_tags($data->guest_name));
    $attendance = htmlspecialchars(strip_tags($data->attendance));
    $message = htmlspecialchars(strip_tags($data->message ?? '')); // Ucapan bisa kosong

    // Bind data
    $stmt->bindParam(':invitation_id', $invitation_id);
    $stmt->bindParam(':guest_name', $guest_name);
    $stmt->bindParam(':attendance', $attendance);
    $stmt->bindParam(':message', $message);

    $stmt->execute();
    
    // Kirim pesan sukses yang berbeda agar frontend tahu
    echo json_encode(['message' => 'RSVP submitted']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Database Error saat menyimpan RSVP: ' . $e->getMessage()]);
}
?>
