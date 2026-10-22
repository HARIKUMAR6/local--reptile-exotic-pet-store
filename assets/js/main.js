/* WildHaven Exotics — shared site behavior */
(function () {
  'use strict';

  var THEME_KEY = 'wh-theme';
  var DIR_KEY = 'wh-dir';

  /* ---------- Theme ---------- */
  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      btn.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      );
    });
  }

  function currentTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  function initTheme() {
    applyTheme(currentTheme());
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = currentTheme() === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch (e) {
          /* storage unavailable */
        }
      });
    });
  }

  /* ---------- Direction ---------- */
  function applyDirection(dir) {
    document.documentElement.setAttribute('dir', dir);
    document.querySelectorAll('[data-dir-toggle]').forEach(function (btn) {
      btn.textContent = dir === 'rtl' ? 'LTR' : 'RTL';
      btn.setAttribute(
        'aria-label',
        dir === 'rtl' ? 'Switch to left-to-right layout' : 'Switch to right-to-left layout'
      );
    });
  }

  function currentDirection() {
    return document.documentElement.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr';
  }

  function initDirection() {
    applyDirection(currentDirection());
    document.querySelectorAll('[data-dir-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = currentDirection() === 'rtl' ? 'ltr' : 'rtl';
        applyDirection(next);
        try {
          localStorage.setItem(DIR_KEY, next);
        } catch (e) {
          /* storage unavailable */
        }
      });
    });
  }

  /* ---------- Home dropdown ---------- */
  function initHomeDropdown() {
    var triggers = document.querySelectorAll('[data-dropdown-trigger]');
    triggers.forEach(function (trigger) {
      var wrapper = trigger.closest('[data-dropdown]');
      var menu = wrapper ? wrapper.querySelector('[data-dropdown-menu]') : null;
      if (!menu) return;

      function close() {
        menu.classList.add('hidden');
        trigger.setAttribute('aria-expanded', 'false');
      }
      function open() {
        menu.classList.remove('hidden');
        trigger.setAttribute('aria-expanded', 'true');
      }
      function toggle() {
        if (menu.classList.contains('hidden')) open();
        else close();
      }

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        toggle();
      });

      document.addEventListener('click', function (e) {
        if (!wrapper.contains(e.target)) close();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
      });

      wrapper.addEventListener('focusout', function (e) {
        if (!wrapper.contains(e.relatedTarget)) close();
      });
    });
  }

  /* ---------- Mobile navigation drawer ---------- */
  function initMobileNav() {
    var openBtn = document.querySelector('[data-nav-open]');
    var closeBtn = document.querySelector('[data-nav-close]');
    var drawer = document.querySelector('[data-nav-drawer]');
    var overlay = document.querySelector('[data-nav-overlay]');
    if (!openBtn || !drawer || !overlay) return;

    var lastFocused = null;

    function resetMobileDropdowns() {
      drawer.querySelectorAll('[data-mobile-dropdown]').forEach(function (dropdown) {
        var trigger = dropdown.querySelector('[data-mobile-dropdown-trigger]');
        var menu = dropdown.querySelector('[data-mobile-dropdown-menu]');
        var icon = dropdown.querySelector('[data-mobile-dropdown-icon]');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        if (menu) menu.classList.add('hidden');
        if (icon) icon.classList.remove('rotate-180');
      });
    }

    function isOpen() {
      return drawer.classList.contains('is-open');
    }

    function openDrawer() {
      resetMobileDropdowns();
      lastFocused = document.activeElement;
      drawer.classList.add('is-open');
      overlay.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
      openBtn.setAttribute('aria-expanded', 'true');
      drawer.removeAttribute('inert');
      if (closeBtn) closeBtn.focus();
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      overlay.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
      openBtn.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('inert', '');
      resetMobileDropdowns();
      if (lastFocused) lastFocused.focus();
    }

    openBtn.addEventListener('click', function () {
      isOpen() ? closeDrawer() : openDrawer();
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeDrawer);
    }

    overlay.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) closeDrawer();
    });

    var mql = window.matchMedia('(min-width: 1024px)');
    function handleViewportChange(e) {
      if (e.matches && isOpen()) closeDrawer();
    }
    if (mql.addEventListener) {
      mql.addEventListener('change', handleViewportChange);
    } else if (mql.addListener) {
      mql.addListener(handleViewportChange);
    }
  }

  /* ---------- Mobile Home dropdown ---------- */
  function initMobileDropdown() {
    var triggers = document.querySelectorAll('[data-mobile-dropdown-trigger]');
    triggers.forEach(function (trigger) {
      var dropdown = trigger.closest('[data-mobile-dropdown]');
      if (!dropdown) return;
      var menu = dropdown.querySelector('[data-mobile-dropdown-menu]');
      var icon = dropdown.querySelector('[data-mobile-dropdown-icon]');
      if (!menu) return;

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        if (isExpanded) {
          trigger.setAttribute('aria-expanded', 'false');
          menu.classList.add('hidden');
          if (icon) icon.classList.remove('rotate-180');
        } else {
          trigger.setAttribute('aria-expanded', 'true');
          menu.classList.remove('hidden');
          if (icon) icon.classList.add('rotate-180');
        }
      });
    });
  }

  /* ---------- Products: category filter with pagination ---------- */
  var PRODUCTS_PER_PAGE = 8;

  function initProductFilter() {
    var group = document.querySelector('[data-product-filters]');
    var grid = document.querySelector('[data-product-grid]');
    if (!group || !grid) return;

    var buttons = group.querySelectorAll('[data-filter]');
    var allItems = Array.prototype.slice.call(grid.querySelectorAll('[data-category]'));
    var status = document.querySelector('[data-filter-status]');
    var validFilters = [];
    buttons.forEach(function (btn) {
      validFilters.push(btn.getAttribute('data-filter'));
    });

    // Create pagination container
    var paginationNav = document.createElement('nav');
    paginationNav.setAttribute('aria-label', 'Product catalogue pagination');
    paginationNav.className = 'pagination';
    paginationNav.setAttribute('data-pagination', '');
    grid.parentNode.insertBefore(paginationNav, grid.nextSibling);

    var currentFilter = 'all';
    var currentPage = 1;

    function getFilteredItems(filter) {
      return allItems.filter(function (item) {
        return filter === 'all' || item.getAttribute('data-category') === filter;
      });
    }

    function getTotalPages(filteredCount) {
      return Math.max(1, Math.ceil(filteredCount / PRODUCTS_PER_PAGE));
    }

    function renderPagination(totalPages) {
      paginationNav.innerHTML = '';
      if (totalPages <= 1) return;

      // Previous button
      var prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'pagination-btn';
      prevBtn.textContent = 'Previous';
      prevBtn.disabled = currentPage === 1;
      prevBtn.setAttribute('aria-label', 'Previous page');
      prevBtn.addEventListener('click', function () {
        if (currentPage > 1) goToPage(currentPage - 1);
      });
      paginationNav.appendChild(prevBtn);

      // Page number buttons
      for (var i = 1; i <= totalPages; i++) {
        (function (pageNum) {
          var pageBtn = document.createElement('button');
          pageBtn.type = 'button';
          pageBtn.className = 'pagination-btn';
          pageBtn.textContent = pageNum;
          pageBtn.setAttribute('aria-label', 'Page ' + pageNum);
          if (pageNum === currentPage) {
            pageBtn.setAttribute('aria-current', 'page');
          }
          pageBtn.addEventListener('click', function () {
            goToPage(pageNum);
          });
          paginationNav.appendChild(pageBtn);
        })(i);
      }

      // Next button
      var nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'pagination-btn';
      nextBtn.textContent = 'Next';
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.setAttribute('aria-label', 'Next page');
      nextBtn.addEventListener('click', function () {
        if (currentPage < totalPages) goToPage(currentPage + 1);
      });
      paginationNav.appendChild(nextBtn);
    }

    function goToPage(page) {
      currentPage = page;
      applyFilter(currentFilter, false, true);
      var currentBtn = paginationNav.querySelector('[aria-current="page"]');
      if (currentBtn) {
        try {
          currentBtn.focus({ preventScroll: true });
        } catch (e) {
          currentBtn.focus();
        }
      }
    }

    function applyFilter(filter, updateUrl, paginationTriggered) {
      if (validFilters.indexOf(filter) === -1) filter = 'all';
      currentFilter = filter;

      var filtered = getFilteredItems(filter);
      var totalPages = getTotalPages(filtered.length);

      // Reset to page 1 when filter changes (not on pagination click)
      if (!paginationTriggered) {
        currentPage = 1;
      }

      // Clamp page
      if (currentPage > totalPages) currentPage = totalPages;

      var startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
      var endIdx = startIdx + PRODUCTS_PER_PAGE;

      // Hide all items first
      allItems.forEach(function (item) {
        item.hidden = true;
      });

      // Show items for the current page
      var visibleCount = 0;
      filtered.forEach(function (item, idx) {
        if (idx >= startIdx && idx < endIdx) {
          item.hidden = false;
          visibleCount++;
        }
      });

      // Update filter button states
      var activeLabel = '';
      buttons.forEach(function (btn) {
        var active = btn.getAttribute('data-filter') === filter;
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        if (active) {
          activeLabel = btn.textContent.trim();
          try {
            if (typeof btn.scrollIntoView === 'function' && window.innerWidth < 640) {
              btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
          } catch (e) {}
        }
      });

      // Update status text
      if (status) {
        var totalFiltered = filtered.length;
        var pageInfo = totalPages > 1
          ? ' (page ' + currentPage + ' of ' + totalPages + ')'
          : '';
        status.textContent =
          filter === 'all'
            ? 'Showing all ' + totalFiltered + ' products' + pageInfo
            : 'Showing ' + totalFiltered + (totalFiltered === 1 ? ' product' : ' products') + ' in ' + activeLabel + pageInfo;
      }

      // Render pagination
      renderPagination(totalPages);

      // Update URL
      if (updateUrl && window.history && window.history.replaceState) {
        try {
          var url = new URL(window.location.href);
          if (filter === 'all') url.searchParams.delete('category');
          else url.searchParams.set('category', filter);
          window.history.replaceState(null, '', url.pathname + url.search + url.hash);
        } catch (e) {
          /* URL API unavailable */
        }
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyFilter(btn.getAttribute('data-filter'), true);
      });
    });

    // In-page links (e.g. the habitat section) apply a filter without reloading,
    // then move to the catalogue with focus on the now-active filter button
    document.querySelectorAll('[data-filter-link]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var filter = link.getAttribute('data-filter-link');
        if (validFilters.indexOf(filter) === -1) return;
        e.preventDefault();
        applyFilter(filter, true);
        var activeBtn = group.querySelector('[data-filter="' + filter + '"]');
        var catalogue = document.getElementById('catalogue') || grid;
        catalogue.scrollIntoView({ block: 'start' });
        if (activeBtn) activeBtn.focus({ preventScroll: true });
      });
    });

    var initial = 'all';
    try {
      initial = new URLSearchParams(window.location.search).get('category') || 'all';
    } catch (e) {
      /* URLSearchParams unavailable */
    }
    applyFilter(initial, false);
  }

  /* ---------- Scroll-to-top button ---------- */
  function initScrollToTop() {
    // Create button element
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'scroll-to-top';
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>';
    document.body.appendChild(btn);

    var THRESHOLD = 400;
    var visible = false;

    function update() {
      var scrolled = window.pageYOffset || document.documentElement.scrollTop;
      if (scrolled > THRESHOLD && !visible) {
        btn.classList.add('is-visible');
        visible = true;
      } else if (scrolled <= THRESHOLD && visible) {
        btn.classList.remove('is-visible');
        visible = false;
      }
    }

    window.addEventListener('scroll', update, { passive: true });
    update();

    btn.addEventListener('click', function () {
      var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: 0,
        behavior: prefersReduced ? 'auto' : 'smooth'
      });
    });
  }

  /* ---------- Care Guides: open a guide when linked to ---------- */
  function initGuideLinks() {
    if (!document.querySelector('[data-guide]')) return;

    function openGuide(id) {
      var target = id ? document.getElementById(id) : null;
      if (!target || !target.hasAttribute('data-guide')) return;
      var details = target.querySelector('details');
      if (details) details.open = true;
    }

    function hashId() {
      try {
        return decodeURIComponent(window.location.hash.slice(1));
      } catch (e) {
        return '';
      }
    }

    // Same-hash clicks don't fire hashchange, so handle link clicks directly too
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (link) openGuide(link.getAttribute('href').slice(1));
    });

    window.addEventListener('hashchange', function () {
      openGuide(hashId());
    });

    openGuide(hashId());
  }

  /* ---------- Contact: enquiry form (frontend preview only) ---------- */
  // Uses the native constraint-validation API for checks, with inline messages.
  // Nothing is sent or stored: submission is always prevented, and the fields
  // have no name attributes, so they could not be serialised into a request.
  function initEnquiryForm() {
    var form = document.querySelector('[data-enquiry-form]');
    if (!form) return;

    var fields = form.querySelectorAll('[data-validate]');
    var status = form.querySelector('[data-form-status]');
    var clearBtn = form.querySelector('[data-form-clear]');
    var previewTpl = document.querySelector('template[data-status-preview]');
    var errorTpl = document.querySelector('template[data-status-error]');
    var attempted = false;

    form.noValidate = true;

    function errorFor(field) {
      if (field.required && field.value.trim() === '') return field.getAttribute('data-msg-required');
      if (field.validity.valid) return '';
      if (field.validity.typeMismatch) return field.getAttribute('data-msg-format') || field.validationMessage;
      return field.validationMessage;
    }

    function updateField(field) {
      var msg = errorFor(field);
      var errorEl = document.getElementById(field.id + '-error');
      if (msg) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
      if (errorEl) {
        errorEl.querySelector('span').textContent = msg;
        errorEl.hidden = !msg;
      }
      return !msg;
    }

    function setStatus(tpl, text) {
      status.textContent = '';
      if (!tpl) return;
      var node = tpl.content.firstElementChild.cloneNode(true);
      if (text) node.textContent = text;
      status.appendChild(node);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      attempted = true;

      var invalid = [];
      fields.forEach(function (field) {
        if (!updateField(field)) invalid.push(field);
      });

      if (invalid.length) {
        setStatus(
          errorTpl,
          invalid.length === 1
            ? 'Please correct 1 field highlighted above.'
            : 'Please correct ' + invalid.length + ' fields highlighted above.'
        );
        if (clearBtn) clearBtn.hidden = true;
        invalid[0].focus();
        return;
      }

      setStatus(previewTpl);
      if (clearBtn) clearBtn.hidden = false;
    });

    // After a submit attempt, re-check fields as the visitor corrects them
    fields.forEach(function (field) {
      var evt = field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener(evt, function () {
        if (!attempted) return;
        updateField(field);
      });
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        form.reset();
        attempted = false;
        fields.forEach(function (field) {
          field.removeAttribute('aria-invalid');
          var errorEl = document.getElementById(field.id + '-error');
          if (errorEl) {
            errorEl.querySelector('span').textContent = '';
            errorEl.hidden = true;
          }
        });
        setStatus(null);
        clearBtn.hidden = true;
        if (fields[0]) fields[0].focus();
      });
    }
  }

  /* ---------- Contact: map fallback ---------- */
  function initMapFallback() {
    var wrap = document.querySelector('[data-map]');
    var frame = wrap ? wrap.querySelector('iframe') : null;
    var fallback = wrap ? wrap.querySelector('[data-map-fallback]') : null;
    if (!frame || !fallback) return;

    var loaded = false;
    function showFallback() {
      if (loaded) return;
      frame.hidden = true;
      fallback.hidden = false;
    }

    frame.addEventListener('load', function () {
      loaded = true;
    });

    if (navigator.onLine === false) {
      showFallback();
      return;
    }

    // The iframe is lazy-loaded, so only start the timeout once it is near the viewport
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        setTimeout(showFallback, 15000);
      });
      observer.observe(wrap);
    }
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    document.querySelectorAll('[data-current-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initDirection();
    initHomeDropdown();
    initMobileNav();
    initMobileDropdown();
    initProductFilter();
    initGuideLinks();
    initEnquiryForm();
    initMapFallback();
    initYear();
    initScrollToTop();
  });
})();


