<?php
// Sertakan file inisialisasi utama
// File ini sudah menangani koneksi DB, CORS, dan session_start()
include_once '../../core/initialize.php';

// Ambil data JSON yang dikirim dari frontend
$data = json_decode(file_get_contents("php://input"));

// Validasi data input
if (empty($data->username) || empty($data->password)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Username dan password tidak boleh kosong.']);
    exit();
}

try {
    // Siapkan query untuk mencari user berdasarkan username
    // Asumsi tabel Anda bernama 'users' dengan kolom 'username' dan 'password'
    $query = 'SELECT id, username, password FROM users WHERE username = :username LIMIT 1';
    $stmt = $db->prepare($query);

    // Bersihkan dan bind username
    $username = htmlspecialchars(strip_tags($data->username));
    $stmt->bindParam(':username', $username);
    
    $stmt->execute();

    // Cek apakah user ditemukan
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $hashed_password = $user['password'];

        // Verifikasi password yang diinput dengan hash di database
        if (password_verify($data->password, $hashed_password)) {
            // Jika password benar, set session
            $_SESSION['loggedin'] = true;
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];

            // Kirim respons sukses
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Login berhasil.']);
        } else {
            // Jika password salah
            http_response_code(401); // Unauthorized
            echo json_encode(['success' => false, 'message' => 'Username atau password salah.']);
        }
    } else {
        // Jika username tidak ditemukan
        http_response_code(401); // Unauthorized
        echo json_encode(['success' => false, 'message' => 'Username atau password salah.']);
    }

} catch (PDOException $e) {
    // Tangkap error jika terjadi masalah dengan database
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>
