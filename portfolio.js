/* ==========================================================
   KAMIL SALAMEH PHOTOGRAPHY
   Portfolio grid aspect ratios + lightbox viewer
   ========================================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const images = document.querySelectorAll(".portfolio-card img");

    images.forEach((img) => {
        const applyAspectRatio = () => {
            if (img.naturalWidth && img.naturalHeight) {
                const wrapper = img.closest(".image-wrapper");
                wrapper.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
            }
        };

        if (img.complete) {
            applyAspectRatio();
        } else {
            img.addEventListener("load", applyAspectRatio);
        }
    });

    const lightbox = document.getElementById("lightboxModal");
    const lightboxImg = document.getElementById("lightboxImage");
    const lightboxCaption = document.getElementById("lightboxCaption");
    const closeBtn = document.getElementById("lightboxClose");
    const cards = document.querySelectorAll(".portfolio-card");
    let lastTrigger = null;

    const openLightbox = (card) => {
        const img = card.querySelector("img");
        const title = card.querySelector("h3").textContent.trim();

        lastTrigger = card;
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxCaption.textContent = title;

        lightbox.classList.add("active");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        closeBtn.focus();
    };

    const closeLightbox = () => {
        lightbox.classList.remove("active");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        if (lastTrigger) lastTrigger.focus();
    };

    cards.forEach((card) => {
        card.addEventListener("click", () => openLightbox(card));
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openLightbox(card);
            }
        });
    });

    closeBtn.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("active")) return;
        if (e.key === "Escape") closeLightbox();
        // Only one focusable control inside the dialog: keep focus on it.
        if (e.key === "Tab") {
            e.preventDefault();
            closeBtn.focus();
        }
    });

    // Discourage casual saving of full-size images from the viewer.
    lightboxImg.addEventListener("contextmenu", (e) => e.preventDefault());
});
