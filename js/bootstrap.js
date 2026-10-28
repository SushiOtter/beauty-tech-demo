const warning = document.querySelector("#boot-warning");
if (warning && location.protocol === "file:") warning.hidden = false;
