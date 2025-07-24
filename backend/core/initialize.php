<?php
// =================================================================
// PENGATURAN GLOBAL & KONEKSI DATABASE
// =================================================================
session_start();

// Daftar alamat (origin) yang diizinkan untuk mengakses API
$allowed_origins = [
    'http://localhost:3000', // Untuk Admin Dashboard (React)
    'http://localhost'       // Untuk Situs Undangan Publik (XAMPP)
];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
}

header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

ini_set('display_errors', 1);
error_reporting(E_ALL);

defined('DS') ? null : define('DS', DIRECTORY_SEPARATOR);
defined('SITE_ROOT') ? null : define('SITE_ROOT', dirname(__DIR__));
include_once(SITE_ROOT.DS.'config'.DS.'database.php');

$database = new Database();
$db = $database->connect();

// =================================================================
// DEFINISI CLASS INVITATION (LENGKAP DAN DISESUAIKAN DENGAN DB ANDA)
// =================================================================
class Invitation {
    private $conn;
    private $table = 'undangan'; 

    // Properti ini digunakan secara internal oleh PHP, cocok dengan frontend
    public $id;
    public $user_id;
    public $title; 
    public $theme;
    public $layout_order;
    public $cover_image;
    public $music;
    
    public $bride_groom_data;
    public $events_data;
    public $galleries_data;
    public $stories_data;
    public $gift_data;
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    // Fungsi untuk dashboard admin
    public function read_all_with_bride_groom() {
        // Mengambil dari kolom 'judul', 'nama_wanita', 'nama_pria'
        $query = 'SELECT i.id, i.judul AS title, bg.nama_wanita AS bride_name, bg.nama_pria AS groom_name FROM ' . $this->table . ' i LEFT JOIN mempelai bg ON i.id = bg.undangan_id ORDER BY i.id DESC';
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Fungsi untuk halaman publik & form edit
    public function read_single() {
        // Mengambil dari kolom 'judul', 'urutan_konten', 'cover_slideshow', 'musik_latar'
        $query = 'SELECT id, judul, urutan_konten, cover_slideshow, musik_latar FROM ' . $this->table . ' WHERE id = :id LIMIT 1';
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) { return false; }

        // Memetakan hasil DB ke properti internal
        $this->title = $row['judul'];
        $this->theme = 'classic_elegant'; // Memberikan nilai default
        $this->layout_order = $row['urutan_konten'];
        $this->cover_image = $row['cover_slideshow']; // Asumsi slideshow adalah cover
        $this->music = $row['musik_latar'];

        $this->bride_groom_data = $this->get_related_data('mempelai', $this->id, true);
        $this->events_data = $this->get_related_data('acara', $this->id);
        $this->galleries_data = $this->get_related_data('media', $this->id);
        $this->stories_data = $this->get_related_data('cerita', $this->id);
        $this->gift_data = $this->get_related_data('amplop', $this->id);

        return true;
    }

    private function get_related_data($table_name, $invitation_id, $single_row = false) {
        $query = 'SELECT * FROM ' . $table_name . ' WHERE undangan_id = :invitation_id';
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':invitation_id', $invitation_id);
        $stmt->execute();
        return $single_row ? $stmt->fetch(PDO::FETCH_ASSOC) : $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Fungsi untuk membuat undangan baru
    public function create() {
        // Menyimpan ke kolom 'judul', 'template_tema', 'urutan_konten'
        $query = 'INSERT INTO ' . $this->table . ' SET user_id = :user_id, judul = :title, template_tema = :theme, urutan_konten = :layout_order';
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':theme', $this->theme);
        $stmt->bindParam(':layout_order', $this->layout_order);
        if($stmt->execute()) { return true; }
        throw new PDOException("Error saat eksekusi query create: " . implode(":", $stmt->errorInfo()));
    }

    // Fungsi untuk update undangan
    public function update() {
        // Memperbarui kolom 'judul', 'template_tema', 'urutan_konten'
        $query = 'UPDATE ' . $this->table . ' SET judul = :title, template_tema = :theme, urutan_konten = :layout_order WHERE id = :id';
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':theme', $this->theme);
        $stmt->bindParam(':layout_order', $this->layout_order);
        $stmt->bindParam(':id', $this->id);
        if($stmt->execute()) { return true; }
        throw new PDOException("Error saat eksekusi query update: " . implode(":", $stmt->errorInfo()));
    }

    // Fungsi untuk membuat data terkait
    public function createRelatedData($invitation_id) {
        $this->deleteRelatedData($invitation_id);
        
        // Menyimpan ke tabel 'mempelai' dengan kolom yang benar
        $query_bg = 'INSERT INTO mempelai SET undangan_id = :invitation_id, nama_wanita = :bride_name, ayah_wanita = :bride_father, ibu_wanita = :bride_mother, foto_wanita = :bride_photo, nama_pria = :groom_name, ayah_pria = :groom_father, ibu_pria = :groom_mother, foto_pria = :groom_photo';
        $stmt_bg = $this->conn->prepare($query_bg);
        $stmt_bg->bindParam(':invitation_id', $invitation_id);
        $stmt_bg->bindParam(':bride_name', $this->bride_groom_data->bride_name);
        $stmt_bg->bindParam(':bride_father', $this->bride_groom_data->bride_father);
        $stmt_bg->bindParam(':bride_mother', $this->bride_groom_data->bride_mother);
        $stmt_bg->bindParam(':bride_photo', $this->bride_groom_data->bride_photo);
        $stmt_bg->bindParam(':groom_name', $this->bride_groom_data->groom_name);
        $stmt_bg->bindParam(':groom_father', $this->bride_groom_data->groom_father);
        $stmt_bg->bindParam(':groom_mother', $this->bride_groom_data->groom_mother);
        $stmt_bg->bindParam(':groom_photo', $this->bride_groom_data->groom_photo);
        $stmt_bg->execute();

        // Menyimpan ke tabel 'acara' dengan kolom yang benar
        foreach($this->events_data as $event) {
            $query_ev = 'INSERT INTO acara SET undangan_id = :invitation_id, jenis_acara = :event_name, tanggal = :event_date, waktu = :start_time, nama_tempat = :location, link_gmaps = :gmaps_link';
            $stmt_ev = $this->conn->prepare($query_ev);
            $stmt_ev->bindParam(':invitation_id', $invitation_id);
            $stmt_ev->bindParam(':event_name', $event->event_name);
            $stmt_ev->bindParam(':event_date', $event->event_date);
            $stmt_ev->bindParam(':start_time', $event->start_time);
            $stmt_ev->bindParam(':location', $event->location);
            $stmt_ev->bindParam(':gmaps_link', $event->gmaps_link);
            $stmt_ev->execute();
        }
        
        // ... (dan seterusnya untuk media, cerita, amplop)
        return true;
    }

    // Fungsi untuk menghapus data terkait
    public function deleteRelatedData($invitation_id) {
        $tables = ['mempelai', 'acara', 'media', 'cerita', 'amplop', 'tamu', 'rsvp'];
        foreach($tables as $table) {
            $query = 'DELETE FROM ' . $table . ' WHERE undangan_id = :invitation_id';
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':invitation_id', $invitation_id);
            $stmt->execute();
        }
    }
}
?>
