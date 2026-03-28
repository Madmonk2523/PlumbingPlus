const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");
const leadPopup = document.getElementById("leadPopup");
const popupClose = document.getElementById("popupClose");
const yearNode = document.getElementById("year");

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const open = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!open));
    siteNav.classList.toggle("open", !open);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("open");
    });
  });
}

const popupStateKey = "pipesplus-popup-dismissed";
const canShowPopup = !sessionStorage.getItem(popupStateKey);
if (leadPopup && canShowPopup) {
  window.setTimeout(() => {
    leadPopup.hidden = false;
    document.body.style.overflow = "hidden";
  }, 2500);
}

function closePopup() {
  if (!leadPopup) return;
  leadPopup.hidden = true;
  document.body.style.overflow = "";
  sessionStorage.setItem(popupStateKey, "1");
}

if (popupClose) {
  popupClose.addEventListener("click", closePopup);
}

if (leadPopup) {
  leadPopup.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.closePopup === "true") {
      closePopup();
    }
  });
}

function showStatus(form, text, isError = false) {
  const status = form.querySelector(".form-status");
  if (!status) return;
  status.textContent = text;
  status.classList.toggle("error", isError);
  status.classList.toggle("success", !isError);
}

function validateFormData(data) {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  const phoneOk = /^[0-9+()\-\s]{7,}$/.test(data.phone);
  const nameOk = data.name.trim().length >= 2;
  const messageOk = data.message.trim().length >= 8;

  if (!nameOk) return "Please enter your name.";
  if (!emailOk) return "Please enter a valid email.";
  if (!phoneOk) return "Please enter a valid phone number.";
  if (!messageOk) return "Please add more details to your message.";
  return "";
}

async function handleLeadSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;

  const payload = {
    name: String(form.name.value || "").trim(),
    email: String(form.email.value || "").trim(),
    phone: String(form.phone.value || "").trim(),
    message: String(form.message.value || "").trim()
  };

  const validationError = validateFormData(payload);
  if (validationError) {
    showStatus(form, validationError, true);
    return;
  }

  const submitButton = form.querySelector("button[type='submit']");
  if (submitButton instanceof HTMLButtonElement) {
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
  }

  showStatus(form, "", false);

  try {
    const response = await fetch("/api/lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Unable to send request");
    }

    form.reset();
    showStatus(form, "Thanks! We’ll contact you shortly.", false);
    if (form.id === "popupForm") {
      window.setTimeout(closePopup, 1200);
    }
  } catch (error) {
    showStatus(form, "There was an issue sending your request. Please call us now.", true);
  } finally {
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = false;
      submitButton.textContent = "Request Service Now";
    }
  }
}

document.querySelectorAll(".lead-form").forEach((form) => {
  form.addEventListener("submit", handleLeadSubmit);
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  {
    threshold: 0.15
  }
);

document.querySelectorAll(".reveal").forEach((section) => {
  observer.observe(section);
});
