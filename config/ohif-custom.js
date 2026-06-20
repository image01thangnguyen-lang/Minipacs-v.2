(function customizeOhifViewerHeader() {
  var BODY_CLASS = 'mpacs-clean-viewer';
  var HIDDEN_ATTR = 'data-mpacs-hidden';
  var OPTIONS_ATTR = 'data-mpacs-options-button';


var TOP_BAR_LIMIT = 64;
  var OPTIONS_LABELS = ['L\u1ef1a ch\u1ecdn', 'Options'];
  var HIDDEN_LABELS = [
    { text: 'Open Health Imaging Foundation', exact: false },
    { text: 'Study List', exact: true },
    { text: 'Ch\u1ec9 d\u00f9ng cho nghi\u00ean c\u1ee9u', exact: false },
    { text: 'For research use only', exact: false },
  ];
  var scheduled = false;

  function normalizeText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  function isViewerRoute() {
    return window.location.pathname === '/viewer' || window.location.pathname.indexOf('/viewer/') === 0;
  }

  function isVisibleTopElement(element, maxTop) {
    if (!element || !element.getBoundingClientRect) {
      return false;
    }

    var rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.top < maxTop;
  }

  function matchesLabel(text, label) {
    if (label.exact) {
      return text === label.text;
    }

    return text.indexOf(label.text) !== -1;
  }

  function closestInteractive(element) {
    if (!element || !element.closest) {
      return element;
    }

    return (
      element.closest('button, a, [role="button"], [aria-haspopup="true"]') ||
      element
    );
  }

  function markHidden(element) {
    if (!element || element.getAttribute(HIDDEN_ATTR) === 'true') {
      return;
    }

    element.setAttribute(HIDDEN_ATTR, 'true');
    element.setAttribute('aria-hidden', 'true');
  }

  function childMatchesLabel(element, label) {
    return Array.prototype.some.call(element.children || [], function(child) {
      return matchesLabel(normalizeText(child.textContent), label);
    });
  }

  function hideTextLabels() {
    var elements = Array.prototype.slice.call(
      document.querySelectorAll('a, button, span, p, div, [role="button"]')
    );

    HIDDEN_LABELS.forEach(function(label) {
      elements.forEach(function(element) {
        var text = normalizeText(element.textContent);

        if (!text || !matchesLabel(text, label) || childMatchesLabel(element, label)) {
          return;
        }

        if (!isVisibleTopElement(element, TOP_BAR_LIMIT)) {
          return;
        }

        markHidden(closestInteractive(element));
      });
    });
  }

  function hideLogoAndSeparators() {
    Array.prototype.forEach.call(
      document.querySelectorAll('button, a, svg, img, [class*="logo"], [class*="Logo"]'),
      function(element) {
        var rect = element.getBoundingClientRect();

        if (rect.top >= 0 && rect.top < TOP_BAR_LIMIT && rect.left >= 0 && rect.left < 80) {
          markHidden(closestInteractive(element));
        }
      }
    );

    Array.prototype.forEach.call(document.querySelectorAll('div, span'), function(element) {
      var rect = element.getBoundingClientRect();

      if (
        rect.top >= 0 &&
        rect.top < TOP_BAR_LIMIT &&
        rect.left > 250 &&
        rect.left < 500 &&
        rect.width > 0 &&
        rect.width <= 2 &&
        rect.height >= 20 &&
        rect.height <= 48
      ) {
        markHidden(element);
      }
    });
  }

  function handleLanguageButtonAndHideHeader() {
    var optionsButtonEl = null;
    var elements = Array.prototype.slice.call(
      document.querySelectorAll('button, a, span, div, [role="button"], [aria-haspopup="true"]')
    );

    for (var i = 0; i < elements.length; i++) {
      var text = normalizeText(elements[i].textContent);
      var hasOptions = OPTIONS_LABELS.some(function(l) { return text.indexOf(l) !== -1; });
      if (hasOptions && (elements[i].tagName === 'BUTTON' || elements[i].getAttribute('role') === 'button' || closestInteractive(elements[i]))) {
        optionsButtonEl = closestInteractive(elements[i]);
        optionsButtonEl.style.display = 'none'; // Xóa/ẩn hoàn toàn nút Lựa chọn theo kế hoạch mới
        break;
      }
    }

    var measureButtonEl = null;
    for (var j = 0; j < elements.length; j++) {
      var mText = normalizeText(elements[j].textContent).toLowerCase();
      if ((mText.indexOf('measurements') !== -1 || mText.indexOf('tracked') !== -1) && 
          (elements[j].tagName === 'BUTTON' || elements[j].getAttribute('role') === 'button' || closestInteractive(elements[j]))) {
        measureButtonEl = closestInteractive(elements[j]);
        break;
      }
    }

    var header = document.querySelector('header');
    if (!header && measureButtonEl) {
      var allDivs = document.querySelectorAll('div');
      for (var k = 0; k < allDivs.length; k++) {
        var rect = allDivs[k].getBoundingClientRect();
        if (rect.top === 0 && rect.height > 0 && rect.height <= 80 && allDivs[k].offsetWidth === window.innerWidth) {
           if (!allDivs[k].contains(measureButtonEl)) {
             header = allDivs[k];
             break;
           }
        }
      }
    }

    if (header) {
      header.style.display = 'none';
      header.style.height = '0px';
      header.style.minHeight = '0px';
      header.style.padding = '0px';
      header.style.margin = '0px';
      header.style.border = 'none';
      header.style.overflow = 'hidden';
    }

    if (!measureButtonEl || !measureButtonEl.parentNode) return;

    var langBtnId = 'mpacs-custom-lang-btn';
    var existingLangBtn = document.getElementById(langBtnId);
    if (existingLangBtn && measureButtonEl.parentNode.contains(existingLangBtn)) {
       return; // Nút ngôn ngữ đã tồn tại
    }
    if (existingLangBtn) {
       existingLangBtn.parentNode.removeChild(existingLangBtn); 
    }

    var langBtn = document.createElement('div');
    langBtn.id = langBtnId;
    langBtn.className = measureButtonEl.className; // Kế thừa style từ toolbar
    langBtn.style.position = 'relative';
    langBtn.style.cursor = 'pointer';
    langBtn.style.marginLeft = '8px';
    langBtn.style.marginRight = '8px';
    langBtn.style.display = 'flex';
    langBtn.style.alignItems = 'center';
    langBtn.style.justifyContent = 'center';
    langBtn.style.minWidth = '80px';
    langBtn.style.height = '100%';

    var currentLang = window.localStorage.getItem('i18nextLng') || 'en-US';
    var isVietnamese = currentLang.indexOf('vi') !== -1;

    // Icon (Optional, text is fallback)
    langBtn.innerHTML = '<span style="font-size: 13px; font-weight: 500; color: white;">' + (isVietnamese ? 'Ngôn ngữ' : 'Language') + '</span>';

    var menuHtml = '<div id="mpacs-lang-menu" style="display:none; position:absolute; top:100%; right:0; background:#090C14; border:1px solid #3A3F99; border-radius:4px; z-index:99999; min-width:140px; box-shadow:0 4px 6px rgba(0,0,0,0.5); overflow:hidden; margin-top:8px;">' + 
      '<div class="mpacs-lang-opt" data-lang="vi" style="padding:10px 15px; color:#fff; cursor:pointer; font-size:13px; background:' + (isVietnamese ? '#3A3F99' : 'transparent') + ';">Tiếng Việt</div>' + 
      '<div class="mpacs-lang-opt" data-lang="en-US" style="padding:10px 15px; color:#fff; cursor:pointer; font-size:13px; background:' + (!isVietnamese ? '#3A3F99' : 'transparent') + ';">English</div>' + 
    '</div>';

    langBtn.insertAdjacentHTML('beforeend', menuHtml);

    measureButtonEl.parentNode.insertBefore(langBtn, measureButtonEl);

    var menuEl = langBtn.querySelector('#mpacs-lang-menu');
    
    langBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      menuEl.style.display = menuEl.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', function() {
      if (menuEl) menuEl.style.display = 'none';
    });

    var opts = langBtn.querySelectorAll('.mpacs-lang-opt');
    for(var optIdx = 0; optIdx < opts.length; optIdx++) {
       opts[optIdx].addEventListener('click', function(e) {
          e.stopPropagation();
          var lang = this.getAttribute('data-lang');
          
          window.localStorage.setItem('i18nextLng', lang);
          // Fallback OHIF v2 style key
          window.localStorage.setItem('lang', lang);

          window.location.reload();
       });
       
       opts[optIdx].addEventListener('mouseenter', function() {
           if (this.style.background === 'transparent' || this.style.background === 'rgba(0, 0, 0, 0)') {
               this.style.background = '#1a1f4c'; // Highlight hover
           }
       });
       opts[optIdx].addEventListener('mouseleave', function() {
           var itemLang = this.getAttribute('data-lang');
           var itemIsVi = itemLang === 'vi';
           var currentlyVi = (window.localStorage.getItem('i18nextLng') || '').indexOf('vi') !== -1;
           if ((itemIsVi && currentlyVi) || (!itemIsVi && !currentlyVi)) {
               this.style.background = '#3A3F99';
           } else {
               this.style.background = 'transparent';
           }
       });
    }
  }

  function applyCustomization() {
    scheduled = false;

    if (!document.body) {
      return;
    }

    var viewerRoute = isViewerRoute();
    document.body.classList.toggle(BODY_CLASS, viewerRoute);

    if (!viewerRoute) {
      return;
    }

    hideTextLabels();
    hideLogoAndSeparators();
    handleLanguageButtonAndHideHeader();
  }

  function scheduleCustomization() {
    if (scheduled) {
      return;
    }

    scheduled = true;
    window.requestAnimationFrame(applyCustomization);
  }

  function patchHistoryMethod(methodName) {
    var original = window.history[methodName];

    window.history[methodName] = function patchedHistoryMethod() {
      var result = original.apply(this, arguments);
      scheduleCustomization();
      return result;
    };
  }

  patchHistoryMethod('pushState');
  patchHistoryMethod('replaceState');
  window.addEventListener('popstate', scheduleCustomization);
  window.addEventListener('resize', scheduleCustomization);

  new MutationObserver(scheduleCustomization).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  scheduleCustomization();
})();
