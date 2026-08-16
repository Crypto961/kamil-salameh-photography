/* ==========================================================
   ARDEN STUDIO / KAMIL SALAMEH PHOTOGRAPHY
   Order & Commission Form Handler Script
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('orderForm');
    const orderSuccess = document.getElementById('orderSuccess');

    if (orderForm) {
        orderForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Collect form data values safely
            const formData = {
                name: document.getElementById('clientName').value.trim(),
                email: document.getElementById('clientEmail').value.trim(),
                orderType: document.getElementById('orderType').value,
                itemReference: document.getElementById('printPiece').value.trim(),
                message: document.getElementById('orderDetails').value.trim()
            };

            // Basic validation check
            if (!formData.name || !formData.email || !formData.orderType || !formData.message) {
                alert('Please fill in all required fields before submitting.');
                return;
            }

            // Simulate form submission success state (Can be swapped with Formspree/Fetch endpoint if required)
            orderForm.style.display = 'none';
            orderSuccess.style.display = 'block';

            // Optional console log verification for developer checks
            console.log('Order Form Submission Transmitted:', formData);
        });
    }
});
