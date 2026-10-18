// 1. Inject liquid background + grain
(function injectLiquidBackground() {
    if (document.querySelector('.liquid-bg')) return;
    const bg = document.createElement('div');
    bg.className = 'liquid-bg';
    bg.innerHTML = `
        <div class="liquid-blob b1"></div>
        <div class="liquid-blob b2"></div>
        <div class="liquid-blob b3"></div>
        <div class="liquid-blob b4"></div>
    `;
    document.body.prepend(bg);
})();

// 2. Cursor-follow glow on cards
function cursorGlow() {
    document.querySelectorAll('.item-card, .card, .glass').forEach(card => {
        if (card.dataset.glow) return;
        card.dataset.glow = '1';
        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
            card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
        });
    });
}

// 3. 3D tilt on item cards
function tiltCards() {
    document.querySelectorAll('.item-card').forEach(card => {
        if (card.dataset.tilt) return;
        card.dataset.tilt = '1';
        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = `perspective(1000px) rotateX(${y * -6}deg) rotateY(${x * 6}deg) translateY(-4px) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// 4. Button ripple light
document.addEventListener('mousemove', (e) => {
    const btn = e.target.closest?.('.btn');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--x', `${((e.clientX - r.left) / r.width) * 100}%`);
    btn.style.setProperty('--y', `${((e.clientY - r.top) / r.height) * 100}%`);
});

// 5. Scroll reveal
function scrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'floatUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards';
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.card, .item-card, .glass').forEach(el => io.observe(el));
}

// Run on load
cursorGlow();
tiltCards();
scrollReveal();

// Expose for dynamic content
window.refreshEffects = function() {
    cursorGlow();
    tiltCards();
    scrollReveal();
};