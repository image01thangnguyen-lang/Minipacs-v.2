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

  function markOptionsButton() {
    var elements = Array.prototype.slice.call(
      document.querySelectorAll('button, a, span, div, [role="button"], [aria-haspopup="true"]')
    );

    for (var index = 0; index < elements.length; index += 1) {
      var element = elements[index];
      var text = normalizeText(element.textContent);
      var hasOptionsLabel = OPTIONS_LABELS.some(function(label) {
        return text.indexOf(label) !== -1;
      });

      if (!hasOptionsLabel || !isVisibleTopElement(element, 100)) {
        continue;
      }

      var button = closestInteractive(element);
      button.setAttribute(OPTIONS_ATTR, 'true');
      button.removeAttribute(HIDDEN_ATTR);
      button.removeAttribute('aria-hidden');
      return;
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

    markOptionsButton();
    hideTextLabels();
    hideLogoAndSeparators();
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
