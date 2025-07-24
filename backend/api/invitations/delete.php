<?php
include_once '../../core/initialize.php';

$invitation = new Invitation($db);

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->id)) {
    http_response_code(400);
    echo json_encode(['message' => 'Error: ID undangan tidak disertakan.']);
    exit();
}

$invitation->id = $data->id;

try {
    if ($invitation->delete()) {
        echo json_encode(['message' => 'Undangan berhasil dihapus']);
    } else {
        throw new Exception('Fungsi delete gagal tanpa exception.');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Gagal menghapus undangan: ' . $e->getMessage()]);
}
?>
