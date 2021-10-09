// Closes notifications after 5 seconds
const notification = document.querySelector('.notification');
const watchlist = document.querySelector('.watchlist-notfication')

function closeFlash() {
    notification.style.display = 'none';
}

function closePopup() {
    watchlist.style.display = 'none';
}

if (notification !== null) {
    window.setTimeout(closeFlash, 5000);
}

if (watchlist !== null) {
    window.setTimeout(closePopup, 5000);
}