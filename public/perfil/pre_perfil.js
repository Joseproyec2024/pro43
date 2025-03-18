
// Initialize Lucide icons
lucide.createIcons();

// DOM elements
const menuButton = document.getElementById('menuButton');
const profileSidebar = document.getElementById('profileSidebar');
const copyButton = document.getElementById('copyButton');
const walletAddress = document.getElementById('walletAddress');

// Toggle sidebar
menuButton.addEventListener('click', () => {
    profileSidebar.classList.toggle('open');
    profileSidebar.setAttribute('aria-hidden', !profileSidebar.classList.contains('open'));
    const icon = menuButton.querySelector('i');
    icon.setAttribute('data-lucide', profileSidebar.classList.contains('open') ? 'x' : 'menu');
    lucide.createIcons();
});

// Copy wallet address
copyButton.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(walletAddress.textContent);
        const icon = copyButton.querySelector('i');
        const text = copyButton.querySelector('span');
        
        // Show copied state
        icon.setAttribute('data-lucide', 'check');
        text.textContent = 'Copied!';
        lucide.createIcons();

        // Reset after 2 seconds
        setTimeout(() => {
            icon.setAttribute('data-lucide', 'copy');
            text.textContent = 'Copy Wallet';
            lucide.createIcons();
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
});
