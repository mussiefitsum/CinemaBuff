// Closes notifications after 5 seconds
const notification = document.querySelector('.notification');

function closeFlash() {
    notification.style.display = 'none';
}

if (notification !== null) {
    window.setTimeout(closeFlash, 5000);
}
