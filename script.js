document.addEventListener('DOMContentLoaded', function () {

  // ─── Mobile Nav Toggle ───
  var toggle = document.getElementById('navToggle');
  var navList = document.getElementById('navList');

  if (toggle && navList) {
    toggle.addEventListener('click', function () {
      navList.classList.toggle('open');
      var expanded = navList.classList.contains('open');
      toggle.setAttribute('aria-expanded', expanded);
    });

    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !navList.contains(e.target)) {
        navList.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navList.classList.contains('open')) {
        navList.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // ─── Active nav link highlight ───
  var currentPath = window.location.pathname.split('/').pop() || 'index.html';
  var links = document.querySelectorAll('.nav-link');
  for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute('href');
    if (href === currentPath) {
      links[i].classList.add('active');
    } else {
      links[i].classList.remove('active');
    }
  }

  // ─── Smooth scroll for anchor links ───
  var anchorLinks = document.querySelectorAll('a[href^="#"]');
  for (var j = 0; j < anchorLinks.length; j++) {
    anchorLinks[j].addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        var target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  }

  // ─── Newsletter signup (CyberImpact) ───
  var nlForm = document.getElementById('newsletterForm');
  if (nlForm) {
    var CI_ROUTE_ID = '6YLePZDwu3PvD3vJNA0QqDtrdrOCb3QcJzdM1ICeFZK3CVbJ7aKnv0wFKrh32yQnkeeWqgDcSaQDOy2Skk3yMg~~';
    var CI_BASE = 'https://app.cyberimpact.com';
    var CI_CANADA_ID = 'CA';
    var ciTokenKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    var ciCsrfToken = null;

    var nlName = document.getElementById('nl-name');
    var nlEmail = document.getElementById('nl-email');
    var nlProvider = document.getElementById('nl-provider');
    var nlCountry = document.getElementById('nl-country');
    var nlProvinceWrap = document.getElementById('nl-province-wrap');
    var nlProvince = document.getElementById('nl-province');
    var nlError = document.getElementById('nl-error');
    var nlSuccess = document.getElementById('nl-success');
    var nlSubmit = document.getElementById('nl-submit');

    function nlShowError(msg) {
      nlError.textContent = msg;
      nlError.hidden = false;
    }
    function nlClearError() {
      nlError.textContent = '';
      nlError.hidden = true;
    }

    // Show Province only for Canadian healthcare providers
    function nlUpdateProvinceVisibility() {
      var show = nlCountry.value === CI_CANADA_ID && nlProvider.value === 'male';
      nlProvinceWrap.hidden = !show;
      if (!show) { nlProvince.value = ''; }
    }
    nlCountry.addEventListener('change', nlUpdateProvinceVisibility);
    nlProvider.addEventListener('change', nlUpdateProvinceVisibility);

    // Fetch the CSRF token needed for submission.
    // (Country options are hardcoded in the HTML.)
    fetch(CI_BASE + '/form/api/fetch/' + CI_ROUTE_ID + '?tokenKey=' + ciTokenKey, { method: 'GET' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        ciCsrfToken = data.csrfToken;
      })
      .catch(function () {
        nlShowError('The signup form could not be loaded. Please try again later.');
      });

    nlForm.addEventListener('submit', function (e) {
      e.preventDefault();
      nlClearError();

      var name = nlName.value.trim();
      var email = nlEmail.value.trim();
      var provider = nlProvider.value;
      var country = nlCountry.value;
      var provinceVisible = !nlProvinceWrap.hidden;
      var province = nlProvince.value.trim();

      if (!name) { nlShowError('Please enter your name.'); nlName.focus(); return; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { nlShowError('Please enter a valid email address.'); nlEmail.focus(); return; }
      if (!provider) { nlShowError('Please tell us whether you are a healthcare provider.'); nlProvider.focus(); return; }
      if (!country) { nlShowError('Please select your country.'); nlCountry.focus(); return; }
      if (!ciCsrfToken) { nlShowError('The signup form is still loading. Please try again in a moment.'); return; }

      nlSubmit.disabled = true;
      nlSubmit.textContent = 'Subscribing…';

      var payload = {
        firstname: name,
        email: email,
        gender: provider,
        country: country,
        // Province defaults to "N/A" when hidden or left blank
        company: (provinceVisible && province) ? province : 'N/A',
        csrfToken: ciCsrfToken,
        tokenKey: ciTokenKey,
        ci_confirm_url: ''
      };

      fetch(CI_BASE + '/form/api/optin/' + CI_ROUTE_ID, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.success) {
            nlForm.hidden = true;
            nlSuccess.hidden = false;
          } else if (data && data.errors) {
            var firstKey = Object.keys(data.errors)[0];
            nlShowError(data.errors[firstKey] || 'Something went wrong. Please try again.');
          } else {
            nlShowError('Something went wrong. Please try again.');
          }
        })
        .catch(function () {
          nlShowError('Something went wrong. Please try again.');
        })
        .finally(function () {
          nlSubmit.disabled = false;
          nlSubmit.textContent = 'Subscribe';
        });
    });
  }

});
