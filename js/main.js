document.addEventListener('DOMContentLoaded', () => {
    // Initialize Swiper dynamically
    let heroSwiper = null;
    
    function initSwiper() {
        if (heroSwiper) {
            try {
                heroSwiper.destroy(true, true);
            } catch (e) {
                console.warn('Swiper destroy failed:', e);
            }
        }
        
        heroSwiper = new Swiper('.hero-swiper', {
            loop: true,
            effect: 'fade',
            autoplay: {
                delay: 6000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
        });
    }

    // Initial call
    initSwiper();

    // Mobile Menu Toggle
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll(".nav-link").forEach(n => n.addEventListener("click", () => {
            hamburger.classList.remove("active");
            navMenu.classList.remove("active");
        }));
    }

    // Sticky Header Effect
    const header = document.querySelector(".header");
    
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
        
        updateActiveLink();
    });

    // Update active link based on scroll position
    function updateActiveLink() {
        const sections = document.querySelectorAll("section[id]");
        let scrollY = window.pageYOffset;

        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 100;
            const sectionId = current.getAttribute("id");
            const navLink = document.querySelector(`.nav-menu a[href*=${sectionId}]`);

            if (navLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
                    navLink.classList.add("active");
                }
            }
        });
    }

    // Smooth Scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Number Counter Animation for Statistics
    const animateValue = (obj, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                if (obj.dataset.plus) obj.innerHTML += '+';
                if (obj.dataset.percent) obj.innerHTML += '%';
            }
        };
        window.requestAnimationFrame(step);
    };

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const numberElements = entry.target.querySelectorAll('h3');
                
                numberElements.forEach(el => {
                    let text = el.innerText;
                    let endVal = parseInt(text.replace(/[^0-9]/g, ''));
                    
                    if (!isNaN(endVal)) {
                        if (text.includes('+')) el.dataset.plus = true;
                        if (text.includes('%')) el.dataset.percent = true;
                        
                        animateValue(el, 0, endVal, 2000);
                        observer.unobserve(entry.target);
                    }
                });
            }
        });
    }, observerOptions);

    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) {
        observer.observe(statsSection);
    }

    // --- Appwrite Integration ---
    if (typeof Appwrite !== 'undefined' && document.getElementById('dynamic-products')) {
        const { Client, Databases } = Appwrite;
        
        const client = new Client()
            .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
            .setProject(APPWRITE_CONFIG.PROJECT_ID);

        const databases = new Databases(client);
        
        // Fetch Banners dynamically
        async function fetchHeroSlides() {
            const slidesContainer = document.getElementById('dynamic-hero-slides');
            try {
                if (APPWRITE_CONFIG.PROJECT_ID === 'YOUR_PROJECT_ID') return;
                
                const response = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.SLIDER_COLLECTION_ID
                );

                if (response.documents.length === 0) {
                    // Default Fallback slide
                    renderDefaultSlides(slidesContainer);
                    return;
                }

                slidesContainer.innerHTML = '';
                response.documents.forEach(slide => {
                    const mediaUrl = slide.media && slide.media.length > 0 ? slide.media[0] : 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=2072&auto=format&fit=crop';
                    const isVideo = mediaUrl.includes('type=video');
                    
                    const mediaTag = isVideo 
                        ? `<video src="${mediaUrl}" autoplay muted loop playsinline style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:-1; pointer-events:none;"></video>`
                        : ``;
                    
                    const bgStyle = isVideo ? '' : `background-image: url('${mediaUrl}');`;

                    const slideDiv = document.createElement('div');
                    slideDiv.className = 'swiper-slide';
                    if (bgStyle) slideDiv.setAttribute('style', bgStyle);
                    
                    slideDiv.innerHTML = `
                        ${mediaTag}
                        <div class="hero-overlay"></div>
                        <div class="container hero-content" style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                            <h1 class="hero-title" style="text-align: center; margin: 0 auto 15px auto;">${slide.title}</h1>
                            <p class="hero-subtitle" style="text-align: center; margin: 0 auto 30px auto; max-width: 800px;">${slide.description}</p>
                            <div class="hero-buttons" style="justify-content: center; display: flex; width: 100%;">
                                <button class="btn btn-primary" onclick="scrollAndFilterCategory('${slide.category}')" style="display: inline-flex; align-items: center; gap: 8px;">
                                    <span>عرض قسم: ${slide.category}</span>
                                    <i class="fa-solid fa-arrow-left"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    slidesContainer.appendChild(slideDiv);
                });

                initSwiper();

            } catch (error) {
                console.error('Error fetching hero slides:', error);
                renderDefaultSlides(slidesContainer);
            }
        }

        function renderDefaultSlides(container) {
            container.innerHTML = `
                <div class="swiper-slide" style="background-image: url('https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=2072&auto=format&fit=crop');">
                    <div class="hero-overlay"></div>
                    <div class="container hero-content" style="text-align: center; display: flex; flex-direction: column; align-items: center;">
                        <h1 class="hero-title" style="text-align: center;">مدينة الطاقة الشمسية</h1>
                        <p class="hero-subtitle" style="text-align: center; max-width: 800px;">نقدم لك أفضل حلول وأنظمة الطاقة الشمسية المبتكرة لتوفير فواتيرك وحماية البيئة.</p>
                        <div class="hero-buttons" style="justify-content: center; display: flex;">
                            <a href="#projects" class="btn btn-primary">تصفح منتجاتنا</a>
                        </div>
                    </div>
                </div>
            `;
            initSwiper();
        }

        // Global scroll and filter function for slides button link
        window.scrollAndFilterCategory = function(categoryName) {
            const targetElement = document.getElementById('projects');
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
            
            setTimeout(() => {
                window.filterByCategory(categoryName);
            }, 600);
        };

        // Fetch Products dynamically
        async function fetchProducts() {
            const productsContainer = document.getElementById('dynamic-products');
            
            try {
                if (APPWRITE_CONFIG.PROJECT_ID === 'YOUR_PROJECT_ID') {
                    productsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">يرجى إضافة معرفات Appwrite في ملف config.js لعرض المنتجات.</div>';
                    return;
                }

                const response = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTION_ID
                );

                productsContainer.innerHTML = '';

                if (response.documents.length === 0) {
                    productsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">لا توجد منتجات أو مشاريع حالياً.</div>';
                    return;
                }

                window.loadedProducts = response.documents;

                // Setup dynamic category filters
                const filterContainer = document.getElementById('category-filter-container');
                const filterScroll = filterContainer.querySelector('.category-filter-scroll');
                
                // Get list of unique categories actually containing products
                const activeCategories = [...new Set(response.documents.map(doc => doc.category).filter(Boolean))];
                
                if (activeCategories.length > 0) {
                    filterContainer.style.display = 'block';
                    
                    // Reset container but keep the "الكل" button
                    filterScroll.innerHTML = `<button id="filter-btn-all" class="filter-btn active" onclick="window.filterByCategory('all', this)">الكل</button>`;
                    
                    activeCategories.forEach(cat => {
                        const btn = document.createElement('button');
                        btn.className = 'filter-btn';
                        btn.innerText = cat;
                        btn.onclick = function() {
                            window.filterByCategory(cat, btn);
                        };
                        filterScroll.appendChild(btn);
                    });
                } else {
                    filterContainer.style.display = 'none';
                }

                // Render all products initially
                window.renderProductsGrid('all');

            } catch (error) {
                console.error('Error fetching products:', error);
                productsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--danger);">حدث خطأ أثناء جلب البيانات. تأكد من إعدادات Appwrite.</div>';
            }
        }

        // Global filter products
        window.filterByCategory = function(categoryName, btnEl) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            
            if (btnEl) {
                btnEl.classList.add('active');
            } else {
                if (categoryName === 'all') {
                    const allBtn = document.getElementById('filter-btn-all');
                    if (allBtn) allBtn.classList.add('active');
                } else {
                    const buttons = document.querySelectorAll('.filter-btn');
                    buttons.forEach(btn => {
                        if (btn.innerText === categoryName) {
                            btn.classList.add('active');
                        }
                    });
                }
            }

            window.renderProductsGrid(categoryName);
        };

        // Render products grid helper
        window.renderProductsGrid = function(filterCategory = 'all') {
            const productsContainer = document.getElementById('dynamic-products');
            productsContainer.innerHTML = '';

            const filtered = filterCategory === 'all'
                ? window.loadedProducts
                : window.loadedProducts.filter(doc => doc.category === filterCategory);

            if (filtered.length === 0) {
                productsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">لا توجد منتجات في هذا القسم حالياً.</div>';
                return;
            }

            filtered.forEach(doc => {
                const imgSrc = doc.media && doc.media.length > 0 ? doc.media[0] : 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=2072&auto=format&fit=crop';
                const isVideo = imgSrc.includes('type=video');
                
                const mediaTag = isVideo 
                    ? `<video src="${imgSrc}" autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;pointer-events:none;"></video>`
                    : `<img src="${imgSrc}" alt="${doc.name}">`;

                let priceHtml = '';
                if (doc.newPrice) {
                    priceHtml = `<div class="product-price">
                                    <span class="new-price">${doc.newPrice} ريال</span>
                                    ${doc.oldPrice ? `<span class="old-price">${doc.oldPrice} ريال</span>` : ''}
                                 </div>`;
                }

                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <div class="product-img-wrapper">
                        <span class="product-category">${doc.category || 'عام'}</span>
                        ${mediaTag}
                    </div>
                    <div class="product-content">
                        <h3>${doc.name}</h3>
                        <span class="product-type">${doc.type || ''}</span>
                        <p class="product-desc">${doc.description ? doc.description.substring(0, 70) + '...' : ''}</p>
                        
                        <div class="product-footer">
                            ${priceHtml}
                            <button class="btn-details" onclick="openProductDetails('${doc.$id}')" style="background: none; border: none; cursor: pointer; font-family: inherit;">التفاصيل <i class="fa-solid fa-arrow-left"></i></button>
                        </div>
                    </div>
                `;
                productsContainer.appendChild(card);
            });
        };

        // Start loaders
        fetchHeroSlides();
        fetchProducts();
    }

    // Modal Global Functions
    window.openProductDetails = function(id) {
        const product = window.loadedProducts.find(p => p.$id === id);
        if (!product) return;

        const modal = document.getElementById('productModal');
        const modalMainImg = document.getElementById('modalMainImg');
        const modalMainVideo = document.getElementById('modalMainVideo');
        const modalThumbnails = document.getElementById('modalThumbnails');
        const modalTitle = document.getElementById('modalTitle');
        const modalType = document.getElementById('modalType');
        const modalCategory = document.getElementById('modalCategory');
        const modalPrice = document.getElementById('modalPrice');
        const modalDesc = document.getElementById('modalDesc');
        const modalWhatsappBtn = document.getElementById('modalWhatsappBtn');

        modalTitle.innerText = product.name;
        modalType.innerText = product.type || '';
        modalCategory.innerText = product.category || '';
        modalDesc.innerText = product.description || '';

        // Price
        let priceHtml = '';
        if (product.newPrice) {
            priceHtml = `<span class="new-price">${product.newPrice} ريال</span>`;
            if (product.oldPrice) {
                priceHtml += `<span class="old-price" style="margin-right: 10px; color:#777; text-decoration:line-through;">${product.oldPrice} ريال</span>`;
            }
        }
        modalPrice.innerHTML = priceHtml;

        // Set Main Media Display
        function setMainMedia(mediaUrl) {
            const isVideo = mediaUrl.includes('type=video');
            if (isVideo) {
                modalMainVideo.src = mediaUrl;
                modalMainVideo.style.display = 'block';
                modalMainImg.style.display = 'none';
                modalMainVideo.play().catch(() => {});
            } else {
                modalMainImg.src = mediaUrl;
                modalMainImg.style.display = 'block';
                modalMainVideo.style.display = 'none';
                modalMainVideo.pause();
            }
        }

        // Gallery
        modalThumbnails.innerHTML = '';
        if (product.media && product.media.length > 0) {
            setMainMedia(product.media[0]);
            
            product.media.forEach((mediaUrl, index) => {
                const isThumbVideo = mediaUrl.includes('type=video');
                
                if (isThumbVideo) {
                    const thumbContainer = document.createElement('div');
                    thumbContainer.className = `modal-thumbnail ${index === 0 ? 'active' : ''}`;
                    thumbContainer.style.position = 'relative';
                    thumbContainer.style.display = 'inline-block';
                    thumbContainer.style.cursor = 'pointer';
                    thumbContainer.style.width = '65px';
                    thumbContainer.style.height = '65px';
                    thumbContainer.style.borderRadius = '8px';
                    thumbContainer.style.overflow = 'hidden';
                    thumbContainer.style.flexShrink = '0';
                    
                    thumbContainer.innerHTML = `
                        <video src="${mediaUrl}" style="width:100%;height:100%;object-fit:cover;pointer-events:none;"></video>
                        <i class="fa-solid fa-play" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;background:rgba(20,33,61,0.8);border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:0.6rem;border:1px solid rgba(255,255,255,0.2);"></i>
                    `;
                    
                    thumbContainer.onclick = function() {
                        setMainMedia(mediaUrl);
                        document.querySelectorAll('.modal-thumbnail').forEach(t => t.classList.remove('active'));
                        thumbContainer.classList.add('active');
                    };
                    modalThumbnails.appendChild(thumbContainer);
                } else {
                    const thumb = document.createElement('img');
                    thumb.src = mediaUrl;
                    thumb.className = `modal-thumbnail ${index === 0 ? 'active' : ''}`;
                    thumb.alt = `${product.name} - ${index + 1}`;
                    thumb.style.width = '65px';
                    thumb.style.height = '65px';
                    thumb.style.objectFit = 'cover';
                    thumb.style.borderRadius = '8px';
                    thumb.style.flexShrink = '0';
                    
                    thumb.onclick = function() {
                        setMainMedia(mediaUrl);
                        document.querySelectorAll('.modal-thumbnail').forEach(t => t.classList.remove('active'));
                        thumb.classList.add('active');
                    };
                    modalThumbnails.appendChild(thumb);
                }
            });
            modalThumbnails.style.display = product.media.length > 1 ? 'flex' : 'none';
        } else {
            modalMainImg.src = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=2072&auto=format&fit=crop';
            modalMainImg.style.display = 'block';
            modalMainVideo.style.display = 'none';
            modalThumbnails.style.display = 'none';
        }

        // WhatsApp Message
        const whatsappNumber = "+966500000000";
        const productInfo = `السلام عليكم ورحمة الله، أرغب في الاستفسار عن منتج:
- الاسم: ${product.name}
- القسم: ${product.category || 'غير محدد'}
- النوع: ${product.type || 'غير محدد'}
- السعر: ${product.newPrice ? product.newPrice + ' ريال' : 'غير محدد'}
- الوصف الكامل: ${product.description || 'لا يوجد'}`;
        
        const encodedText = encodeURIComponent(productInfo);
        modalWhatsappBtn.href = `https://wa.me/${whatsappNumber}?text=${encodedText}`;

        modal.classList.add('active');
    };

    // Close Modal Logic
    const modal = document.getElementById('productModal');
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn && modal) {
        closeBtn.onclick = function() {
            modal.classList.remove('active');
            const modalMainVideo = document.getElementById('modalMainVideo');
            if (modalMainVideo) modalMainVideo.pause();
        };
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.classList.remove('active');
                const modalMainVideo = document.getElementById('modalMainVideo');
                if (modalMainVideo) modalMainVideo.pause();
            }
        };
    }
});
