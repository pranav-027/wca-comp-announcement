function copyToClipboard(elementId) {
    var messageText = document.getElementById(elementId).innerText;
    var tempInput = document.createElement("textarea");
    tempInput.value = messageText;
    document.body.appendChild(tempInput);
    tempInput.select();
    tempInput.setSelectionRange(0, 99999); // For mobile devices
    document.execCommand("copy");
    document.body.removeChild(tempInput);

    var toast = document.getElementById("copyToast");
    toast.classList.add("show");

    setTimeout(function () {
        toast.classList.remove("show");
    }, 2000);
}
