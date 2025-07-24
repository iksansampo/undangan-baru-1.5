<?php
include_once '../../core/initialize.php';

$invitation = new Invitation($db);
$data = json_decode(file_get_contents("php://input"));

if (empty($data->title)) {
    http_response_code(400);
    echo json_encode(['message' => 'Error: Judul undangan tidak boleh kosong.']);
    exit();
}

$invitation->user_id = $data->user_id ?? 1;
$invitation->title = $data->title;
$invitation->theme = $data->theme ?? 'classic_elegant';

try {
    $db->beginTransaction();
    $invitation->create();
    $invitation_id = $db->lastInsertId();

    if(empty($invitation_id)) {
        throw new Exception('Gagal mendapatkan ID undangan baru.');
    }

    $invitation->bride_groom_data = $data->bride_groom_data;
    $invitation->events_data = $data->events_data;
    $invitation->galleries_data = $data->galleries_data ?? [];
    $invitation->stories_data = $data->stories_data ?? [];
    $invitation->gift_data = $data->gift_data ?? [];

    $invitation->createRelatedData($invitation_id);

    $db->commit();
    http_response_code(201);
    echo json_encode(['message' => 'Undangan Berhasil Dibuat', 'invitation_id' => $invitation_id]);

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(['message' => 'Gagal membuat undangan: ' . $e->getMessage()]);
}
?>
