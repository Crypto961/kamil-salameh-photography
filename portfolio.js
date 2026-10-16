/* ==========================================================
   KAMIL SALAMEH PHOTOGRAPHY
   Portfolio lightbox viewer

   Each card is a real link to the full-resolution original, so
   the photographs work without JavaScript and crawlers can find
   them. With JavaScript, the link opens the in-page viewer.
   ========================================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const lightbox = document.getElementById("lightboxModal");
    const lightboxImg = document.getElementById("lightboxImage");
    const lightboxCaption = document.getElementById("lightboxCaption");
    const closeBtn = document.getElementById("lightboxClose");
    const links = document.querySelectorAll(".portfolio-link[data-lightbox]");
    if (!lightbox || !links.length) return;

    let lastTrigger = null;

    const openLightbox = (link) => {
        const img = link.querySelector("img");
        const card = link.closest(".portfolio-card");
        const title = card.querySelector("figcaption h3").textContent.trim();
        const place = card.querySelector("figcaption span").textContent.trim();
        const full = link.getAttribute("href");

        lastTrigger = link;
        // Show the already-loaded version instantly, then swap in the
        // full-resolution original once it has downloaded.
        lightboxImg.src = img.currentSrc || img.src;
        lightboxImg.alt = img.alt;
        if (full && !lightboxImg.src.endsWith(full)) {
            const hiRes = new Image();
            hiRes.onload = () => {
                if (lastTrigger === link && lightbox.classList.contains("active")) {
                    lightboxImg.src = full;
                }
            };
            hiRes.src = full;
        }
        lightboxCaption.textContent = place ? title + " · " + place : title;

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

    links.forEach((link) => {
        link.addEventListener("click", (e) => {
            // Let modified clicks (new tab, download) behave like normal links.
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            openLightbox(link);
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
