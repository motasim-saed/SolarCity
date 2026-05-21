document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 50,
        });
    }

    // Initialize Swiper dynamically
    let heroSwiper = null;

    // Global Intersection Observer for Videos (Banner & Products)
    let videoObserver = null;

    function initSwiper() {
        if (heroSwiper) {
            try {
                heroSwiper.destroy(true, true);
            } catch (e) {
                console.warn('Swiper destroy failed:', e);
            }
        }

        const swiperWrapper = document.querySelector('.hero-swiper .swiper-wrapper');
        let slides = Array.from(swiperWrapper.querySelectorAll('.swiper-slide'));
        let slideCount = slides.length;

        // Fix for Swiper Loop Warning when there are too few slides
        if (slideCount > 1 && slideCount < 4) {
            slides.forEach(slide => {
                const clone = slide.cloneNode(true);
                // Ensure cloned videos are paused initially
                const video = clone.querySelector('video');
                if (video) video.pause();
                swiperWrapper.appendChild(clone);
            });
            slideCount = document.querySelectorAll('.hero-swiper .swiper-slide').length;
        }

        const shouldLoop = slideCount > 1;
        heroSwiper = new Swiper('.hero-swiper', {
            loop: shouldLoop,
            centeredSlides: true,
            slidesPerView: 'auto',
            spaceBetween: 0,
            speed: 1200,
            effect: 'coverflow',
            coverflowEffect: {
                rotate: 15,
                stretch: 0,
                depth: 300,
                modifier: 1.2,
                slideShadows: true,
            },
            autoplay: shouldLoop ? {
                delay: 5000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            } : false,
            pagination: shouldLoop ? {
                el: '.swiper-pagination',
                clickable: true,
            } : false,
            breakpoints: {
                // جوال صغير
                480: {
                    spaceBetween: 0,
                },
                // جهاز لوحي صغير
                700: {
                    spaceBetween: 0,
                },
                // جهاز لوحي كبير
                900: {
                    spaceBetween: 0,
                },
                // لابتوب - ثلاث بطاقات كاملة
                1100: {
                    spaceBetween: 0,
                },
                // شاشة كبيرة - ثلاثة بطاقات مع مسافة أوسع
                1400: {
                    spaceBetween: 0,
                }
            },
            on: {
                init: function () {
                    handleActiveSlideVideo(this);
                },
                slideChange: function () {
                    handleActiveSlideVideo(this);
                }
            }
        });

        // Initialize or update video observer
        setupVideoObserver();
    }

    function handleActiveSlideVideo(swiper) {
        if (!swiper || !swiper.el) return;

        // Pause all videos in Swiper first
        const allSwiperVideos = swiper.el.querySelectorAll('video');
        allSwiperVideos.forEach(video => {
            video.pause();
        });

        // Get the active slide element
        const activeSlide = swiper.el.querySelector('.swiper-slide-active');
        if (!activeSlide) return;

        // Check if active slide has a video
        const activeVideo = activeSlide.querySelector('video');
        if (activeVideo) {
            activeVideo.muted = true;

            // Pause Swiper autoplay while video is playing
            if (swiper.autoplay && swiper.autoplay.running) {
                swiper.autoplay.stop();
            }

            // Play the active video (only if it is in view)
            activeVideo.play().catch(e => console.log('Active slide video play failed:', e));

            // Listen to video end to transition next
            if (!activeVideo.dataset.hasEndedListener) {
                activeVideo.addEventListener('ended', () => {
                    swiper.slideNext();
                    if (swiper.autoplay) {
                        swiper.autoplay.start();
                    }
                });
                activeVideo.dataset.hasEndedListener = 'true';
            }
        } else {
            // No video, resume Swiper autoplay if it was stopped
            if (swiper.autoplay && !swiper.autoplay.running) {
                swiper.autoplay.start();
            }
        }
    }

    function setupVideoObserver() {
        if (videoObserver) {
            videoObserver.disconnect();
        }

        videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                const isSwiperVideo = video.closest('.hero-swiper');

                if (entry.isIntersecting) {
                    if (isSwiperVideo) {
                        const slide = video.closest('.swiper-slide');
                        if (slide && slide.classList.contains('swiper-slide-active')) {
                            video.muted = true;
                            video.play().catch(e => { });
                            if (heroSwiper && heroSwiper.autoplay) {
                                heroSwiper.autoplay.stop();
                            }
                        }
                    } else {
                        // Product video: play muted
                        video.muted = true;
                        video.play().catch(e => { });
                    }
                } else {
                    // Out of view: pause
                    video.pause();
                }
            });
        }, {
            threshold: 0.15
        });

        observeAllVideos();
    }

    function observeAllVideos() {
        if (!videoObserver) return;
        document.querySelectorAll('video').forEach(video => {
            videoObserver.observe(video);
        });
    }

    // Expose dynamic observer globally
    window.observeAllVideos = observeAllVideos;

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
        document.querySelectorAll(".nav-link:not(.dropdown-toggle), .dropdown-item").forEach(n => n.addEventListener("click", () => {
            hamburger.classList.remove("active");
            navMenu.classList.remove("active");
            const dropdown = document.querySelector('.dropdown');
            if (dropdown) dropdown.classList.remove('active');
        }));

        // Toggle dropdown on mobile click
        const dropdownToggle = document.getElementById('products-dropdown-toggle');
        if (dropdownToggle) {
            dropdownToggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    const dropdown = this.closest('.dropdown');
                    if (dropdown) dropdown.classList.toggle('active');
                }
            });
        }
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
            const navLink = document.querySelector(`.nav-menu a[href*="${sectionId}"]`);

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
                    let mediaUrl = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=2072&auto=format&fit=crop';
                    if (slide.media) {
                        if (Array.isArray(slide.media)) {
                            if (slide.media.length > 0) {
                                mediaUrl = slide.media[0];
                            }
                        } else if (typeof slide.media === 'string') {
                            mediaUrl = slide.media;
                        }
                    }
                    const isVideo = typeof mediaUrl === 'string' && mediaUrl.includes('type=video');

                    const mediaTag = isVideo
                        ? `<video src="${mediaUrl}" autoplay muted playsinline style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:-1; pointer-events:none;"></video>`
                        : ``;

                    const bgStyle = isVideo ? '' : `background-image: url('${mediaUrl}');`;

                    const slideDiv = document.createElement('div');
                    slideDiv.className = 'swiper-slide';
                    if (bgStyle) slideDiv.setAttribute('style', bgStyle);

                    const buttonHtml = (slide.category && slide.category.trim() !== '') ? `
                            <div class="hero-buttons" style="justify-content: center; display: flex; width: 100%;">
                                <button class="btn btn-primary" onclick="scrollAndFilterCategory('${slide.category}')" style="display: inline-flex; align-items: center; gap: 8px;">
                                    <span>${slide.category}</span>
                                    <i class="fa-solid fa-arrow-left"></i>
                                </button>
                            </div>
                    ` : '';

                    slideDiv.innerHTML = `
                        ${mediaTag}
                        <div class="hero-overlay"></div>
                        <div class="container hero-content" style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                            <h1 class="hero-title" style="text-align: center; margin: 0 auto 15px auto;">${slide.title}</h1>
                            <p class="hero-subtitle" style="text-align: center; margin: 0 auto 30px auto; max-width: 800px;">${slide.description}</p>
                            ${buttonHtml}
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
                        <h1 class="hero-title" style="text-align: center;">القحطاني - المدينة الشمسية</h1>
                        <p class="hero-subtitle" style="text-align: center; max-width: 800px;">نقدم لك أفضل حلول وأنظمة الطاقة الشمسية المبتكرة لتوفير فواتيرك وحماية البيئة.</p>
                        <div class="hero-buttons" style="justify-content: center; display: flex;">
                            <a href="#projects" class="btn btn-primary" aria-label="تصفح منتجاتنا">تصفح منتجاتنا</a>
                        </div>
                    </div>
                </div>
            `;
            initSwiper();
        }

        // Global scroll and filter function for slides button link
        window.scrollAndFilterCategory = function (categoryName) {
            let sectionId = 'projects';
            if (categoryName === 'ألواح شمسية') sectionId = 'cat-panels';
            else if (categoryName === 'بطاريات') sectionId = 'cat-batteries';
            else if (categoryName === 'محولات') sectionId = 'cat-inverters';
            else if (categoryName === 'منظومات شمسية') sectionId = 'cat-systems';
            else if (categoryName === 'أدوات كهربائية') sectionId = 'cat-electrical';
            else if (categoryName === 'أدوات منزلية') sectionId = 'cat-household';
            else if (categoryName === 'مشاريع منجزة') sectionId = 'cat-projects-list';

            const targetElement = document.getElementById(sectionId) || document.getElementById('projects');
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        };

        // Fetch Products dynamically
        async function fetchProducts() {
            const productsContainer = document.getElementById('dynamic-products');

            try {

                const response = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTION_ID
                );

                productsContainer.innerHTML = '';

                if (response.documents.length === 0) {
                    productsContainer.innerHTML = '<div style="text-align: center; padding: 40px;">لا توجد منتجات أو مشاريع حالياً.</div>';
                    return;
                }

                window.loadedProducts = response.documents;

                // Setup dynamic navbar navigation links for ALL categories containing products
                const categoryOrder = [
                    "ألواح شمسية",
                    "بطاريات",
                    "محولات",
                    "منظومات شمسية",
                    "أدوات كهربائية",
                    "أدوات منزلية",

                    "مشاريع منجزة"
                ];

                const categoryIds = {
                    "ألواح شمسية": "cat-panels",
                    "بطاريات": "cat-batteries",
                    "محولات": "cat-inverters",
                    "منظومات شمسية": "cat-systems",
                    "أدوات كهربائية": "cat-electrical",
                    "أدوات منزلية": "cat-household",

                    "مشاريع منجزة": "cat-projects-list",
                    "عام": "cat-general"
                };

                // Get unique active categories
                const activeCategories = [...new Set(response.documents.map(doc => doc.category).filter(Boolean))];

                // Sort active categories based on predefined order
                activeCategories.sort((a, b) => {
                    let indexA = categoryOrder.indexOf(a);
                    let indexB = categoryOrder.indexOf(b);
                    if (indexA === -1) indexA = 999;
                    if (indexB === -1) indexB = 999;
                    return indexA - indexB;
                });

                // Clear and populate static categories dropdown menu
                const dropdownMenu = document.getElementById('categories-dropdown-menu');
                if (dropdownMenu) {
                    dropdownMenu.innerHTML = '';
                    
                    const categoryIcons = {
                        "ألواح شمسية": "fa-solid fa-solar-panel",
                        "بطاريات": "fa-solid fa-battery-three-quarters",
                        "محولات": "fa-solid fa-repeat",
                        "منظومات شمسية": "fa-solid fa-network-wired",
                        "أدوات كهربائية": "fa-solid fa-plug",
                        "أدوات منزلية": "fa-solid fa-house-laptop",
                        "مشاريع منجزة": "fa-solid fa-clipboard-check",
                        "عام": "fa-solid fa-box"
                    };

                    activeCategories.forEach(cat => {
                        const sectionId = categoryIds[cat] || "cat-" + encodeURIComponent(cat).replace(/%/g, "");
                        const iconClass = categoryIcons[cat] || "fa-solid fa-sun";

                        const newLi = document.createElement("li");
                        
                        const navLink = document.createElement("a");
                        navLink.href = `#${sectionId}`;
                        navLink.className = "dropdown-item";
                        navLink.innerHTML = `<i class="${iconClass}"></i> <span>${cat}</span>`;

                        // Close mobile menu and smooth scroll when clicked
                        navLink.addEventListener('click', function (e) {
                            e.preventDefault();

                            // Close hamburger menu on mobile
                            const hamburger = document.querySelector(".hamburger");
                            const navMenu = document.querySelector(".nav-menu");
                            const dropdown = document.querySelector(".dropdown");
                            if (hamburger && navMenu) {
                                hamburger.classList.remove("active");
                                navMenu.classList.remove("active");
                            }
                            if (dropdown) {
                                dropdown.classList.remove("active");
                            }

                            // Smooth Scroll directly to the category section
                            const targetElement = document.getElementById(sectionId);
                            if (targetElement) {
                                const headerHeight = document.querySelector('.header').offsetHeight;
                                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                                window.scrollTo({
                                    top: targetPosition,
                                    behavior: 'smooth'
                                });
                            }
                        });

                        newLi.appendChild(navLink);
                        dropdownMenu.appendChild(newLi);
                    });
                }

                // Render products grouped by category and stacked vertically
                window.renderProductsVertical();

            } catch (error) {
                console.error('Error fetching products:', error);
                productsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--danger);">حدث خطأ أثناء جلب البيانات. تأكد من إعدادات Appwrite.</div>';
            }
        }

        // Render products vertically by category
        window.renderProductsVertical = function () {
            const productsContainer = document.getElementById('dynamic-products');
            productsContainer.innerHTML = '';

            // Group products by category
            const productsByCategory = {};
            window.loadedProducts.forEach(doc => {
                const cat = doc.category || 'عام';
                if (!productsByCategory[cat]) {
                    productsByCategory[cat] = [];
                }
                productsByCategory[cat].push(doc);
            });

            // Define ordered categories and metadata
            const categoryOrder = [
                "ألواح شمسية",
                "بطاريات",
                "محولات",
                "منظومات شمسية",
                "أدوات كهربائية",
                "أدوات منزلية",

                "مشاريع منجزة"
            ];

            const categoryIcons = {
                "ألواح شمسية": "fa-solid fa-solar-panel",
                "بطاريات": "fa-solid fa-battery-three-quarters",
                "محولات": "fa-solid fa-repeat",
                "منظومات شمسية": "fa-solid fa-network-wired",
                "أدوات كهربائية": "fa-solid fa-plug",
                "أدوات منزلية": "fa-solid fa-house-laptop",

                "مشاريع منجزة": "fa-solid fa-clipboard-check",
                "عام": "fa-solid fa-box"
            };

            const categoryIds = {
                "ألواح شمسية": "cat-panels",
                "بطاريات": "cat-batteries",
                "محولات": "cat-inverters",
                "منظومات شمسية": "cat-systems",
                "أدوات كهربائية": "cat-electrical",
                "أدوات منزلية": "cat-household",
                "إنارة شوارع ولمبات محمولة": "cat-lighting",
                "مشاريع منجزة": "cat-projects-list",
                "عام": "cat-general"
            };

            // Sort active categories based on predefined order
            const activeCategories = Object.keys(productsByCategory).sort((a, b) => {
                let indexA = categoryOrder.indexOf(a);
                let indexB = categoryOrder.indexOf(b);
                if (indexA === -1) indexA = 999;
                if (indexB === -1) indexB = 999;
                return indexA - indexB;
            });

            // Generate HTML structure for each category
            activeCategories.forEach(cat => {
                const products = productsByCategory[cat];
                if (products.length === 0) return;

                const sectionId = categoryIds[cat] || "cat-" + encodeURIComponent(cat).replace(/%/g, "");
                const iconClass = categoryIcons[cat] || "fa-solid fa-sun";

                const categorySection = document.createElement("section");
                categorySection.id = sectionId;
                categorySection.className = "category-section";
                categorySection.style.scrollMarginTop = "90px";

                // Header with a premium dynamic styling
                const headerDiv = document.createElement("div");
                headerDiv.className = "category-header";
                headerDiv.innerHTML = `
                    <h3><i class="${iconClass}"></i> ${cat}</h3>
                    <div class="category-divider"></div>
                `;

                // Product Grid
                const gridDiv = document.createElement("div");
                gridDiv.className = "products-grid";

                products.forEach(doc => {
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
                    // We removed data-aos="fade-up" here because it causes the products to stay hidden (opacity: 0) 
                    // if AOS fails to calculate their offsets dynamically before images load.
                    card.style.animation = "modalAppear 0.5s ease forwards"; // Add a simple CSS fade-in instead
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
                    gridDiv.appendChild(card);
                });

                categorySection.appendChild(headerDiv);
                categorySection.appendChild(gridDiv);
                productsContainer.appendChild(categorySection);
            });

            // Trigger video observer to watch newly loaded product videos
            if (typeof window.observeAllVideos === 'function') {
                window.observeAllVideos();
            }

            // Refresh AOS for newly added elements
            if (typeof AOS !== 'undefined') {
                AOS.refresh();
            }
        };

        // Start loaders
        fetchHeroSlides();
        fetchProducts();
    }

    // Modal Global Functions
    window.openProductDetails = function (id) {
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
                modalMainVideo.play().catch(() => { });
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

                    thumbContainer.innerHTML = `
                        <video src="${mediaUrl}" style="width:100%;height:100%;object-fit:cover;pointer-events:none;"></video>
                        <i class="fa-solid fa-play" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;background:rgba(20,33,61,0.8);border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:0.6rem;border:1px solid rgba(255,255,255,0.2);"></i>
                    `;

                    thumbContainer.onclick = function () {
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

                    thumb.onclick = function () {
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
        const whatsappNumber = "+967781663300";
        let mainMediaUrl = '';
        if (product.media && product.media.length > 0) {
            mainMediaUrl = product.media[0];
        }
        
        let productInfo = `السلام عليكم ورحمة الله، أرغب في الاستفسار عن منتج:
- الاسم: ${product.name}
- القسم: ${product.category || 'غير محدد'}
- النوع: ${product.type || 'غير محدد'}
- السعر: ${product.newPrice ? product.newPrice + ' ريال' : 'غير محدد'}`;

        if (mainMediaUrl) {
            productInfo += `\n- رابط الصورة/الفيديو: ${mainMediaUrl}`;
        }
        
        productInfo += `\n- الوصف الكامل: ${product.description || 'لا يوجد'}`;

        const encodedText = encodeURIComponent(productInfo);
        modalWhatsappBtn.href = `https://wa.me/${whatsappNumber}?text=${encodedText}`;

        modal.classList.add('active');

        // Push modal state into history to intercept the hardware back button
        history.pushState({ modalOpen: true }, "");
        
        // Hide floating whatsapp
        const floatingBtn = document.querySelector('.floating-whatsapp');
        if (floatingBtn) floatingBtn.style.display = 'none';
    };

    // Close Modal Logic (including hardware back button support)
    const modal = document.getElementById('productModal');
    const closeBtn = document.querySelector('.close-modal');

    function closeModalAction() {
        if (modal && modal.classList.contains('active')) {
            modal.classList.remove('active');
            const modalMainVideo = document.getElementById('modalMainVideo');
            if (modalMainVideo) modalMainVideo.pause();
            
            // Show floating whatsapp
            const floatingBtn = document.querySelector('.floating-whatsapp');
            if (floatingBtn) floatingBtn.style.display = 'flex';
        }
    }

    if (closeBtn && modal) {
        closeBtn.onclick = function () {
            if (history.state && history.state.modalOpen) {
                history.back();
            } else {
                closeModalAction();
            }
        };
        window.onclick = function (event) {
            if (event.target == modal) {
                if (history.state && history.state.modalOpen) {
                    history.back();
                } else {
                    closeModalAction();
                }
            }
        };
    }

    // Listen for hardware/browser back button event
    window.addEventListener('popstate', function (event) {
        closeModalAction();
    });
});
