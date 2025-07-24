<?php
// Sertakan file inisialisasi utama
include_once '../../core/initialize.php';

// Ambil data JSON yang dikirim dari frontend
$data = json_decode(file_get_contents("php://input"));

// Validasi data
if (empty($data->invitation_id) || empty($data->guest_name)) {
    http_response_code(400);
    echo json_encode(['message' => 'Error: ID Undangan dan Nama Tamu tidak boleh kosong.']);
    exit();
}

// **PERBAIKAN**: Menggunakan nama kolom 'undangan_id' dan 'nama_tamu'
$query = 'INSERT INTO tamu SET undangan_id = :invitation_id, nama_tamu = :guest_name';

try {
    $stmt = $db->prepare($query);

    // Bersihkan data
    $invitation_id = htmlspecialchars(strip_tags($data->invitation_id));
    $guest_name = htmlspecialchars(strip_tags($data->guest_name));

    // Bind data ke parameter query
    $stmt->bindParam(':invitation_id', $invitation_id);
    $stmt->bindParam(':guest_name', $guest_name);

    // Eksekusi query
    $stmt->execute();
    echo json_encode(['message' => 'Tamu berhasil ditambahkan']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Database Error saat menambah tamu: ' . $e->getMessage()]);
}
?>
