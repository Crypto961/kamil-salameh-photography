/* ==========================================================
   KAMIL SALAMEH PHOTOGRAPHY
   Shared site behaviour: header, mobile menu, privacy notice,
   polaroid stacks and form submission.
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

    /* ---------- Polaroid stacks ---------- */

    document.querySelectorAll(".polaroid-interactive-container").forEach((stack) => {
        const toggleStack = () => {
            const expanded = stack.classList.toggle("is-expanded");
            stack.setAttribute("aria-expanded", String(expanded));
        };

        stack.addEventListener("click", toggleStack);
        stack.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleStack();
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
