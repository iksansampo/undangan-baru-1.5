import api from '../api';

const invitationService = {
    /**
     * Mengambil semua undangan untuk dashboard.
     */
    getAllInvitations: async () => {
        const response = await api.get('/invitations/read_all.php');
        // Pastikan mengembalikan array, bahkan jika kosong
        return response.data.data || [];
    },

    /**
     * Mengambil satu undangan spesifik berdasarkan ID.
     */
    getInvitationById: async (id) => {
        const response = await api.get(`/invitations/read_single.php?id=${id}`);
        return response.data;
    },

    /**
     * Membuat undangan baru.
     * @param {object} invitationData - Data lengkap dari form.
     */
    createInvitation: async (invitationData) => {
        const response = await api.post('/invitations/create.php', invitationData);
        return response.data;
    },

    /**
     * Memperbarui undangan yang sudah ada.
     * @param {object} invitationData - Data lengkap dari form, termasuk ID.
     */
    updateInvitation: async (invitationData) => {
        const response = await api.put('/invitations/update.php', invitationData);
        return response.data;
    },

    /**
     * Menghapus undangan berdasarkan ID.
     * @param {number} id - ID undangan yang akan dihapus.
     */
    deleteInvitation: async (id) => {
        // API delete Anda menggunakan metode POST, jadi kita kirim ID di body
        const response = await api.post('/invitations/delete.php', { id: id });
        return response.data;
    },

    /**
     * Mengunggah file (foto, musik).
     * @param {FormData} formData - Data file yang akan diunggah.
     */
    uploadFile: async (formData) => {
        const response = await api.post('/invitations/upload.php', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

export default invitationService;
