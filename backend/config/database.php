<?php
    class Database {
        // DB Params
        private $host = 'localhost';
        private $db_name = 'undangan_db'; // Pastikan nama ini sudah benar
        private $username = 'root';
        private $password = '';
        private $conn;

        // DB Connect
        public function connect(){
            $this->conn = null;

            try {
                // **PERBAIKAN KUNCI**: Menambahkan charset=utf8mb4 ke DSN
                $dsn = 'mysql:host=' . $this->host . ';dbname=' . $this->db_name . ';charset=utf8mb4';
                $this->conn = new PDO($dsn, $this->username, $this->password);
                $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            } catch(PDOException $e) {
                die('Connection Error: ' . $e->getMessage());
            }

            return $this->conn;
        }
    }
?>
