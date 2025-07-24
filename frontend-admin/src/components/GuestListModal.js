import React, { useState, useEffect } from 'react';
import api from '../api';
import * as XLSX from 'xlsx';

const GuestListModal = ({ invitation, onClose }) => {
    const [guests, setGuests] = useState([]);
    const [guestName, setGuestName] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchGuests = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/guests/read.php?invitation_id=${invitation.id}`);
            setGuests(response.data.data || []);
        } catch (error) {
            console.error("Gagal mengambil daftar tamu:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (invitation.id) {
            fetchGuests();
        }
    }, [invitation.id]);

    const handleAddGuest = async (e) => {
        e.preventDefault();
        if (!guestName.trim()) return;
        try {
            await api.post('/guests/create.php', { invitation_id: invitation.id, guest_name: guestName });
            setGuestName('');
            fetchGuests(); // Refresh list
        } catch (error) {
            console.error("Gagal menambah tamu:", error);
            alert('Gagal menambah tamu.');
        }
    };

    const handleDeleteGuest = async (guestId) => {
        if (window.confirm('Yakin ingin menghapus tamu ini?')) {
            try {
                await api.post('/guests/delete.php', { id: guestId });
                fetchGuests(); // Refresh list
            } catch (error) {
                console.error("Gagal menghapus tamu:", error);
                alert('Gagal menghapus tamu.');
            }
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = event.target.result;
                let names = [];
                if (file.name.endsWith('.xlsx')) {
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    names = json.flat().filter(name => typeof name === 'string' && name.trim() !== '');
                } else {
                    names = data.split('\n').map(name => name.trim()).filter(Boolean);
                }
                
                if (window.confirm(`Anda akan mengimpor ${names.length} tamu. Lanjutkan?`)) {
                    for (const name of names) {
                        await api.post('/guests/create.php', { invitation_id: invitation.id, guest_name: name });
                    }
                    fetchGuests();
                    alert(`${names.length} tamu berhasil diimpor.`);
                }
            } catch (error) {
                console.error("Gagal mengimpor file:", error);
                alert('Gagal memproses file.');
            }
        };
        
        if (file.name.endsWith('.xlsx')) {
            reader.readAsBinaryString(file);
        } else {
            reader.readAsText(file);
        }
        e.target.value = null; // Reset input file
    };

    const handleCopyLink = (guest) => {
        // **PERBAIKAN KUNCI**: Menggunakan URL situs publik yang benar, bukan URL admin.
        const publicSiteBaseUrl = 'http://localhost/undangan_digital_platform/public-site';
        const link = `${publicSiteBaseUrl}/undangan.html?id=${invitation.id}&to=${encodeURIComponent(guest.guest_name)}`;
        
        navigator.clipboard.writeText(link).then(() => {
            alert(`Link untuk ${guest.guest_name} berhasil disalin!\n\n${link}`);
        }, (err) => {
            console.error('Gagal menyalin link: ', err);
            alert('Gagal menyalin link.');
        });
    };

    return (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, overflowY: 'auto' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Daftar Tamu untuk: {invitation.title}</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <h6>Tambah Tamu Manual</h6>
                                <form onSubmit={handleAddGuest} className="d-flex">
                                    <input type="text" className="form-control me-2" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Nama Tamu" />
                                    <button type="submit" className="btn btn-primary">Tambah</button>
                                </form>
                            </div>
                            <div className="col-md-6">
                                <h6>Impor dari File</h6>
                                <input type="file" className="form-control" onChange={handleFileUpload} accept=".csv, .txt, .xlsx" />
                                <small className="form-text text-muted">Impor daftar nama dari file .txt, .csv (satu nama per baris), atau .xlsx (satu kolom).</small>
                            </div>
                        </div>
                        <hr />
                        <h6>Daftar Tamu ({guests.length})</h6>
                        {loading ? <p>Memuat...</p> : (
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Nama Tamu</th>
                                        <th className="text-end">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {guests.map(guest => (
                                        <tr key={guest.id}>
                                            <td>{guest.guest_name}</td>
                                            <td className="text-end">
                                                <button onClick={() => handleCopyLink(guest)} className="btn btn-secondary btn-sm me-2">Salin Link</button>
                                                <button onClick={() => handleDeleteGuest(guest.id)} className="btn btn-danger btn-sm">Hapus</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuestListModal;
