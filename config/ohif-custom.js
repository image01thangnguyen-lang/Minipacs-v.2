/* Lightweight OHIF Runtime Injections */

(function() {
  var originalTitle = 'MiniPACS Viewer';
  document.title = originalTitle;

  // Task 2: Dynamic Document Title based on Patient Name & Modality
  // Since we don't have direct access to React hooks here, we use a MutationObserver 
  // to detect when OHIF renders the Viewport Overlay which contains Patient Name.
  
  function updateDocumentTitle() {
    // In standard OHIF v3, the patient name is usually rendered in the viewport overlay
    // For example, in the top left corner.
    var overlayElements = document.querySelectorAll('.viewport-overlay-info, [data-cy="viewport-overlay-top-left"]');
    if (!overlayElements || overlayElements.length === 0) {
      // Fallback
      if (document.title !== originalTitle) {
        document.title = originalTitle;
      }
      return;
    }

    var patientName = '';
    var modality = '';

    // OHIF usually renders Patient Name and Modality in these overlays.
    // We can extract text from the overlay container.
    // Example format in OHIF top-left overlay: "John Doe\nMR"
    var textContent = overlayElements[0].innerText || '';
    var lines = textContent.split('\n').map(function(s) { return s.trim(); }).filter(Boolean);

    if (lines.length >= 1) {
      patientName = lines[0]; // First line is typically Patient Name
    }
    
    // We can try to find Modality if it's there
    var rightOverlay = document.querySelector('[data-cy="viewport-overlay-top-right"]');
    if (rightOverlay) {
       var rightText = rightOverlay.innerText || '';
       var rightLines = rightText.split('\n').map(function(s) { return s.trim(); }).filter(Boolean);
       // Modality might be in the right overlay or left overlay depending on config
       // Usually Modality is in the top right.
       if (rightLines.length >= 1) {
         modality = rightLines[0];
       }
    }

    var newTitle = originalTitle;
    if (patientName) {
      newTitle = patientName + (modality ? ' - ' + modality : '') + ' | MiniPACS';
    }

    if (document.title !== newTitle) {
      document.title = newTitle;
    }
  }

  // Observe the DOM for the viewport overlay mounting
  var observer = new MutationObserver(function(mutations) {
    // Debounce the update slightly
    if (window._titleUpdateTimeout) {
      clearTimeout(window._titleUpdateTimeout);
    }
    window._titleUpdateTimeout = setTimeout(updateDocumentTitle, 500);
  });

  // Start observing once the body is ready
  function startObserver() {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      setTimeout(startObserver, 100);
    }
  }

  startObserver();
})();
