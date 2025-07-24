import React, { useState, useEffect } from 'react';
import api from '../api';

const RsvpModal = ({ invitationId, onClose }) => {
    const [rsvps, setRsvps] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchRsvps = async () => {
        setLoading(true);
        try {
            // Memanggil API yang sudah kita perbaiki
            const response = await api.get(`/rsvp/read.php?invitation_id=${invitationId}`);
            setRsvps(response.data.data || []);
        } catch (error) {
            console.error("Gagal mengambil daftar RSVP:", error);
            alert('Gagal mengambil data RSVP. Cek konsol untuk detail.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (invitationId) {
            fetchRsvps();
        }
    }, [invitationId]);

    const handleExport = async (format) => {
        try {
            const response = await api.get(`/rsvp/export.php?invitation_id=${invitationId}&format=${format}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `rsvp_data_${invitationId}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Gagal mengekspor data:", error);
            alert('Gagal mengekspor data.');
        }
    };

    const summary = {
        hadir: rsvps.filter(r => r.attendance === 'Hadir').length,
        tidakHadir: rsvps.filter(r => r.attendance === 'Tidak Hadir').length,
    };

    return (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, overflowY: 'auto' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Daftar RSVP</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <strong>Hadir:</strong> {summary.hadir} | <strong>Tidak Hadir:</strong> {summary.tidakHadir} | <strong>Total:</strong> {rsvps.length}
                            </div>
                            <div>
                                <button onClick={() => handleExport('csv')} className="btn btn-success btn-sm me-2">Ekspor .csv</button>
                                <button onClick={() => handleExport('txt')} className="btn btn-secondary btn-sm">Ekspor .txt</button>
                            </div>
                        </div>
                        {loading ? <p>Memuat...</p> : (
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Nama</th>
                                        <th>Kehadiran</th>
                                        <th>Pesan</th>
                                        <th>Waktu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rsvps.length > 0 ? rsvps.map(rsvp => (
                                        <tr key={rsvp.id}>
                                            <td>{rsvp.guest_name}</td>
                                            <td>{rsvp.attendance}</td>
                                            <td>{rsvp.message}</td>
                                            <td>{new Date(rsvp.created_at).toLocaleString('id-ID')}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" className="text-center">Belum ada data RSVP.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RsvpModal;
