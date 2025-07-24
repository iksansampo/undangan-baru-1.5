import React, { useState, useEffect } from 'react';
import invitationService from '../services/invitationService';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// **KOMPONEN DIPERBAIKI (STRUKTUR FINAL)**
// Menerima semua props dari Draggable untuk penempatan yang benar
const FormSection = ({ 
    id, 
    title, 
    children, 
    innerRef, // ref untuk elemen yang bisa di-drag
    draggableProps, // props untuk elemen yang bisa di-drag
    dragHandleProps // props untuk pegangan (handle)
}) => (
    // ref dan draggableProps diterapkan pada elemen root (div.card)
    <div 
        className="card mb-4"
        ref={innerRef}
        {...draggableProps}
    >
        <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{title}</h5>
            {/* dragHandleProps diterapkan HANYA pada ikon pegangan */}
            <span 
                className="drag-handle" 
                style={{ 
                    cursor: 'grab', 
                    padding: '8px',
                    // **PERBAIKAN KUNCI**: Mencegah seleksi teks pada ikon saat di-drag
                    userSelect: 'none' 
                }}
                {...dragHandleProps}
            >
                ☰
            </span>
        </div>
        <div className="card-body">
            {children}
        </div>
    </div>
);


const InvitationForm = ({ invitationId, onFormSubmit, onCancel }) => {
    // State awal untuk data form
    const initialFormData = {
        title: '',
        theme: 'classic_elegant',
        bride_groom_data: {
            bride_name: '', bride_father: '', bride_mother: '', bride_photo: '',
            groom_name: '', groom_father: '', groom_mother: '', groom_photo: ''
        },
        events_data: [{ event_name: '', event_date: '', start_time: '', end_time: '', location: '', gmaps_link: '' }],
        galleries_data: [],
        stories_data: [{ year: '', story: '' }],
        gift_data: [{ bank_name: '', account_number: '', account_name: '' }],
        cover_image: '',
        music: ''
    };

    const [formData, setFormData] = useState(initialFormData);
    
    // State untuk urutan section layout
    const defaultSections = [
        { id: 'mempelai', title: 'Data Mempelai' },
        { id: 'acara', title: 'Data Acara' },
        { id: 'gallery', title: 'Galeri' },
        { id: 'cerita', title: 'Cerita Cinta' },
        { id: 'amplop', title: 'Amplop Digital' },
    ];
    const [sections, setSections] = useState(defaultSections);

    useEffect(() => {
        if (invitationId) {
            const fetchInvitation = async () => {
                try {
                    const data = await invitationService.getInvitationById(invitationId);
                    setFormData({
                        title: data.title || '',
                        theme: data.theme || 'classic_elegant',
                        bride_groom_data: data.bride_groom_data || initialFormData.bride_groom_data,
                        events_data: data.events_data?.length ? data.events_data : initialFormData.events_data,
                        galleries_data: data.galleries_data || initialFormData.galleries_data,
                        stories_data: data.stories_data?.length ? data.stories_data : initialFormData.stories_data,
                        gift_data: data.gift_data?.length ? data.gift_data : initialFormData.gift_data,
                        cover_image: data.cover_image || '',
                        music: data.music || ''
                    });

                    if (data.layout_order) {
                        const orderedIds = data.layout_order.split(',');
                        const orderedSections = orderedIds.map(id => defaultSections.find(s => s.id === id)).filter(Boolean);
                        const missingSections = defaultSections.filter(s => !orderedIds.includes(s.id));
                        setSections([...orderedSections, ...missingSections]);
                    }

                } catch (error) {
                    console.error("Failed to fetch invitation", error);
                    alert("Gagal memuat data undangan.");
                }
            };
            fetchInvitation();
        } else {
            setFormData(initialFormData);
            setSections(defaultSections);
        }
    }, [invitationId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNestedChange = (section, name, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: { ...prev[section], [name]: value }
        }));
    };

    const handleArrayChange = (section, index, name, value) => {
        const newArray = [...formData[section]];
        newArray[index] = { ...newArray[index], [name]: value };
        setFormData(prev => ({ ...prev, [section]: newArray }));
    };

    const addArrayItem = (section, item) => {
        setFormData(prev => ({
            ...prev,
            [section]: [...prev[section], item]
        }));
    };

    const removeArrayItem = (section, index) => {
        const newArray = [...formData[section]];
        newArray.splice(index, 1);
        setFormData(prev => ({ ...prev, [section]: newArray }));
    };
    
    const handleFileUpload = async (e, field, nestedField = null) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const response = await invitationService.uploadFile(uploadData);
            const filePath = response.filePath;

            if (nestedField) {
                 handleNestedChange(nestedField, field, filePath);
            } else if (field === 'galleries_data') {
                addArrayItem('galleries_data', { photo_url: filePath, is_video: file.type.startsWith('video/') });
            }
            else {
                setFormData(prev => ({ ...prev, [field]: filePath }));
            }
        } catch (error) {
            console.error('File upload failed', error);
            alert('Gagal mengunggah file.');
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        const userId = 1; 
        
        const layout_order = sections.map(s => s.id);

        const payload = { ...formData, user_id: userId, layout_order };

        try {
            if (invitationId) {
                await invitationService.updateInvitation({ ...payload, id: invitationId });
                alert('Undangan berhasil diperbarui!');
            } else {
                await invitationService.createInvitation(payload);
                alert('Undangan berhasil dibuat!');
            }
            onFormSubmit();
        } catch (error) {
            console.error('Failed to save invitation', error);
            alert('Gagal menyimpan undangan.');
        }
    };

    const onDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination) return;

        const items = Array.from(sections);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);

        setSections(items);
    };

    const renderSectionContent = (sectionId) => {
        switch (sectionId) {
            case 'mempelai':
                return (
                    <div className="row">
                        <div className="col-md-6">
                            <h6>Mempelai Wanita</h6>
                            <input type="text" className="form-control mb-2" placeholder="Nama Mempelai Wanita" value={formData.bride_groom_data.bride_name} onChange={(e) => handleNestedChange('bride_groom_data', 'bride_name', e.target.value)} />
                            <input type="text" className="form-control mb-2" placeholder="Nama Ayah Mempelai Wanita" value={formData.bride_groom_data.bride_father} onChange={(e) => handleNestedChange('bride_groom_data', 'bride_father', e.target.value)} />
                            <input type="text" className="form-control mb-2" placeholder="Nama Ibu Mempelai Wanita" value={formData.bride_groom_data.bride_mother} onChange={(e) => handleNestedChange('bride_groom_data', 'bride_mother', e.target.value)} />
                            <label>Foto Mempelai Wanita</label>
                            <input type="file" className="form-control mb-3" onChange={(e) => handleFileUpload(e, 'bride_photo', 'bride_groom_data')} />
                            {formData.bride_groom_data.bride_photo && <img src={`http://localhost/undangan_digital_platform/backend/uploads/${formData.bride_groom_data.bride_photo}`} alt="Bride" width="100" className="mb-2" />}
                        </div>
                        <div className="col-md-6">
                            <h6>Mempelai Pria</h6>
                            <input type="text" className="form-control mb-2" placeholder="Nama Mempelai Pria" value={formData.bride_groom_data.groom_name} onChange={(e) => handleNestedChange('bride_groom_data', 'groom_name', e.target.value)} />
                            <input type="text" className="form-control mb-2" placeholder="Nama Ayah Mempelai Pria" value={formData.bride_groom_data.groom_father} onChange={(e) => handleNestedChange('bride_groom_data', 'groom_father', e.target.value)} />
                            <input type="text" className="form-control mb-2" placeholder="Nama Ibu Mempelai Pria" value={formData.bride_groom_data.groom_mother} onChange={(e) => handleNestedChange('bride_groom_data', 'groom_mother', e.target.value)} />
                            <label>Foto Mempelai Pria</label>
                            <input type="file" className="form-control mb-3" onChange={(e) => handleFileUpload(e, 'groom_photo', 'bride_groom_data')} />
                            {formData.bride_groom_data.groom_photo && <img src={`http://localhost/undangan_digital_platform/backend/uploads/${formData.bride_groom_data.groom_photo}`} alt="Groom" width="100" className="mb-2" />}
                        </div>
                    </div>
                );
            case 'acara':
                return (
                    <>
                        {formData.events_data.map((event, index) => (
                            <div key={index} className="mb-3 border p-3">
                                <input type="text" className="form-control mb-2" placeholder="Nama Acara (cth: Akad Nikah)" value={event.event_name} onChange={(e) => handleArrayChange('events_data', index, 'event_name', e.target.value)} />
                                <input type="date" className="form-control mb-2" value={event.event_date} onChange={(e) => handleArrayChange('events_data', index, 'event_date', e.target.value)} />
                                <input type="time" className="form-control mb-2" placeholder="Waktu Mulai" value={event.start_time} onChange={(e) => handleArrayChange('events_data', index, 'start_time', e.target.value)} />
                                <input type="time" className="form-control mb-2" placeholder="Waktu Selesai" value={event.end_time} onChange={(e) => handleArrayChange('events_data', index, 'end_time', e.target.value)} />
                                <input type="text" className="form-control mb-2" placeholder="Lokasi" value={event.location} onChange={(e) => handleArrayChange('events_data', index, 'location', e.target.value)} />
                                <input type="text" className="form-control mb-2" placeholder="Link Google Maps" value={event.gmaps_link} onChange={(e) => handleArrayChange('events_data', index, 'gmaps_link', e.target.value)} />
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeArrayItem('events_data', index)}>Hapus Acara</button>
                            </div>
                        ))}
                        <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('events_data', { event_name: '', event_date: '', start_time: '', end_time: '', location: '', gmaps_link: '' })}>+ Tambah Acara</button>
                    </>
                );
            case 'gallery':
                return (
                    <>
                        <label>Upload Foto/Video</label>
                        <input type="file" className="form-control mb-3" onChange={(e) => handleFileUpload(e, 'galleries_data')} multiple />
                        <div className="d-flex flex-wrap">
                            {formData.galleries_data.map((item, index) => (
                                <div key={index} className="m-2">
                                    {item.is_video ?
                                        <video src={`http://localhost/undangan_digital_platform/backend/uploads/${item.photo_url}`} width="100" controls /> :
                                        <img src={`http://localhost/undangan_digital_platform/backend/uploads/${item.photo_url}`} alt={`Gallery ${index}`} width="100" />
                                    }
                                    <button type="button" className="btn btn-danger btn-sm d-block" onClick={() => removeArrayItem('galleries_data', index)}>Hapus</button>
                                </div>
                            ))}
                        </div>
                    </>
                );
            case 'cerita':
                return (
                    <>
                        {formData.stories_data.map((story, index) => (
                            <div key={index} className="mb-3 border p-3">
                                <input type="text" className="form-control mb-2" placeholder="Tahun/Judul Cerita" value={story.year} onChange={(e) => handleArrayChange('stories_data', index, 'year', e.target.value)} />
                                <textarea className="form-control mb-2" placeholder="Isi Cerita" value={story.story} onChange={(e) => handleArrayChange('stories_data', index, 'story', e.target.value)}></textarea>
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeArrayItem('stories_data', index)}>Hapus Cerita</button>
                            </div>
                        ))}
                        <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('stories_data', { year: '', story: '' })}>+ Tambah Cerita</button>
                    </>
                );
            case 'amplop':
                return (
                    <>
                        {formData.gift_data.map((gift, index) => (
                            <div key={index} className="mb-3 border p-3">
                                <input type="text" className="form-control mb-2" placeholder="Nama Bank" value={gift.bank_name} onChange={(e) => handleArrayChange('gift_data', index, 'bank_name', e.target.value)} />
                                <input type="text" className="form-control mb-2" placeholder="Nomor Rekening" value={gift.account_number} onChange={(e) => handleArrayChange('gift_data', index, 'account_number', e.target.value)} />
                                <input type="text" className="form-control mb-2" placeholder="Atas Nama" value={gift.account_name} onChange={(e) => handleArrayChange('gift_data', index, 'account_name', e.target.value)} />
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeArrayItem('gift_data', index)}>Hapus Amplop</button>
                            </div>
                        ))}
                        <button type="button" className="btn btn-secondary" onClick={() => addArrayItem('gift_data', { bank_name: '', account_number: '', account_name: '' })}>+ Tambah Amplop</button>
                    </>
                );
            default:
                return null;
        }
    };


    return (
        <form onSubmit={handleSubmit}>
            <div className="card mb-4">
                <div className="card-header">
                    <h5>Pengaturan Umum</h5>
                </div>
                <div className="card-body">
                    <label>Judul Undangan</label>
                    <input type="text" name="title" className="form-control mb-2" placeholder="Contoh: The Wedding of John & Jane" value={formData.title} onChange={handleInputChange} />
                    
                    <label>Tema</label>
                    <select name="theme" className="form-control mb-2" value={formData.theme} onChange={handleInputChange}>
                        <option value="classic_elegant">Classic Elegant</option>
                    </select>

                    <label>Foto Cover</label>
                    <input type="file" className="form-control mb-2" onChange={(e) => handleFileUpload(e, 'cover_image')} />
                    {formData.cover_image && <img src={`http://localhost/undangan_digital_platform/backend/uploads/${formData.cover_image}`} alt="Cover" width="150" />}

                    <label>Musik Latar</label>
                    <input type="file" className="form-control mb-2" accept="audio/*" onChange={(e) => handleFileUpload(e, 'music')} />
                    {formData.music && <audio src={`http://localhost/undangan_digital_platform/backend/uploads/${formData.music}`} controls className="w-100" />}
                </div>
            </div>

            <h4 className="my-4">Atur Tata Letak Undangan (Geser untuk Mengubah Urutan)</h4>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="sections">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                            {sections.map((section, index) => (
                                <Draggable key={section.id} draggableId={section.id} index={index}>
                                    {(providedDraggable) => (
                                        <FormSection 
                                            id={section.id} 
                                            title={section.title}
                                            innerRef={providedDraggable.innerRef}
                                            draggableProps={providedDraggable.draggableProps}
                                            dragHandleProps={providedDraggable.dragHandleProps}
                                        >
                                            {renderSectionContent(section.id)}
                                        </FormSection>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <div className="mt-4">
                <button type="submit" className="btn btn-primary me-2">Simpan Undangan</button>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Batal</button>
            </div>
        </form>
    );
};

export default InvitationForm;
