/* ==========================================================
   KAMIL SALAMEH PHOTOGRAPHY
   Shared site behaviour: header, mobile menu, motion, privacy notice
   and form submission.
   ========================================================== */

"use strict";

(function () {

    /* ---------- Header: scrolled state + mobile menu ---------- */

    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".menu-toggle");

    if (header) {
        const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 20);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    if (header && toggle) {
        const setOpen = (open) => {
            header.classList.toggle("menu-open", open);
            toggle.setAttribute("aria-expanded", String(open));
            toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        };

        toggle.addEventListener("click", () => {
            setOpen(toggle.getAttribute("aria-expanded") !== "true");
        });

        header.querySelectorAll(".nav-links a").forEach((link) => {
            link.addEventListener("click", () => setOpen(false));
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && header.classList.contains("menu-open")) {
                setOpen(false);
                toggle.focus();
            }
        });
    }

    /* ---------- Motion: scroll reveals + polaroid stacks ----------
       Content is fully visible without JavaScript. Only elements that start
       below the fold are hidden for a reveal, so nothing flashes on load.
       Respects the visitor's reduced-motion preference. */

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canObserve = "IntersectionObserver" in window;
    const belowFold = (el) => el.getBoundingClientRect().top > window.innerHeight * 0.92;

    if (!reduceMotion && canObserve) {
        const revealables = Array.from(document.querySelectorAll("[data-reveal]")).filter(belowFold);
        revealables.forEach((el) => el.classList.add("reveal-pending"));

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                el.classList.add("is-revealed");
                revealObserver.unobserve(el);
                // Hand control back to the element's own transitions (e.g. hover effects).
                el.addEventListener("transitionend", function done(e) {
                    if (e.target !== el || e.propertyName !== "transform") return;
                    el.classList.remove("reveal-pending", "is-revealed");
                    el.removeEventListener("transitionend", done);
                });
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

        revealables.forEach((el) => revealObserver.observe(el));

        // Fallback for jumps (anchor links, fast scrolls): reveal anything the
        // visitor has already scrolled past, so no section stays hidden.
        let ticking = false;
        window.addEventListener("scroll", () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                ticking = false;
                document.querySelectorAll(".reveal-pending:not(.is-revealed)").forEach((el) => {
                    if (el.getBoundingClientRect().top < window.innerHeight) {
                        el.classList.add("is-revealed");
                        revealObserver.unobserve(el);
                    }
                });
            });
        }, { passive: true });
    }

    document.querySelectorAll(".polaroid-interactive-container").forEach((stack) => {
        const setSpread = (spread) => {
            stack.classList.toggle("is-expanded", spread);
            stack.setAttribute("aria-expanded", String(spread));
        };

        // Fan the stack out when it scrolls into view (it is spread by default
        // in the HTML, so it stays readable without JavaScript).
        if (!reduceMotion && canObserve && belowFold(stack)) {
            setSpread(false);
            const fanObserver = new IntersectionObserver((entries) => {
                if (!entries[0].isIntersecting) return;
                window.setTimeout(() => setSpread(true), 250);
                fanObserver.disconnect();
            }, { threshold: 0.35 });
            fanObserver.observe(stack);
        }

        const toggleSpread = () => setSpread(!stack.classList.contains("is-expanded"));
        stack.addEventListener("click", toggleSpread);
        stack.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleSpread();
            }
        });
    });

    /* ---------- Footer year ---------- */

    document.querySelectorAll("[data-year]").forEach((el) => {
        el.textContent = String(new Date().getFullYear());
    });

    /* ---------- Privacy notice ----------
       The site sets no cookies and uses no analytics. The notice is
       informational; dismissing it stores one flag in localStorage so it
       is not shown again. If analytics or embeds are ever added, this must
       become a real opt-in consent prompt that blocks them until accepted. */

    const NOTICE_KEY = "ks-privacy-notice-v1";
    const notice = document.getElementById("privacyNotice");

    const readFlag = () => {
        try { return localStorage.getItem(NOTICE_KEY); } catch (e) { return null; }
    };
    const writeFlag = () => {
        try { localStorage.setItem(NOTICE_KEY, "dismissed"); } catch (e) { /* storage blocked */ }
    };

    if (notice) {
        if (!readFlag()) notice.hidden = false;

        const dismiss = notice.querySelector("[data-dismiss-notice]");
        if (dismiss) {
            dismiss.addEventListener("click", () => {
                writeFlag();
                notice.hidden = true;
            });
        }
    }

    document.querySelectorAll("[data-open-privacy-notice]").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (notice) {
                notice.hidden = false;
                const dismiss = notice.querySelector("[data-dismiss-notice]");
                if (dismiss) dismiss.focus();
            }
        });
    });

    /* ---------- Form submission (Formspree, via fetch) ---------- */

    document.querySelectorAll("form[data-ajax-form]").forEach((form) => {
        const status = form.querySelector(".form-status");
        const submit = form.querySelector("[type='submit']");
        const success = form.dataset.successTarget
            ? document.getElementById(form.dataset.successTarget)
            : null;

        const setStatus = (msg, type) => {
            if (!status) return;
            status.textContent = msg;
            status.classList.toggle("is-error", type === "error");
            status.classList.toggle("is-success", type === "success");
        };

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const submitLabel = submit ? submit.textContent : "";
            if (submit) {
                submit.disabled = true;
                submit.textContent = "Sending…";
            }
            setStatus("", null);

            try {
                const response = await fetch(form.action, {
                    method: "POST",
                    body: new FormData(form),
                    headers: { Accept: "application/json" }
                });

                if (!response.ok) throw new Error("Request failed: " + response.status);

                form.reset();
                form.dispatchEvent(new CustomEvent("ks:submitted"));

                if (success) {
                    form.hidden = true;
                    success.hidden = false;
                    success.focus();
                } else {
                    setStatus("Thank you — your message has been sent. You will hear back shortly.", "success");
                }
            } catch (err) {
                setStatus("Sorry, your message could not be sent. Please try again in a moment or reach out on Instagram.", "error");
            } finally {
                if (submit) {
                    submit.disabled = false;
                    submit.textContent = submitLabel;
                }
            }
        });
    });

})();
