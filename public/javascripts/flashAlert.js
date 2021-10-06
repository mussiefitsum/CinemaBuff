function closeFlash() {
    document.querySelector('.notification').style.display = 'none';
}

function closePopup() {
    document.querySelector('.watchlist-notification').style.display = 'none';
}

window.setTimeout(closeFlash, 5000);
window.setTimeout(closePopup, 5000);