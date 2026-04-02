// ========================
//  INTRO SCREEN
// ========================
(function () {
  const intro    = document.getElementById('intro');
  const dot      = document.getElementById('introDot');
  const line1    = document.getElementById('introLine1');
  const line2    = document.getElementById('introLine2');
  const bar      = document.getElementById('introBar');

  document.body.classList.add('intro-active');

  const TEXT1 = 'Welcome to my portfolio.';
  const TEXT2 = 'Taking you there...';

  // Typing helper — returns a promise that resolves when done
  function typeText(el, text, speed) {
    return new Promise(resolve => {
      // add blinking cursor span
      const cursorSpan = document.createElement('span');
      cursorSpan.className = 'intro-cursor';
      el.appendChild(cursorSpan);

      let i = 0;
      const interval = setInterval(() => {
        el.insertBefore(document.createTextNode(text[i]), cursorSpan);
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setTimeout(() => {
            cursorSpan.remove();
            resolve();
          }, 320);
        }
      }, speed);
    });
  }

  // Animate progress bar over a given duration
  function runBar(duration) {
    bar.style.transition = `width ${duration}ms linear`;
    bar.style.width = '100%';
  }

  async function runIntro() {
    // 1. Show blinking dot for 900ms
    await delay(300);
    dot.classList.add('visible');
    await delay(900);
    dot.classList.add('done');
    await delay(300);

    // 2. Type line 1
    await typeText(line1, TEXT1, 55);
    await delay(500);

    // 3. Type line 2
    await typeText(line2, TEXT2, 60);
    await delay(300);

    // 4. Run progress bar then dismiss
    runBar(900);
    await delay(950);

    // 5. Fade out intro
    intro.classList.add('hide');
    document.body.classList.remove('intro-active');

    setTimeout(() => {
      intro.style.display = 'none';
      // Trigger hero reveal
      document.querySelectorAll('.hero .reveal').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), 200 + i * 160);
      });
    }, 850);
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  runIntro();
})();

// ========================
//  CUSTOM CURSOR
// ========================
const cursor = document.getElementById('cursor');
const trail = document.getElementById('cursorTrail');

document.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
  setTimeout(() => {
    trail.style.left = e.clientX + 'px';
    trail.style.top = e.clientY + 'px';
  }, 65);
});

document.querySelectorAll('a, button, .btn, .identity-tag, .soft-skill, .goal-card, .cert-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.transform = 'translate(-50%,-50%) scale(2.2)';
    cursor.style.background = 'var(--red-glow)';
    trail.style.borderColor = 'rgba(248,113,113,0.6)';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.transform = 'translate(-50%,-50%) scale(1)';
    cursor.style.background = 'var(--red-light)';
    trail.style.borderColor = 'rgba(239,68,68,0.35)';
  });
});

// ========================
//  NAV SCROLL
// ========================
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 60);
});

// ========================
//  ROLE CYCLER
// ========================
const roles = ['Aspiring Footballer', 'Cyber Security Student', 'Full Stack Developer', 'Builder & Entrepreneur'];
let roleIdx = 0;
const roleEl = document.getElementById('roleCycle');

setInterval(() => {
  roleEl.style.opacity = '0';
  roleEl.style.transform = 'translateY(6px)';
  setTimeout(() => {
    roleIdx = (roleIdx + 1) % roles.length;
    roleEl.textContent = roles[roleIdx];
    roleEl.style.opacity = '1';
    roleEl.style.transform = 'translateY(0)';
  }, 380);
}, 2800);

// ========================
//  REVEAL ON SCROLL
// ========================
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 75);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
revealEls.forEach(el => revealObserver.observe(el));

// ========================
//  SKILL BARS
// ========================
const skillItems = document.querySelectorAll('.skill-item');
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fill = entry.target.querySelector('.skill-fill');
      const pct = entry.target.getAttribute('data-percent');
      setTimeout(() => { fill.style.width = pct + '%'; }, 180);
      barObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });
skillItems.forEach(item => barObserver.observe(item));

// ========================
//  LIGHTBOX
// ========================
function openLightbox(src, title) {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightboxTitle').textContent = title;
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

// ========================
//  CONTACT FORM
// ========================
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const status = document.getElementById('formStatus');
  const btnText = btn.querySelector('.btn-text');
  const btnLoader = btn.querySelector('.btn-loader');

  btnText.style.display = 'none';
  btnLoader.style.display = 'inline';
  btn.disabled = true;

  const form = e.target;

  try {
    // 1. Save to MongoDB
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.value,
        phone: form.phone.value,
        email: form.email.value,
        message: form.message.value
      })
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Failed');

    // 2. Send email notification via EmailJS
    await emailjs.send('service_mcyfssf', 'template_l7m0eld', {
      name: form.name.value,
      phone: form.phone.value,
      email: form.email.value,
      message: form.message.value
    });

    status.textContent = 'Message sent — Alberto will get back to you shortly.';
    status.className = 'form-status success';
    form.reset();

  } catch {
    status.textContent = 'Something went wrong. Reach out directly: +91-9481640682';
    status.className = 'form-status error';
  } finally {
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
    btn.disabled = false;
  }
});

// ========================
//  PARALLAX
// ========================
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  document.querySelectorAll('.orb').forEach((orb, i) => {
    orb.style.transform = `translateY(${y * (i + 1) * 0.025}px)`;
  });
});
