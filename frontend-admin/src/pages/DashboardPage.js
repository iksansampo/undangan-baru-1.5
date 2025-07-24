import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import invitationService from '../services/invitationService';
import InvitationForm from '../components/InvitationForm';
import GuestListModal from '../components/GuestListModal';
import RsvpModal from '../components/RsvpModal';

const DashboardPage = () => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [showForm, setShowForm] = useState(false);
    const [currentInvitationId, setCurrentInvitationId] = useState(null);

    const [showGuestModal, setShowGuestModal] = useState(false);
    const [showRsvpModal, setShowRsvpModal] = useState(false);
    const [selectedInvitation, setSelectedInvitation] = useState(null);

    // Fungsi ini sekarang sudah terbukti menerima data dengan benar
    const fetchInvitations = async () => {
        setLoading(true);
        try {
            const data = await invitationService.getAllInvitations();
            // **PERBAIKAN KUNCI**: Memastikan state diisi dengan benar
            setInvitations(data || []); // Selalu set sebagai array, bahkan jika data null
        } catch (error) {
            console.error("Gagal mengambil undangan:", error);
            // Kosongkan daftar jika terjadi error
            setInvitations([]); 
            if (error.response && error.response.status === 401) {
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []); // Hapus navigate dari dependency array agar tidak terpanggil berulang kali

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigate('/');
        } catch (error) {
            console.error("Logout gagal", error);
        }
    };
    
    const handleCreateNew = () => { setCurrentInvitationId(null); setShowForm(true); };
    const handleEdit = (id) => { setCurrentInvitationId(id); setShowForm(true); };
    const handleDelete = async (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus undangan ini?')) {
            try {
                await invitationService.deleteInvitation(id);
                fetchInvitations();
            } catch (error) { console.error("Gagal menghapus undangan", error); }
        }
    };
    
    const handleFormSubmit = () => { setShowForm(false); setCurrentInvitationId(null); fetchInvitations(); };
    const handleCancelForm = () => { setShowForm(false); setCurrentInvitationId(null); };
    const openGuestModal = (invitation) => { setSelectedInvitation(invitation); setShowGuestModal(true); };
    const openRsvpModal = (invitation) => { setSelectedInvitation(invitation); setShowRsvpModal(true); };

    if (loading) return <div>Memuat data undangan...</div>;

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Dashboard Admin</h2>
                <button onClick={handleLogout} className="btn btn-danger">Logout</button>
            </div>

            {showForm ? (
                <InvitationForm invitationId={currentInvitationId} onFormSubmit={handleFormSubmit} onCancel={handleCancelForm} />
            ) : (
                <div>
                    <div className="card mb-4">
                        <div className="card-header">Manajemen Undangan</div>
                        <div className="card-body"><button onClick={handleCreateNew} className="btn btn-primary">+ Buat Undangan Baru</button></div>
                    </div>
                    <div className="card">
                        <div className="card-header">Daftar Undangan Tersimpan</div>
                        <div className="card-body">
                            <table className="table table-hover">
                                <thead>
                                    <tr><th>ID</th><th>Judul</th><th>Mempelai</th><th>Aksi</th></tr>
                                </thead>
                                <tbody>
                                    {/* **PERBAIKAN KUNCI**: Logika render yang lebih aman */}
                                    {invitations && invitations.length > 0 ? invitations.map(invitation => (
                                        <tr key={invitation.id}>
                                            <td>{invitation.id}</td>
                                            <td>{invitation.title}</td>
                                            <td>{`${invitation.bride_name || ''} & ${invitation.groom_name || ''}`}</td>
                                            <td>
                                                <button onClick={() => openGuestModal(invitation)} className="btn btn-info btn-sm me-1">Tamu</button>
                                                <button onClick={() => openRsvpModal(invitation)} className="btn btn-success btn-sm me-1">RSVP</button>
                                                <button onClick={() => handleEdit(invitation.id)} className="btn btn-warning btn-sm me-1">Edit</button>
                                                <button onClick={() => handleDelete(invitation.id)} className="btn btn-danger btn-sm">Hapus</button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" className="text-center">Belum ada undangan yang dibuat.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            {showGuestModal && <GuestListModal invitation={selectedInvitation} onClose={() => setShowGuestModal(false)} />}
            {showRsvpModal && <RsvpModal invitationId={selectedInvitation.id} onClose={() => setShowRsvpModal(false)} />}
        </div>
    );
};

export default DashboardPage;
