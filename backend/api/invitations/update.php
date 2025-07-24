<?php
include_once '../../core/initialize.php';

$invitation = new Invitation($db);
$data = json_decode(file_get_contents("php://input"));

if (empty($data->id) || empty($data->title)) {
    http_response_code(400);
    echo json_encode(['message' => 'Error: ID dan Judul undangan tidak boleh kosong.']);
    exit();
}

$invitation->id = $data->id;
$invitation->title = $data->title;
$invitation->theme = $data->theme ?? 'classic_elegant';

try {
    $db->beginTransaction();
    
    $invitation->update();

    $invitation->bride_groom_data = $data->bride_groom_data;
    $invitation->events_data = $data->events_data;
    $invitation->galleries_data = $data->galleries_data ?? [];
    $invitation->stories_data = $data->stories_data ?? [];
    $invitation->gift_data = $data->gift_data ?? [];

    $invitation->createRelatedData($invitation->id);

    $db->commit();
    echo json_encode(['message' => 'Undangan Berhasil Diperbarui']);

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(['message' => 'Gagal memperbarui undangan: ' . $e->getMessage()]);
}
?>
