<?php
// Sertakan file inisialisasi utama
include_once '../../core/initialize.php';

// Ambil data JSON yang dikirim dari frontend
$data = json_decode(file_get_contents("php://input"));

// Validasi data
if (empty($data->id)) {
    http_response_code(400);
    echo json_encode(['message' => 'Error: ID Tamu tidak boleh kosong.']);
    exit();
}

// Siapkan query untuk menghapus data dari tabel 'tamu'
$query = 'DELETE FROM tamu WHERE id = :id';

try {
    $stmt = $db->prepare($query);
    $id = htmlspecialchars(strip_tags($data->id));
    $stmt->bindParam(':id', $id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        echo json_encode(['message' => 'Tamu berhasil dihapus']);
    } else {
        echo json_encode(['message' => 'Tamu tidak ditemukan atau sudah dihapus']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Database Error saat menghapus tamu: ' . $e->getMessage()]);
}
?>
