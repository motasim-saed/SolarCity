// Initialize Appwrite Client using config from config.js
const { Client, Databases, Storage, ID, Account } = Appwrite;

const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
    .setProject(APPWRITE_CONFIG.PROJECT_ID);

const databases = new Databases(client);
const storage = new Storage(client);
const account = new Account(client);

// DOM Elements - Products
const addItemForm = document.getElementById('addItemForm');
const mainMediaInput = document.getElementById('mainMedia');
const mainMediaPreview = document.getElementById('mainMediaPreview');
const additionalMediaInput = document.getElementById('additionalMedia');
const additionalMediaPreview = document.getElementById('additionalMediaPreview');
const submitBtn = document.getElementById('submitBtn');
const submitText = submitBtn.querySelector('span');
const submitIcon = submitBtn.querySelector('i');
const itemsTableBody = document.getElementById('itemsTableBody');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// DOM Elements - Slides
const addSlideForm = document.getElementById('addSlideForm');
const slideMediaInput = document.getElementById('slideMedia');
const slideMediaPreview = document.getElementById('slideMediaPreview');
const slideSubmitBtn = document.getElementById('slideSubmitBtn');
const slidesTableBody = document.getElementById('slidesTableBody');
const cancelSlideEditBtn = document.getElementById('cancelSlideEditBtn');

// New DOM Elements for Media Managers
const productMediaManager = document.getElementById('productMediaManager');
const productMediaGrid = document.getElementById('productMediaGrid');
const slideMediaManager = document.getElementById('slideMediaManager');
const slideMediaGrid = document.getElementById('slideMediaGrid');

// Lightbox Elements
const mediaLightbox = document.getElementById('mediaLightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxVideo = document.getElementById('lightboxVideo');

// Editing State
let editingId = null;
let existingMedia = [];
let slideEditingId = null;
let existingSlideMedia = [];

// Tab Switcher
window.switchTab = function(tabName) {
    const productsTab = document.getElementById('productsTabContent');
    const slidesTab = document.getElementById('slidesTabContent');
    const productsBtn = document.getElementById('tabProductsBtn');
    const slidesBtn = document.getElementById('tabSlidesBtn');
    
    if (tabName === 'products') {
        productsTab.style.display = 'block';
        slidesTab.style.display = 'none';
        productsBtn.classList.add('active');
        slidesBtn.classList.remove('active');
    } else {
        productsTab.style.display = 'none';
        slidesTab.style.display = 'block';
        productsBtn.classList.remove('active');
        slidesBtn.classList.add('active');
        fetchSlides(); // Fetch slides when tab is opened
    }
};

// --- LIGHTBOX GALLERY VIEW ---
window.openLightbox = function(mediaUrl) {
    if (!mediaUrl) return;
    const isVideo = mediaUrl.includes('type=video');
    
    if (isVideo) {
        lightboxVideo.src = mediaUrl;
        lightboxVideo.style.display = 'block';
        lightboxImg.style.display = 'none';
        lightboxVideo.play().catch(() => {});
    } else {
        lightboxImg.src = mediaUrl;
        lightboxImg.style.display = 'block';
        lightboxVideo.style.display = 'none';
        lightboxVideo.pause();
    }
    mediaLightbox.classList.add('active');
};

window.closeLightbox = function() {
    mediaLightbox.classList.remove('active');
    lightboxVideo.pause();
    lightboxVideo.src = '';
    lightboxImg.src = '';
};

// Render Existing Media for Product Editing
function renderProductMediaManager() {
    productMediaGrid.innerHTML = '';
    
    if (existingMedia.length === 0) {
        productMediaManager.style.display = 'none';
        return;
    }
    
    productMediaManager.style.display = 'block';
    
    existingMedia.forEach((mediaUrl, index) => {
        const isVideo = mediaUrl.includes('type=video');
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-manager-item';
        
        // Image or video preview tag
        let previewHtml = '';
        if (isVideo) {
            previewHtml = `
                <video src="${mediaUrl}"></video>
                <div class="media-type-icon"><i class="fa-solid fa-play"></i></div>
            `;
        } else {
            previewHtml = `<img src="${mediaUrl}" alt="Media ${index + 1}">`;
        }
        
        // Badge for Main vs Additional
        const isMain = index === 0;
        const badgeText = isMain ? 'رئيسي' : 'إضافي';
        const badgeClass = isMain ? 'media-manager-item-badge main-badge' : 'media-manager-item-badge';
        
        mediaItem.innerHTML = `
            ${previewHtml}
            <div class="${badgeClass}">${badgeText}</div>
            <button type="button" class="media-manager-item-delete" onclick="deleteExistingProductMedia(${index}); event.stopPropagation();">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <div class="media-manager-item-overlay">
                <i class="fa-solid fa-magnifying-glass-plus"></i>
            </div>
        `;
        
        mediaItem.onclick = () => openLightbox(mediaUrl);
        productMediaGrid.appendChild(mediaItem);
    });
}

// Delete media from existing product list
window.deleteExistingProductMedia = function(index) {
    if (confirm('هل أنت متأكد من حذف هذا الوسيط من المنتج؟')) {
        existingMedia.splice(index, 1);
        renderProductMediaManager();
    }
};

// Render Existing Media for Slide Editing
function renderSlideMediaManager() {
    slideMediaGrid.innerHTML = '';
    
    if (existingSlideMedia.length === 0 || !existingSlideMedia[0]) {
        slideMediaManager.style.display = 'none';
        return;
    }
    
    slideMediaManager.style.display = 'block';
    const mediaUrl = existingSlideMedia[0];
    const isVideo = mediaUrl.includes('type=video');
    const mediaItem = document.createElement('div');
    mediaItem.className = 'media-manager-item';
    
    let previewHtml = '';
    if (isVideo) {
        previewHtml = `
            <video src="${mediaUrl}"></video>
            <div class="media-type-icon"><i class="fa-solid fa-play"></i></div>
        `;
    } else {
        previewHtml = `<img src="${mediaUrl}" alt="Slide Banner">`;
    }
    
    mediaItem.innerHTML = `
        ${previewHtml}
        <div class="media-manager-item-badge main-badge">بانر</div>
        <button type="button" class="media-manager-item-delete" onclick="deleteExistingSlideMedia(); event.stopPropagation();">
            <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="media-manager-item-overlay">
            <i class="fa-solid fa-magnifying-glass-plus"></i>
        </div>
    `;
    
    mediaItem.onclick = () => openLightbox(mediaUrl);
    slideMediaGrid.appendChild(mediaItem);
}

// Delete media from existing slide banner
window.deleteExistingSlideMedia = function() {
    if (confirm('هل أنت متأكد من حذف هذا الوسيط من البانر؟')) {
        existingSlideMedia = [];
        renderSlideMediaManager();
        slideMediaInput.required = true; // Slide must have at least one media
    }
};


// Image/Video Preview handler for Main Media
mainMediaInput.addEventListener('change', function() {
    mainMediaPreview.innerHTML = '';
    if (this.files && this.files[0]) {
        const file = this.files[0];
        const badge = createMediaBadge(file);
        mainMediaPreview.appendChild(badge);
    }
});

// Image Preview handler for Additional Media
additionalMediaInput.addEventListener('change', function() {
    additionalMediaPreview.innerHTML = '';
    if (this.files) {
        Array.from(this.files).forEach(file => {
            const badge = createMediaBadge(file);
            additionalMediaPreview.appendChild(badge);
        });
    }
});

// Preview handler for Slide Media
slideMediaInput.addEventListener('change', function() {
    slideMediaPreview.innerHTML = '';
    if (this.files && this.files[0]) {
        const file = this.files[0];
        const badge = createMediaBadge(file);
        slideMediaPreview.appendChild(badge);
    }
});

// Helper to create visual media badge
function createMediaBadge(file) {
    const badge = document.createElement('div');
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.style.gap = '8px';
    badge.style.background = 'rgba(255, 255, 255, 0.05)';
    badge.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    badge.style.padding = '8px 12px';
    badge.style.borderRadius = '8px';
    badge.style.margin = '5px';
    badge.style.color = '#fff';
    badge.style.fontSize = '0.9rem';
    
    const isVideo = file.type.startsWith('video/');
    const iconClass = isVideo ? 'fa-solid fa-video' : 'fa-solid fa-image';
    const typeText = isVideo ? 'فيديو' : 'صورة';
    const typeColor = isVideo ? '#3a86ff' : '#fca311';

    badge.innerHTML = `
        <i class="${iconClass}" style="color: ${typeColor}"></i>
        <span>${file.name} (${typeText})</span>
    `;
    return badge;
}

// Helper function to compress images to WebP
function compressImageToWebP(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 1200;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        const newName = file.name.substring(0, file.name.lastIndexOf('.')) + '.webp';
                        const compressedFile = new File([blob], newName, {
                            type: 'image/webp',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    } else {
                        resolve(file);
                    }
                }, 'image/webp', 0.8);
            };
            img.onerror = () => resolve(file);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}

// Upload files to Appwrite Storage and append type metadata
async function uploadFiles(files) {
    const fileIds = [];
    for (let i = 0; i < files.length; i++) {
        try {
            let fileToUpload = files[i];
            const isVideo = fileToUpload.type.startsWith('video/');
            
            if (fileToUpload.type.startsWith('image/')) {
                try {
                    fileToUpload = await compressImageToWebP(fileToUpload);
                    console.log(`Compressed: ${files[i].name} (${(files[i].size / 1024).toFixed(1)} KB) -> ${fileToUpload.name} (${(fileToUpload.size / 1024).toFixed(1)} KB)`);
                } catch (err) {
                    console.error('Image compression failed, using original file:', err);
                }
            }

            const response = await storage.createFile(
                APPWRITE_CONFIG.BUCKET_ID,
                ID.unique(),
                fileToUpload
            );
            
            const fileUrl = client.config.endpoint + 
                '/storage/buckets/' + APPWRITE_CONFIG.BUCKET_ID + 
                '/files/' + response.$id + 
                '/view?project=' + APPWRITE_CONFIG.PROJECT_ID + 
                (isVideo ? '&type=video' : '&type=image');
                
            fileIds.push(fileUrl);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('حدث خطأ أثناء رفع الملفات.');
            throw error;
        }
    }
    return fileIds;
}

// Add/Update Product in Database
addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    submitText.innerText = editingId ? 'جاري التحديث...' : 'جاري الإضافة...';
    submitIcon.style.display = 'inline-block';
    submitBtn.disabled = true;

    try {
        const name = document.getElementById('name').value;
        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;
        const newPrice = parseFloat(document.getElementById('newPrice').value);
        const oldPrice = document.getElementById('oldPrice').value ? parseFloat(document.getElementById('oldPrice').value) : null;
        const description = document.getElementById('description').value;

        let mediaUrls = [];

        if (editingId) {
            let mainUrl = null;
            if (mainMediaInput.files.length > 0) {
                const mainUrls = await uploadFiles([mainMediaInput.files[0]]);
                mainUrl = mainUrls[0];
            } else {
                mainUrl = existingMedia[0] || null;
            }

            let addUrls = [];
            if (additionalMediaInput.files.length > 0) {
                addUrls = await uploadFiles(Array.from(additionalMediaInput.files));
            }

            let keptAdditional = [];
            if (mainMediaInput.files.length > 0) {
                keptAdditional = existingMedia;
            } else {
                keptAdditional = existingMedia.slice(1);
            }

            mediaUrls = [];
            if (mainUrl) mediaUrls.push(mainUrl);
            mediaUrls = mediaUrls.concat(keptAdditional).concat(addUrls);

            if (mediaUrls.length === 0) {
                alert('يجب أن يحتوي المنتج على وسيط رئيسي واحد على الأقل.');
                submitText.innerText = 'تحديث العنصر';
                submitIcon.style.display = 'none';
                submitBtn.disabled = false;
                return;
            }
        } else {
            if (mainMediaInput.files.length === 0) {
                alert('الرجاء اختيار الوسائط الرئيسية (صورة أو فيديو)');
                return;
            }

            const mainUrls = await uploadFiles([mainMediaInput.files[0]]);
            
            let addUrls = [];
            if (additionalMediaInput.files.length > 0) {
                addUrls = await uploadFiles(Array.from(additionalMediaInput.files));
            }

            mediaUrls = [mainUrls[0], ...addUrls];
        }

        const documentData = {
            name: name,
            type: type,
            category: category,
            newPrice: newPrice,
            oldPrice: oldPrice,
            description: description,
            media: mediaUrls
        };

        if (editingId) {
            await databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_ID,
                editingId,
                documentData
            );
            alert('تمت تحديث البيانات بنجاح!');
            cancelEdit();
        } else {
            await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_ID,
                ID.unique(),
                documentData
            );
            alert('تمت الإضافة بنجاح!');
            addItemForm.reset();
            clearPreviews();
        }
        
        fetchItems();

    } catch (error) {
        console.error('Error saving document:', error);
        alert('حدث خطأ أثناء حفظ البيانات: ' + error.message);
    } finally {
        submitText.innerText = editingId ? 'تحديث العنصر' : 'إضافة للقاعدة';
        submitIcon.style.display = 'none';
        submitBtn.disabled = false;
    }
});

// Clear preview containers
function clearPreviews() {
    mainMediaPreview.innerHTML = '';
    additionalMediaPreview.innerHTML = '';
}

// Cancel Editing Flow
function cancelEdit() {
    editingId = null;
    existingMedia = [];
    addItemForm.reset();
    clearPreviews();
    productMediaManager.style.display = 'none';
    
    mainMediaInput.required = true;
    submitText.innerText = 'إضافة للقاعدة';
    cancelEditBtn.style.display = 'none';
}

cancelEditBtn.addEventListener('click', cancelEdit);

// Fetch and display products
async function fetchItems() {
    try {
        const response = await databases.listDocuments(
            APPWRITE_CONFIG.DATABASE_ID,
            APPWRITE_CONFIG.COLLECTION_ID
        );

        itemsTableBody.innerHTML = '';
        window.adminItems = response.documents;

        if (response.documents.length === 0) {
            itemsTableBody.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد بيانات حالياً.</td></tr>';
            return;
        }

        response.documents.forEach(doc => {
            const tr = document.createElement('tr');
            const imgSrc = doc.media && doc.media.length > 0 ? doc.media[0] : 'https://via.placeholder.com/50';
            const isVideo = imgSrc.includes('type=video');
            
            const mediaCellContent = isVideo 
                ? `<div class="item-img" style="display:inline-flex;align-items:center;justify-content:center;background:#14213d;color:#3a86ff;border-radius:8px;width:50px;height:50px;border:1px solid rgba(255,255,255,0.1);"><i class="fa-solid fa-video"></i></div>`
                : `<img src="${imgSrc}" class="item-img" alt="صورة المنتج" style="width:50px;height:50px;object-fit:cover;border-radius:8px;">`;

            tr.innerHTML = `
                <td class="col-media">${mediaCellContent}</td>
                <td class="col-name" data-label="الاسم">${doc.name}</td>
                <td class="col-category" data-label="القسم">${doc.category}</td>
                <td class="col-price" data-label="السعر">${doc.newPrice} ريال</td>
                <td class="col-actions">
                    <button class="btn btn-warning" onclick="editItem('${doc.$id}')" style="background-color: #fca311; border-color: #fca311; color: #14213d; padding: 6px 12px; margin-left: 5px;">
                        <i class="fa-solid fa-pen-to-square"></i> تعديل
                    </button>
                    <button class="btn btn-danger" onclick="deleteItem('${doc.$id}')" style="padding: 6px 12px;">
                        <i class="fa-solid fa-trash"></i> حذف
                    </button>
                </td>
            `;
            itemsTableBody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error fetching documents:', error);
        itemsTableBody.innerHTML = '<tr><td colspan="5" class="text-center">يرجى التأكد من إعدادات Appwrite (Project ID, Database ID, إلخ).</td></tr>';
    }
}

// Edit item functionality
window.editItem = function(documentId) {
    const doc = window.adminItems.find(item => item.$id === documentId);
    if (!doc) return;

    editingId = documentId;
    existingMedia = doc.media ? [...doc.media] : []; // clone array

    document.getElementById('name').value = doc.name;
    document.getElementById('type').value = doc.type || '';
    document.getElementById('category').value = doc.category || '';
    document.getElementById('newPrice').value = doc.newPrice || '';
    document.getElementById('oldPrice').value = doc.oldPrice || '';
    document.getElementById('description').value = doc.description || '';

    mainMediaInput.required = false;
    clearPreviews();
    
    // Render the gorgeous Product Media Manager
    renderProductMediaManager();

    submitText.innerText = 'تحديث العنصر';
    cancelEditBtn.style.display = 'inline-block';
    
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Delete item
window.deleteItem = async function(documentId) {
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
        try {
            await databases.deleteDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_ID,
                documentId
            );
            alert('تم الحذف بنجاح');
            fetchItems();
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('حدث خطأ أثناء الحذف.');
        }
    }
}

// --- SLIDER BANNER OPERATIONS ---

// Add/Update Slide form handler
addSlideForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const slideText = slideSubmitBtn.querySelector('span');
    
    slideText.innerText = slideEditingId ? 'جاري التحديث...' : 'جاري الحفظ...';
    slideSubmitBtn.disabled = true;

    try {
        const title = document.getElementById('slideTitle').value;
        const category = document.getElementById('slideCategory').value;
        const description = document.getElementById('slideDesc').value;

        let mediaUrl = '';

        if (slideEditingId) {
            if (slideMediaInput.files.length > 0) {
                const uploadedUrls = await uploadFiles([slideMediaInput.files[0]]);
                mediaUrl = uploadedUrls[0];
            } else {
                mediaUrl = existingSlideMedia[0] || '';
            }
        } else {
            if (slideMediaInput.files.length === 0) {
                alert('الرجاء اختيار صورة أو فيديو للبانر الإعلاني');
                return;
            }
            const uploadedUrls = await uploadFiles([slideMediaInput.files[0]]);
            mediaUrl = uploadedUrls[0];
        }

        if (!mediaUrl) {
            alert('الرجاء رفع وسيط للبانر الإعلاني');
            return;
        }

        const slideData = {
            title: title,
            category: category,
            description: description,
            media: mediaUrl
        };

        if (slideEditingId) {
            await databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.SLIDER_COLLECTION_ID,
                slideEditingId,
                slideData
            );
            alert('تم تحديث البانر بنجاح!');
            cancelSlideEdit();
        } else {
            await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.SLIDER_COLLECTION_ID,
                ID.unique(),
                slideData
            );
            alert('تمت إضافة البانر بنجاح!');
            addSlideForm.reset();
            slideMediaPreview.innerHTML = '';
        }

        fetchSlides();

    } catch (error) {
        console.error('Error saving slide:', error);
        alert('حدث خطأ أثناء حفظ البانر: ' + error.message);
    } finally {
        slideText.innerText = slideEditingId ? 'تحديث البانر' : 'إضافة للبانر';
        slideSubmitBtn.disabled = false;
    }
});

// Fetch and display slides in admin dashboard
async function fetchSlides() {
    try {
        const response = await databases.listDocuments(
            APPWRITE_CONFIG.DATABASE_ID,
            APPWRITE_CONFIG.SLIDER_COLLECTION_ID
        );

        slidesTableBody.innerHTML = '';
        window.adminSlides = response.documents;

        if (response.documents.length === 0) {
            slidesTableBody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد بانرات إعلانية حالياً.</td></tr>';
            return;
        }

        response.documents.forEach(doc => {
            const tr = document.createElement('tr');
            let mediaUrl = 'https://via.placeholder.com/50';
            if (doc.media) {
                if (Array.isArray(doc.media)) {
                    if (doc.media.length > 0) {
                        mediaUrl = doc.media[0];
                    }
                } else if (typeof doc.media === 'string') {
                    mediaUrl = doc.media;
                }
            }
            const isVideo = typeof mediaUrl === 'string' && mediaUrl.includes('type=video');

            const mediaCellContent = isVideo 
                ? `<div class="item-img" style="display:inline-flex;align-items:center;justify-content:center;background:#14213d;color:#3a86ff;border-radius:8px;width:50px;height:50px;border:1px solid rgba(255,255,255,0.1);"><i class="fa-solid fa-video"></i></div>`
                : `<img src="${mediaUrl}" class="item-img" alt="البانر" style="width:50px;height:50px;object-fit:cover;border-radius:8px;">`;

            tr.innerHTML = `
                <td class="col-media">${mediaCellContent}</td>
                <td class="col-title" data-label="العنوان">${doc.title}</td>
                <td class="col-category" data-label="الارتباط بالتصنيف">${doc.category}</td>
                <td class="col-actions">
                    <button class="btn btn-warning" onclick="editSlide('${doc.$id}')" style="background-color: #fca311; border-color: #fca311; color: #14213d; padding: 6px 12px; margin-left: 5px;">
                        <i class="fa-solid fa-pen-to-square"></i> تعديل
                    </button>
                    <button class="btn btn-danger" onclick="deleteSlide('${doc.$id}')" style="padding: 6px 12px;">
                        <i class="fa-solid fa-trash"></i> حذف
                    </button>
                </td>
            `;
            slidesTableBody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error fetching slides:', error);
        slidesTableBody.innerHTML = '<tr><td colspan="4" class="text-center">يرجى التأكد من إعدادات Appwrite وكولكشن البانر الإعلاني.</td></tr>';
    }
}

// Edit Slide
window.editSlide = function(slideId) {
    const doc = window.adminSlides.find(slide => slide.$id === slideId);
    if (!doc) return;

    slideEditingId = slideId;
    
    let mediaUrl = '';
    if (doc.media) {
        if (Array.isArray(doc.media)) {
            if (doc.media.length > 0) {
                mediaUrl = doc.media[0];
            }
        } else if (typeof doc.media === 'string') {
            mediaUrl = doc.media;
        }
    }
    existingSlideMedia = mediaUrl ? [mediaUrl] : [];

    document.getElementById('slideTitle').value = doc.title;
    document.getElementById('slideCategory').value = doc.category || '';
    document.getElementById('slideDesc').value = doc.description || '';

    slideMediaInput.required = false;
    slideMediaPreview.innerHTML = '';
    
    // Render Slide Media Manager
    renderSlideMediaManager();

    slideSubmitBtn.querySelector('span').innerText = 'تحديث البانر';
    cancelSlideEditBtn.style.display = 'inline-block';

    document.querySelector('#slidesTabContent .form-section').scrollIntoView({ behavior: 'smooth' });
};

// Cancel Slide Edit
function cancelSlideEdit() {
    slideEditingId = null;
    existingSlideMedia = [];
    addSlideForm.reset();
    slideMediaPreview.innerHTML = '';
    slideMediaManager.style.display = 'none';
    
    slideMediaInput.required = true;
    slideSubmitBtn.querySelector('span').innerText = 'إضافة للبانر';
    cancelSlideEditBtn.style.display = 'none';
}

cancelSlideEditBtn.addEventListener('click', cancelSlideEdit);

// Delete slide
window.deleteSlide = async function(slideId) {
    if (confirm('هل أنت متأكد من حذف هذا البانر؟')) {
        try {
            await databases.deleteDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.SLIDER_COLLECTION_ID,
                slideId
            );
            alert('تم حذف البانر بنجاح');
            fetchSlides();
        } catch (error) {
            console.error('Error deleting slide:', error);
            alert('حدث خطأ أثناء حذف البانر.');
        }
    }
};

// Global admin logout
window.logoutAdmin = async function() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        try {
            await account.deleteSession('current');
            alert('تم تسجيل الخروج بنجاح.');
            checkAuth(); // Switch display states
        } catch (error) {
            console.error("Logout failed:", error);
            alert('حدث خطأ أثناء تسجيل الخروج. سيتم توجيهك إلى الصفحة الرئيسية.');
            window.location.href = 'index.html';
        }
    }
};

// Check authentication status
async function checkAuth() {
    try {
        const session = await account.get();
        console.log("Authenticated user session active:", session);
        
        // Hide login card wrapper, show admin dashboard panel
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('adminContainer').style.display = 'flex';
        
        // Fetch products only after validating authentication status
        fetchItems();
    } catch (error) {
        console.log("No active admin session:", error);
        
        // Show login card wrapper, hide admin dashboard panel
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('adminContainer').style.display = 'none';
    }
}

// Login Form submission handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const loginSubmitBtn = document.getElementById('loginSubmitBtn');
        const loginSpinner = loginSubmitBtn.querySelector('.login-spinner');
        const loginText = loginSubmitBtn.querySelector('span');
        const loginError = document.getElementById('loginError');
        const loginErrorText = loginError.querySelector('span');
        
        // Reset validation states
        loginError.style.display = 'none';
        loginErrorText.innerText = '';
        
        // Disable button & animate spinner
        loginSubmitBtn.disabled = true;
        loginSpinner.style.display = 'inline-block';
        loginText.innerText = 'جاري التحقق...';
        
        try {
            // Establish session using Email and Password
            await account.createEmailSession(email, password);
            console.log("Login session established successfully");
            
            loginForm.reset();
            
            // Re-verify authentication state to unlock layout
            await checkAuth();
            
        } catch (error) {
            console.error("Login verification failed:", error);
            loginError.style.display = 'flex';
            
            // Friendly Arabic explanations of Appwrite errors
            if (error.type === 'user_invalid_credentials' || error.code === 401) {
                loginErrorText.innerText = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
            } else if (error.type === 'user_blocked') {
                loginErrorText.innerText = 'هذا الحساب محظور حالياً من قبل الإدارة.';
            } else if (error.code === 0 || error.message.includes('Network')) {
                loginErrorText.innerText = 'فشل الاتصال بخادم Appwrite. يرجى التحقق من اتصالك بالإنترنت.';
            } else {
                loginErrorText.innerText = 'حدث خطأ: ' + error.message;
            }
        } finally {
            // Re-enable interactive submit button
            loginSubmitBtn.disabled = false;
            loginSpinner.style.display = 'none';
            loginText.innerText = 'تسجيل الدخول';
        }
    });
}

// Run auth check on initialization
checkAuth();

// Handle mobile hardware back button to redirect directly to the home screen (index.html)
window.history.pushState(null, "", window.location.href);
window.addEventListener('popstate', function (event) {
    window.location.href = 'index.html';
});
