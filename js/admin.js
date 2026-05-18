// Initialize Appwrite Client using config from config.js
const { Client, Databases, Storage, ID } = Appwrite;

const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
    .setProject(APPWRITE_CONFIG.PROJECT_ID);

const databases = new Databases(client);
const storage = new Storage(client);

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

// Editing State
let editingId = null;
let existingMedia = [];

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
            if (mainMediaInput.files.length > 0 || additionalMediaInput.files.length > 0) {
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
                } else {
                    addUrls = existingMedia.slice(1);
                }

                mediaUrls = [];
                if (mainUrl) mediaUrls.push(mainUrl);
                mediaUrls = mediaUrls.concat(addUrls);
            } else {
                mediaUrls = existingMedia;
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
                <td>${mediaCellContent}</td>
                <td>${doc.name}</td>
                <td>${doc.category}</td>
                <td>${doc.newPrice} ريال</td>
                <td>
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
    existingMedia = doc.media || [];

    document.getElementById('name').value = doc.name;
    document.getElementById('type').value = doc.type || '';
    document.getElementById('category').value = doc.category || '';
    document.getElementById('newPrice').value = doc.newPrice || '';
    document.getElementById('oldPrice').value = doc.oldPrice || '';
    document.getElementById('description').value = doc.description || '';

    mainMediaInput.required = false;
    clearPreviews();
    
    const infoBadge = document.createElement('div');
    infoBadge.style.color = '#fca311';
    infoBadge.style.fontSize = '0.9rem';
    infoBadge.style.marginTop = '5px';
    infoBadge.innerHTML = `<i class="fa-solid fa-circle-info"></i> تم حفظ الملفات السابقة. قم باختيار ملفات جديدة فقط إذا رغبت في استبدالها.`;
    mainMediaPreview.appendChild(infoBadge);

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

// Add Slide form handler
addSlideForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const slideText = slideSubmitBtn.querySelector('span');
    const slideIcon = slideSubmitBtn.querySelector('i');
    
    slideText.innerText = 'جاري الحفظ...';
    slideSubmitBtn.disabled = true;

    try {
        const title = document.getElementById('slideTitle').value;
        const category = document.getElementById('slideCategory').value;
        const description = document.getElementById('slideDesc').value;

        if (slideMediaInput.files.length === 0) {
            alert('الرجاء اختيار صورة أو فيديو للبانر الإعلاني');
            return;
        }

        // Upload banner media
        const uploadedUrls = await uploadFiles([slideMediaInput.files[0]]);

        const slideData = {
            title: title,
            category: category,
            description: description,
            media: uploadedUrls // Uniform layout
        };

        await databases.createDocument(
            APPWRITE_CONFIG.DATABASE_ID,
            APPWRITE_CONFIG.SLIDER_COLLECTION_ID,
            ID.unique(),
            slideData
        );

        alert('تمت إضافة البانر بنجاح!');
        addSlideForm.reset();
        slideMediaPreview.innerHTML = '';
        fetchSlides();

    } catch (error) {
        console.error('Error saving slide:', error);
        alert('حدث خطأ أثناء حفظ البانر: ' + error.message);
    } finally {
        slideText.innerText = 'إضافة للبانر';
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

        if (response.documents.length === 0) {
            slidesTableBody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد بانرات إعلانية حالياً.</td></tr>';
            return;
        }

        response.documents.forEach(doc => {
            const tr = document.createElement('tr');
            const mediaUrl = doc.media && doc.media.length > 0 ? doc.media[0] : 'https://via.placeholder.com/50';
            const isVideo = mediaUrl.includes('type=video');

            const mediaCellContent = isVideo 
                ? `<div class="item-img" style="display:inline-flex;align-items:center;justify-content:center;background:#14213d;color:#3a86ff;border-radius:8px;width:50px;height:50px;border:1px solid rgba(255,255,255,0.1);"><i class="fa-solid fa-video"></i></div>`
                : `<img src="${mediaUrl}" class="item-img" alt="البانر" style="width:50px;height:50px;object-fit:cover;border-radius:8px;">`;

            tr.innerHTML = `
                <td>${mediaCellContent}</td>
                <td>${doc.title}</td>
                <td>${doc.category}</td>
                <td>
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

// Initial fetch
fetchItems();
