const username = document.querySelector("#username");
const password = document.querySelector("#password");

document.querySelectorAll("[data-username]").forEach((button) => {
  button.addEventListener("click", () => {
    username.value = button.dataset.username;
    password.value = button.dataset.password;
    document.querySelectorAll("[data-username]").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    username.focus();
  });
});
