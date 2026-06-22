(function customizeOhifViewer() {
  var BODY_CLASS = 'mpacs-clean-viewer';
  var WORKSTATION_CLASS = 'mpacs-workstation-viewer';
  var HIDDEN_ATTR = 'data-mpacs-hidden';
  var NATIVE_CHROME_ATTR = 'data-mpacs-native-chrome';
  var SHELL_ID = 'mpacs-workstation-shell';
  var SERIES_LIST_ID = 'mpacs-series-list';
  var OVERLAY_ID = 'mpacs-viewport-overlay';
  var ACTIVE_TOOL_ATTR = 'data-mpacs-active-tool';
  var LAYOUT_ATTR = 'data-mpacs-layout';
  var SYNC_ATTR = 'data-mpacs-sync';
  var CINE_ATTR = 'data-mpacs-cine';
  var TOP_BAR_LIMIT = 72;
  var scheduled = false;
  var activeToolKey = 'window';
  var currentLayout = '1x1';
  var lastOverlaySignature = '';
  var hotkeysBound = false;
  var lastCommandMessage = 'Ready';

  var syncState = {
    scroll: false,
    wwl: false,
    zoom: false,
  };

  var cineState = {
    playing: false,
    fps: 24,
  };

  var seriesState = {
    studyUid: '',
    loading: false,
    loaded: false,
    error: '',
    series: [],
    activeSeriesUid: '',
  };

  var HIDDEN_LABELS = [
    { text: 'Open Health Imaging Foundation', exact: false },
    { text: 'Study List', exact: true },
    { text: 'Chi dung cho nghien cuu', exact: false },
    { text: 'For research use only', exact: false },
  ];

  var LEGACY_TOOLBAR_LABELS = [
    'Tap anh',
    'Duyet',
    'Thu phong',
    'Do sang',
    'Di chuyen',
    'Thuoc do chieu dai',
    'Annotate',
    'Goc',
    'Dat lai',
    'Duyet tu dong',
    'Them',
    'Cach bo tri',
    'Measurements',
    'Window Level',
    'Zoom',
    'Pan',
    'Length',
    'Layout',
  ];

  var LEGACY_PANEL_LABELS = [
    'Measurements',
    'Measurement Tools',
    'Advanced Tools',
    'Image Tools',
    'Sync Tools',
    'Display Sets',
    'Series',
    'Study Browser',
  ];

  var TOP_TOOLS = [
    { key: 'select', label: 'Select', icon: '↖', commandLabels: ['Select', 'Pointer'] },
    { key: 'window', label: 'Window/Level', icon: '☼', commandLabels: ['Window Level', 'Window/Level', 'Window'] },
    { key: 'zoom', label: 'Zoom', icon: '⌕', commandLabels: ['Zoom'] },
    { key: 'pan', label: 'Pan', icon: '✥', commandLabels: ['Pan'] },
    { key: 'stack', label: 'Stack scroll', icon: '▱', commandLabels: ['Stack Scroll', 'Stack'] },
    { key: 'layout', label: 'Layout', icon: '▦', commandLabels: ['Layout'] },
    { key: 'length', label: 'Length', icon: '━', commandLabels: ['Length', 'Ruler'] },
    { key: 'angle', label: 'Angle', icon: '∠', commandLabels: ['Angle'] },
    { key: 'cine', label: 'Cine', icon: '▶', commandLabels: ['Cine', 'Play'], action: toggleCine },
    { key: 'arrow', label: 'Arrow annotate', icon: '↗', commandLabels: ['Arrow Annotate', 'Arrow', 'Annotate'] },
    { key: 'reset', label: 'Reset view', icon: '↶', commandLabels: ['Reset', 'Reset View'] },
  ];

  var RIGHT_ACTIONS = [
    { key: 'capture', label: 'Capture', icon: '▣', commandLabels: ['Capture', 'Screenshot'] },
    { key: 'print', label: 'Print', icon: '▤', action: printViewer },
    { key: 'report', label: 'Report', icon: '☰', action: openReport },
    { key: 'close', label: 'Close', icon: '×', action: closeViewer },
  ];

  var PANEL_GROUPS = [
    {
      title: 'History',
      tools: [
        { key: 'history-current', label: 'Current', icon: '●' },
        { key: 'history-prior', label: 'Prior', icon: '◐' },
        { key: 'history-report', label: 'Report', icon: '☰', action: openReport },
      ],
      note: 'RIS history API se noi o giai doan sau.',
    },
    {
      title: 'Layout',
      tools: [
        { key: 'layout-1x1', label: '1x1', icon: '1x1', layout: '1x1', action: applyLayout },
        { key: 'layout-1x2', label: '1x2', icon: '1x2', layout: '1x2', action: applyLayout },
        { key: 'layout-2x1', label: '2x1', icon: '2x1', layout: '2x1', action: applyLayout },
        { key: 'layout-2x2', label: '2x2', icon: '2x2', layout: '2x2', action: applyLayout },
      ],
    },
    {
      title: 'Measurement Tools',
      tools: [
        { key: 'measure-length', label: 'Length', icon: '━', commandLabels: ['Length'] },
        { key: 'measure-angle', label: 'Angle', icon: '∠', commandLabels: ['Angle'] },
        { key: 'measure-bidir', label: 'Bidirectional', icon: '↔', commandLabels: ['Bidirectional'] },
        { key: 'measure-rect', label: 'Rectangle', icon: '□', commandLabels: ['Rectangle'] },
        { key: 'measure-ellipse', label: 'Ellipse', icon: '○', commandLabels: ['Ellipse'] },
        { key: 'measure-probe', label: 'Probe', icon: '•', commandLabels: ['Probe'] },
      ],
    },
    {
      title: 'Advanced Tools',
      tools: [
        { key: 'advanced-crosshair', label: 'Crosshair', icon: '⌖', commandLabels: ['Crosshair'] },
        { key: 'advanced-mpr', label: 'MPR', icon: 'MPR', commandLabels: ['MPR'] },
        { key: 'advanced-3d', label: '3D', icon: '3D', commandLabels: ['3D'] },
        { key: 'advanced-seg', label: 'Segmentation', icon: '▧', commandLabels: ['Segmentation'] },
        { key: 'advanced-roi', label: 'ROI', icon: '◌', commandLabels: ['ROI'] },
        { key: 'advanced-capture', label: 'Capture', icon: '▣', commandLabels: ['Capture', 'Screenshot'] },
      ],
    },
    {
      title: 'Image Tools',
      tools: [
        { key: 'image-reset', label: 'Reset', icon: '↶', commandLabels: ['Reset', 'Reset View'] },
        { key: 'image-invert', label: 'Invert', icon: '◐', commandLabels: ['Invert'] },
        { key: 'image-rotate', label: 'Rotate', icon: '↻', commandLabels: ['Rotate'] },
        { key: 'image-flip', label: 'Flip', icon: '⇄', commandLabels: ['Flip'] },
        { key: 'image-fit', label: 'Fit', icon: '⛶', commandLabels: ['Fit', 'Zoom to fit'] },
        { key: 'image-zoom', label: 'Zoom', icon: '⌕', commandLabels: ['Zoom'] },
      ],
    },
    {
      title: 'Sync Tools',
      tools: [
        { key: 'sync-scroll', label: 'Scroll', icon: '⇅', syncMode: 'scroll', commandLabels: ['Sync Scroll', 'Scroll'], action: toggleSync },
        { key: 'sync-wwl', label: 'W/L', icon: 'W/L', syncMode: 'wwl', commandLabels: ['Sync Window', 'Window Level'], action: toggleSync },
        { key: 'sync-zoom', label: 'Zoom/Pan', icon: '⌕', syncMode: 'zoom', commandLabels: ['Sync Zoom', 'Zoom'], action: toggleSync },
        { key: 'sync-unlink', label: 'Unlink', icon: '⊘', commandLabels: ['Unlink', 'Disable Sync'], action: clearSync },
      ],
    },
  ];

  var OVERLAY_TOOLS = [
    { key: 'overlay-fit', label: 'Fit', icon: '⛶', commandLabels: ['Fit', 'Zoom to fit'] },
    { key: 'overlay-fullscreen', label: 'Fullscreen', icon: '□', commandLabels: ['Fullscreen', 'Full Screen'] },
    { key: 'overlay-window', label: 'Window/Level', icon: 'W/L', commandLabels: ['Window Level', 'Window/Level'] },
    { key: 'overlay-link', label: 'Link', icon: '∞', commandLabels: ['Link', 'Sync'], action: toggleAllSync },
    { key: 'overlay-capture', label: 'Capture', icon: '▣', commandLabels: ['Capture', 'Screenshot'] },
  ];

  var CINE_TOOLS = [
    { key: 'cine-prev', label: 'Previous frame', icon: '◀', commandLabels: ['Previous Frame', 'Previous Image', 'Previous'], action: stepCine, direction: -1, noActive: true },
    { key: 'cine-toggle', label: 'Play/Pause', icon: '▶', commandLabels: ['Cine', 'Play', 'Pause'], action: toggleCine, noActive: true },
    { key: 'cine-next', label: 'Next frame', icon: '▶', commandLabels: ['Next Frame', 'Next Image', 'Next'], action: stepCine, direction: 1, noActive: true },
  ];

  function normalizeText(value) {
    var text = String(value || '')
      .replace(/\s+/g, ' ')
      .replace(/[^\S\r\n]+/g, ' ')
      .trim();

    if (text.normalize) {
      text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    return text;
  }

  function normalizeSearch(value) {
    return normalizeText(value).toLowerCase();
  }

  function isViewerRoute() {
    return window.location.pathname === '/viewer' || window.location.pathname.indexOf('/viewer/') === 0;
  }

  function getPathStudyInstanceUid() {
    var match = window.location.pathname.match(/\/viewer\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function getQueryStudyInstanceUid() {
    try {
      var params = new URLSearchParams(window.location.search);
      var value = params.get('StudyInstanceUIDs') || params.get('StudyInstanceUID') || params.get('studyInstanceUid') || '';
      return value ? decodeURIComponent(String(value).split(',')[0]) : '';
    } catch (error) {
      return '';
    }
  }

  function getStudyInstanceUid() {
    return getQueryStudyInstanceUid() || getPathStudyInstanceUid();
  }

  function normalizeViewerRoute() {
    var pathStudyUid = getPathStudyInstanceUid();

    if (!pathStudyUid || getQueryStudyInstanceUid()) {
      return true;
    }

    try {
      var params = new URLSearchParams(window.location.search);
      params.set('StudyInstanceUIDs', pathStudyUid);
      window.location.replace('/viewer?' + params.toString() + window.location.hash);
      return false;
    } catch (error) {
      window.location.replace('/viewer?StudyInstanceUIDs=' + encodeURIComponent(pathStudyUid) + window.location.hash);
      return false;
    }
  }

  function getShell() {
    return document.getElementById(SHELL_ID);
  }

  function isInsideShell(element) {
    var shell = getShell();
    return Boolean(shell && element && shell.contains(element));
  }

  function isInsideNativeChrome(element) {
    return Boolean(element && element.closest && element.closest('[' + NATIVE_CHROME_ATTR + '="true"]'));
  }

  function isVisibleTopElement(element, maxTop) {
    if (!element || !element.getBoundingClientRect || isInsideShell(element)) {
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
    if (!element || isInsideShell(element) || element.getAttribute(HIDDEN_ATTR) === 'true') {
      return;
    }

    element.setAttribute(HIDDEN_ATTR, 'true');
    element.setAttribute('aria-hidden', 'true');
  }

  function clearHiddenMarks() {
    Array.prototype.forEach.call(
      document.querySelectorAll('[' + HIDDEN_ATTR + '="true"]'),
      function(element) {
        element.removeAttribute(HIDDEN_ATTR);
        element.removeAttribute('aria-hidden');
      }
    );

    Array.prototype.forEach.call(
      document.querySelectorAll('[' + NATIVE_CHROME_ATTR + ']'),
      function(element) {
        element.removeAttribute(NATIVE_CHROME_ATTR);
      }
    );
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
        if (isInsideShell(element) || !element.getBoundingClientRect) {
          return;
        }

        var rect = element.getBoundingClientRect();

        if (rect.top >= 0 && rect.top < TOP_BAR_LIMIT && rect.left >= 0 && rect.left < 92) {
          markHidden(closestInteractive(element));
        }
      }
    );

    Array.prototype.forEach.call(document.querySelectorAll('div, span'), function(element) {
      if (isInsideShell(element) || !element.getBoundingClientRect) {
        return;
      }

      var rect = element.getBoundingClientRect();

      if (
        rect.top >= 0 &&
        rect.top < TOP_BAR_LIMIT &&
        rect.left > 250 &&
        rect.left < 520 &&
        rect.width > 0 &&
        rect.width <= 2 &&
        rect.height >= 20 &&
        rect.height <= 52
      ) {
        markHidden(element);
      }
    });
  }

  function textMatchesAny(text, labels) {
    var normalizedText = normalizeSearch(text);

    if (!normalizedText) {
      return false;
    }

    for (var i = 0; i < labels.length; i += 1) {
      if (normalizedText.indexOf(normalizeSearch(labels[i])) !== -1) {
        return true;
      }
    }

    return false;
  }

  function markNativeChrome(element, kind) {
    if (!element || isInsideShell(element) || element.hasAttribute(NATIVE_CHROME_ATTR)) {
      return;
    }

    if (element.querySelector && element.querySelector('canvas, [data-cy*="viewport"], [class*="ViewportGrid"], [class*="viewport-grid"]')) {
      return;
    }

    element.setAttribute(NATIVE_CHROME_ATTR, kind || 'toolbar');
    element.setAttribute('aria-hidden', 'true');
  }

  function findToolbarContainer(element) {
    var current = element;
    var best = null;

    while (current && current !== document.body && current.getBoundingClientRect) {
      var rect = current.getBoundingClientRect();

      if (
        rect.top >= TOP_BAR_LIMIT - 10 &&
        rect.top < 190 &&
        rect.width > 520 &&
        rect.height >= 42 &&
        rect.height <= 120
      ) {
        best = current;
      }

      current = current.parentElement;
    }

    return best;
  }

  function hideLegacyOhifChrome() {
    var elements = Array.prototype.slice.call(
      document.querySelectorAll('button, a, span, div, [role="button"], [tabindex]')
    );

    elements.forEach(function(element) {
      if (isInsideShell(element) || !element.getBoundingClientRect) {
        return;
      }

      var text = normalizeText(element.textContent);

      if (textMatchesAny(text, LEGACY_TOOLBAR_LABELS)) {
        markNativeChrome(findToolbarContainer(element) || closestInteractive(element), 'toolbar');
      }
    });
  }

  function createButton(config, extraClassName) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'mpacs-ws-button' + (extraClassName ? ' ' + extraClassName : '');
    button.title = config.label;
    button.setAttribute('aria-label', config.label);
    button.setAttribute('data-mpacs-tool-key', config.key);

    if (config.commandLabels) {
      button.setAttribute('data-mpacs-command-labels', config.commandLabels.join('|'));
    }

    if (config.syncMode) {
      button.setAttribute('data-mpacs-sync-key', config.syncMode);
    }

    if (config.noActive) {
      button.setAttribute('data-mpacs-no-active', 'true');
    }

    var icon = document.createElement('span');
    icon.className = 'mpacs-ws-button-icon';
    icon.textContent = config.icon || config.label.slice(0, 3).toUpperCase();
    icon.setAttribute('aria-hidden', 'true');
    button.appendChild(icon);

    if (extraClassName && extraClassName.indexOf('mpacs-ws-button-icon-only') === -1) {
      var label = document.createElement('span');
      label.className = 'mpacs-ws-button-label';
      label.textContent = config.label;
      button.appendChild(label);
    }

    button.addEventListener('click', function(event) {
      event.preventDefault();
      runShellAction(config);
    });

    return button;
  }

  function createTopBar() {
    var topBar = document.createElement('div');
    topBar.className = 'mpacs-ws-topbar';

    var brand = document.createElement('div');
    brand.className = 'mpacs-ws-brand';

    var brandTitle = document.createElement('div');
    brandTitle.className = 'mpacs-ws-brand-title';
    brandTitle.textContent = 'MINIPACS VIEWER';

    var brandSubtitle = document.createElement('div');
    brandSubtitle.className = 'mpacs-ws-brand-subtitle';
    brandSubtitle.textContent = 'Diagnostic workstation';

    brand.appendChild(brandTitle);
    brand.appendChild(brandSubtitle);
    topBar.appendChild(brand);

    var toolbar = document.createElement('div');
    toolbar.className = 'mpacs-ws-toolbar';
    TOP_TOOLS.forEach(function(tool) {
      toolbar.appendChild(createButton(tool, 'mpacs-ws-top-button'));
    });
    topBar.appendChild(toolbar);

    var layoutState = document.createElement('div');
    layoutState.className = 'mpacs-ws-layout-state';
    layoutState.setAttribute('data-mpacs-layout-state', 'true');
    layoutState.textContent = currentLayout;
    topBar.appendChild(layoutState);

    var syncStateNode = document.createElement('div');
    syncStateNode.className = 'mpacs-ws-sync-state';
    syncStateNode.setAttribute('data-mpacs-sync-state', 'true');
    syncStateNode.textContent = 'Sync: Off';
    topBar.appendChild(syncStateNode);

    var spacer = document.createElement('div');
    spacer.className = 'mpacs-ws-spacer';
    topBar.appendChild(spacer);

    var actions = document.createElement('div');
    actions.className = 'mpacs-ws-actions';
    RIGHT_ACTIONS.forEach(function(action) {
      actions.appendChild(createButton(action, 'mpacs-ws-action-button'));
    });
    topBar.appendChild(actions);

    return topBar;
  }

  function createPanelGroup(group, index) {
    var section = document.createElement('section');
    section.className = 'mpacs-ws-group';

    var header = document.createElement('button');
    header.type = 'button';
    header.className = 'mpacs-ws-group-header';
    header.setAttribute('aria-expanded', 'true');

    var title = document.createElement('span');
    title.textContent = group.title;
    header.appendChild(title);

    var chevron = document.createElement('span');
    chevron.className = 'mpacs-ws-group-chevron';
    chevron.textContent = 'V';
    header.appendChild(chevron);

    var body = document.createElement('div');
    body.className = 'mpacs-ws-group-body';

    group.tools.forEach(function(tool) {
      body.appendChild(createButton(tool, 'mpacs-ws-panel-button'));
    });

    if (group.note) {
      var note = document.createElement('div');
      note.className = 'mpacs-ws-group-note';
      note.textContent = group.note;
      body.appendChild(note);
    }

    header.addEventListener('click', function() {
      var collapsed = section.classList.toggle('is-collapsed');
      header.setAttribute('aria-expanded', String(!collapsed));
    });

    if (index > 4) {
      section.classList.add('is-compact');
    }

    section.appendChild(header);
    section.appendChild(body);

    return section;
  }

  function createSideBar() {
    var sideBar = document.createElement('aside');
    sideBar.className = 'mpacs-ws-sidebar';
    sideBar.setAttribute('aria-label', 'MiniPACS workstation tools');

    PANEL_GROUPS.forEach(function(group, index) {
      sideBar.appendChild(createPanelGroup(group, index));
    });

    return sideBar;
  }

  function createSeriesStrip() {
    var strip = document.createElement('aside');
    strip.className = 'mpacs-series-strip';
    strip.setAttribute('aria-label', 'Study series');

    var header = document.createElement('div');
    header.className = 'mpacs-series-header';

    var title = document.createElement('div');
    title.className = 'mpacs-series-title';
    title.textContent = 'Series';
    header.appendChild(title);

    var count = document.createElement('div');
    count.className = 'mpacs-series-count';
    count.setAttribute('data-mpacs-series-count', 'true');
    count.textContent = '0';
    header.appendChild(count);

    strip.appendChild(header);

    var list = document.createElement('div');
    list.id = SERIES_LIST_ID;
    list.className = 'mpacs-series-list';
    strip.appendChild(list);

    return strip;
  }

  function createViewportOverlay() {
    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'mpacs-viewport-overlay';

    var topLeft = document.createElement('div');
    topLeft.className = 'mpacs-viewport-top-left';
    topLeft.setAttribute('data-mpacs-overlay-top-left', 'true');
    overlay.appendChild(topLeft);

    var topRight = document.createElement('div');
    topRight.className = 'mpacs-viewport-top-right';
    topRight.setAttribute('data-mpacs-overlay-top-right', 'true');
    overlay.appendChild(topRight);

    var bottomLeft = document.createElement('div');
    bottomLeft.className = 'mpacs-viewport-bottom-left';
    bottomLeft.setAttribute('data-mpacs-overlay-bottom-left', 'true');
    overlay.appendChild(bottomLeft);

    var bottomRight = document.createElement('div');
    bottomRight.className = 'mpacs-viewport-bottom-right';
    bottomRight.setAttribute('data-mpacs-overlay-bottom-right', 'true');
    overlay.appendChild(bottomRight);

    var statusStrip = document.createElement('div');
    statusStrip.className = 'mpacs-viewport-status-strip';

    var toolStatus = document.createElement('span');
    toolStatus.className = 'mpacs-status-pill';
    toolStatus.setAttribute('data-mpacs-tool-state', 'true');
    toolStatus.textContent = 'Tool: Window/Level';
    statusStrip.appendChild(toolStatus);

    var syncStatus = document.createElement('span');
    syncStatus.className = 'mpacs-status-pill';
    syncStatus.setAttribute('data-mpacs-sync-state', 'true');
    syncStatus.textContent = 'Sync: Off';
    statusStrip.appendChild(syncStatus);

    var cineStatus = document.createElement('span');
    cineStatus.className = 'mpacs-status-pill';
    cineStatus.setAttribute('data-mpacs-cine-state', 'true');
    cineStatus.textContent = 'Cine: Pause';
    statusStrip.appendChild(cineStatus);

    var commandStatus = document.createElement('span');
    commandStatus.className = 'mpacs-status-pill mpacs-status-pill-muted';
    commandStatus.setAttribute('data-mpacs-command-state', 'true');
    commandStatus.textContent = lastCommandMessage;
    statusStrip.appendChild(commandStatus);

    overlay.appendChild(statusStrip);

    var miniToolbar = document.createElement('div');
    miniToolbar.className = 'mpacs-viewport-mini-toolbar';
    OVERLAY_TOOLS.forEach(function(tool) {
      miniToolbar.appendChild(createButton(tool, 'mpacs-ws-overlay-button'));
    });
    overlay.appendChild(miniToolbar);

    var cineHud = document.createElement('div');
    cineHud.className = 'mpacs-cine-hud';
    CINE_TOOLS.forEach(function(tool) {
      cineHud.appendChild(createButton(tool, 'mpacs-ws-cine-button'));
    });
    overlay.appendChild(cineHud);

    return overlay;
  }

  function ensureWorkstationShell() {
    if (!document.body || getShell()) {
      updateActiveButton();
      updateLayoutState();
      updateSyncState();
      updateCineState();
      updateCommandState();
      bindHotkeys();
      return;
    }

    var shell = document.createElement('div');
    shell.id = SHELL_ID;
    shell.setAttribute('aria-label', 'MiniPACS workstation shell');

    shell.appendChild(createTopBar());
    shell.appendChild(createSideBar());
    shell.appendChild(createSeriesStrip());
    shell.appendChild(createViewportOverlay());
    document.body.appendChild(shell);

    updateActiveButton();
    updateLayoutState();
    updateSyncState();
    updateCineState();
    updateCommandState();
    bindHotkeys();
    renderSeriesStrip();
    updateViewportOverlay();
  }

  function removeWorkstationShell() {
    var shell = getShell();
    if (shell && shell.parentNode) {
      shell.parentNode.removeChild(shell);
    }
  }

  function updateActiveButton() {
    if (!document.body) {
      return;
    }

    if (document.body.getAttribute(ACTIVE_TOOL_ATTR) !== activeToolKey) {
      document.body.setAttribute(ACTIVE_TOOL_ATTR, activeToolKey);
    }

    Array.prototype.forEach.call(
      document.querySelectorAll('#' + SHELL_ID + ' [data-mpacs-tool-key]'),
      function(button) {
        var isActive = button.getAttribute('data-mpacs-tool-key') === activeToolKey;
        var isPressed = String(isActive);

        if (button.classList.contains('is-active') !== isActive) {
          button.classList.toggle('is-active', isActive);
        }

        if (!button.hasAttribute('data-mpacs-sync-key') && button.getAttribute('aria-pressed') !== isPressed) {
          button.setAttribute('aria-pressed', isPressed);
        }
      }
    );

    Array.prototype.forEach.call(
      document.querySelectorAll('[data-mpacs-tool-state="true"]'),
      function(element) {
        var text = 'Tool: ' + getToolLabel(activeToolKey);
        if (element.textContent !== text) {
          element.textContent = text;
        }
      }
    );
  }

  function updateLayoutState() {
    if (!document.body) {
      return;
    }

    if (document.body.getAttribute(LAYOUT_ATTR) !== currentLayout) {
      document.body.setAttribute(LAYOUT_ATTR, currentLayout);
    }

    Array.prototype.forEach.call(
      document.querySelectorAll('[data-mpacs-layout-state="true"]'),
      function(element) {
        if (element.textContent !== currentLayout) {
          element.textContent = currentLayout;
        }
      }
    );
  }

  function getSyncModes() {
    var modes = [];

    if (syncState.scroll) {
      modes.push('Scroll');
    }

    if (syncState.wwl) {
      modes.push('W/L');
    }

    if (syncState.zoom) {
      modes.push('Zoom');
    }

    return modes;
  }

  function getSyncLabel() {
    var modes = getSyncModes();
    return modes.length ? modes.join(' + ') : 'Off';
  }

  function updateSyncState() {
    if (!document.body) {
      return;
    }

    var syncValue = getSyncModes().join(',').toLowerCase() || 'off';
    if (document.body.getAttribute(SYNC_ATTR) !== syncValue) {
      document.body.setAttribute(SYNC_ATTR, syncValue);
    }

    Array.prototype.forEach.call(
      document.querySelectorAll('#' + SHELL_ID + ' [data-mpacs-sync-key]'),
      function(button) {
        var syncKey = button.getAttribute('data-mpacs-sync-key');
        var isActive = Boolean(syncState[syncKey]);
        button.classList.toggle('is-sync-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      }
    );

    Array.prototype.forEach.call(
      document.querySelectorAll('[data-mpacs-sync-state="true"]'),
      function(element) {
        var text = 'Sync: ' + getSyncLabel();
        if (element.textContent !== text) {
          element.textContent = text;
        }
      }
    );
  }

  function updateCineState() {
    if (!document.body) {
      return;
    }

    var cineValue = cineState.playing ? 'playing' : 'paused';
    if (document.body.getAttribute(CINE_ATTR) !== cineValue) {
      document.body.setAttribute(CINE_ATTR, cineValue);
    }

    Array.prototype.forEach.call(
      document.querySelectorAll('[data-mpacs-cine-state="true"]'),
      function(element) {
        var text = cineState.playing ? 'Cine: Play ' + cineState.fps + 'fps' : 'Cine: Pause';
        if (element.textContent !== text) {
          element.textContent = text;
        }
      }
    );

    Array.prototype.forEach.call(
      document.querySelectorAll('[data-mpacs-tool-key="cine-toggle"] .mpacs-ws-button-icon'),
      function(element) {
        var text = cineState.playing ? '❚❚' : '▶';
        if (element.textContent !== text) {
          element.textContent = text;
        }
      }
    );
  }

  function updateCommandState() {
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-mpacs-command-state="true"]'),
      function(element) {
        if (element.textContent !== lastCommandMessage) {
          element.textContent = lastCommandMessage;
        }
      }
    );
  }

  function flattenTools() {
    var tools = TOP_TOOLS.concat(RIGHT_ACTIONS).concat(OVERLAY_TOOLS).concat(CINE_TOOLS);

    PANEL_GROUPS.forEach(function(group) {
      tools = tools.concat(group.tools || []);
    });

    return tools;
  }

  function findToolConfig(key) {
    var tools = flattenTools();

    for (var i = 0; i < tools.length; i += 1) {
      if (tools[i].key === key) {
        return tools[i];
      }
    }

    return null;
  }

  function getToolLabel(key) {
    var config = findToolConfig(key);
    return config ? config.label : normalizeText(key || 'Ready');
  }

  function setCommandFeedback(label, ok) {
    lastCommandMessage = label + ': ' + (ok ? 'OK' : 'Shell only');
    updateCommandState();
    lastOverlaySignature = '';
  }

  function isElementVisible(element) {
    if (!element || !element.getBoundingClientRect) {
      return false;
    }

    var rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getNativeButtonText(button) {
    return normalizeSearch(
      [
        button.getAttribute('aria-label'),
        button.getAttribute('title'),
        button.textContent,
      ].join(' ')
    );
  }

  function findNativeCommandButton(labels, exact) {
    if (!labels || !labels.length) {
      return null;
    }

    var candidates = Array.prototype.slice.call(
      document.querySelectorAll('button, [role="button"], a, [tabindex]')
    );

    for (var i = 0; i < candidates.length; i += 1) {
      var candidate = candidates[i];

      if (
        isInsideShell(candidate) ||
        candidate.getAttribute(HIDDEN_ATTR) === 'true' ||
        (!isInsideNativeChrome(candidate) && !isElementVisible(candidate))
      ) {
        continue;
      }

      var text = getNativeButtonText(candidate);
      if (!text) {
        continue;
      }

      for (var j = 0; j < labels.length; j += 1) {
        var label = normalizeSearch(labels[j]);
        if ((exact && text === label) || (!exact && text.indexOf(label) !== -1)) {
          return candidate;
        }
      }
    }

    return null;
  }

  function runNativeCommand(labels, exact) {
    var nativeButton = findNativeCommandButton(labels, exact);

    if (!nativeButton) {
      return false;
    }

    nativeButton.click();
    return true;
  }

  function runShellAction(config) {
    if (!config.noActive) {
      activeToolKey = config.key;
      updateActiveButton();
    }

    if (typeof config.action === 'function') {
      config.action(config);
      return;
    }

    setCommandFeedback(config.label, runNativeCommand(config.commandLabels || []));
  }

  function applyLayout(config) {
    var layout = config.layout || '1x1';
    currentLayout = layout;
    activeToolKey = 'layout-' + layout;
    updateActiveButton();
    updateLayoutState();
    lastOverlaySignature = '';
    updateViewportOverlay();

    if (runNativeCommand([layout, layout.replace('x', ' x ')], true)) {
      setCommandFeedback('Layout ' + layout, true);
      return;
    }

    if (runNativeCommand(['Layout'])) {
      window.setTimeout(function() {
        runNativeCommand([layout, layout.replace('x', ' x ')], true);
      }, 160);
      setCommandFeedback('Layout ' + layout, true);
      return;
    }

    setCommandFeedback('Layout ' + layout, false);
  }

  function toggleSync(config) {
    var mode = config.syncMode;

    if (!mode || !Object.prototype.hasOwnProperty.call(syncState, mode)) {
      return;
    }

    syncState[mode] = !syncState[mode];
    updateSyncState();
    lastOverlaySignature = '';
    updateViewportOverlay();
    setCommandFeedback(config.label + ' sync', runNativeCommand(config.commandLabels || []));
  }

  function toggleAllSync(config) {
    var shouldEnable = !(syncState.scroll && syncState.wwl && syncState.zoom);

    syncState.scroll = shouldEnable;
    syncState.wwl = shouldEnable;
    syncState.zoom = shouldEnable;
    updateSyncState();
    lastOverlaySignature = '';
    updateViewportOverlay();
    setCommandFeedback('Viewport link', runNativeCommand((config && config.commandLabels) || ['Link', 'Sync']));
  }

  function clearSync(config) {
    syncState.scroll = false;
    syncState.wwl = false;
    syncState.zoom = false;
    updateSyncState();
    lastOverlaySignature = '';
    updateViewportOverlay();
    setCommandFeedback('Unlink sync', runNativeCommand((config && config.commandLabels) || ['Unlink', 'Disable Sync']));
  }

  function toggleCine(config) {
    cineState.playing = !cineState.playing;

    if (!config || !config.noActive) {
      activeToolKey = 'cine';
      updateActiveButton();
    }

    updateCineState();
    lastOverlaySignature = '';
    updateViewportOverlay();
    setCommandFeedback(
      cineState.playing ? 'Cine play' : 'Cine pause',
      runNativeCommand((config && config.commandLabels) || ['Cine', cineState.playing ? 'Play' : 'Pause'])
    );
  }

  function stepCine(config) {
    var labels = config && config.commandLabels ? config.commandLabels : [];
    var label = config && config.direction < 0 ? 'Previous frame' : 'Next frame';
    setCommandFeedback(label, runNativeCommand(labels));
  }

  function isTextInputTarget(target) {
    if (!target) {
      return false;
    }

    var tagName = (target.tagName || '').toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
  }

  function handleHotkey(event) {
    if (!isViewerRoute() || event.altKey || event.ctrlKey || event.metaKey || isTextInputTarget(event.target)) {
      return;
    }

    var key = event.key === ' ' ? 'space' : normalizeSearch(event.key);
    var config = null;

    if (key === 'w') {
      config = findToolConfig('window');
    } else if (key === 'z') {
      config = findToolConfig('zoom');
    } else if (key === 'p') {
      config = findToolConfig('pan');
    } else if (key === 's') {
      config = findToolConfig('stack');
    } else if (key === 'l') {
      config = findToolConfig('measure-length');
    } else if (key === 'a') {
      config = findToolConfig('measure-angle');
    } else if (key === 'r') {
      config = findToolConfig('reset') || findToolConfig('image-reset');
    } else if (key === 'f') {
      config = findToolConfig('overlay-fullscreen');
    } else if (key === 'c') {
      config = findToolConfig('capture') || findToolConfig('overlay-capture');
    } else if (key === 'space') {
      config = findToolConfig('cine-toggle') || findToolConfig('cine');
    } else if (key === '1') {
      config = findToolConfig('layout-1x1');
    } else if (key === '2') {
      config = findToolConfig('layout-1x2');
    } else if (key === '3') {
      config = findToolConfig('layout-2x1');
    } else if (key === '4') {
      config = findToolConfig('layout-2x2');
    }

    if (!config) {
      return;
    }

    event.preventDefault();
    runShellAction(config);
  }

  function bindHotkeys() {
    if (hotkeysBound) {
      return;
    }

    hotkeysBound = true;
    window.addEventListener('keydown', handleHotkey, true);
  }

  function dicomValue(item, tag) {
    var entry = item && item[tag];
    var value = entry && entry.Value && entry.Value[0];

    if (value && typeof value === 'object') {
      return value.Alphabetic || value.Ideographic || value.Phonetic || '';
    }

    return value == null ? '' : value;
  }

  function dicomNumber(item, tag) {
    var value = Number(dicomValue(item, tag));
    return Number.isFinite(value) ? value : 0;
  }

  function seriesSortValue(series) {
    return series.seriesNumber || 9999;
  }

  function parseSeries(items) {
    return (Array.isArray(items) ? items : [])
      .map(function(item, index) {
        var seriesNumber = dicomNumber(item, '00200011');
        var modality = normalizeText(dicomValue(item, '00080060')) || 'IMG';
        var description = normalizeText(dicomValue(item, '0008103E')) || modality + ' series';
        var uid = String(dicomValue(item, '0020000E') || '');
        var instances = dicomNumber(item, '00201209');
        var bodyPart = normalizeText(dicomValue(item, '00180015'));

        return {
          uid: uid,
          index: index + 1,
          modality: modality,
          description: description,
          seriesNumber: seriesNumber || index + 1,
          instances: instances,
          bodyPart: bodyPart,
        };
      })
      .filter(function(series) {
        return Boolean(series.uid);
      })
      .sort(function(left, right) {
        return seriesSortValue(left) - seriesSortValue(right);
      });
  }

  function fetchDicomJson(url) {
    return window.fetch(url, {
      headers: {
        Accept: 'application/dicom+json, application/json',
      },
    }).then(function(response) {
      if (!response.ok) {
        throw new Error('DICOMweb ' + response.status);
      }

      return response.json();
    });
  }

  function loadSeriesForCurrentStudy() {
    var studyUid = getStudyInstanceUid();

    if (!studyUid || seriesState.loading || (seriesState.loaded && seriesState.studyUid === studyUid)) {
      return;
    }

    seriesState.studyUid = studyUid;
    seriesState.loading = true;
    seriesState.loaded = false;
    seriesState.error = '';
    seriesState.series = [];
    seriesState.activeSeriesUid = '';
    renderSeriesStrip();
    updateViewportOverlay();

    fetchDicomJson('/dicom-web/studies/' + encodeURIComponent(studyUid) + '/series')
      .then(function(items) {
        var series = parseSeries(items);
        seriesState.series = series;
        seriesState.activeSeriesUid = series[0] ? series[0].uid : '';
        seriesState.loaded = true;
        seriesState.error = '';
      })
      .catch(function(error) {
        seriesState.loaded = true;
        seriesState.error = error && error.message ? error.message : 'Khong doc duoc series.';
      })
      .then(function() {
        seriesState.loading = false;
        renderSeriesStrip();
        updateViewportOverlay();
      });
  }

  function getActiveSeries() {
    if (!seriesState.series.length) {
      return null;
    }

    for (var i = 0; i < seriesState.series.length; i += 1) {
      if (seriesState.series[i].uid === seriesState.activeSeriesUid) {
        return seriesState.series[i];
      }
    }

    return seriesState.series[0];
  }

  function createSeriesCard(series, index) {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'mpacs-series-card';
    card.title = series.description;
    card.setAttribute('data-series-uid', series.uid);

    if (series.uid === seriesState.activeSeriesUid) {
      card.classList.add('is-active');
      card.setAttribute('aria-pressed', 'true');
    } else {
      card.setAttribute('aria-pressed', 'false');
    }

    var thumb = document.createElement('div');
    thumb.className = 'mpacs-series-thumb';

    var modality = document.createElement('span');
    modality.className = 'mpacs-series-modality';
    modality.textContent = series.modality;
    thumb.appendChild(modality);

    var imageCount = document.createElement('span');
    imageCount.className = 'mpacs-series-image-count';
    imageCount.textContent = series.instances ? String(series.instances) : '-';
    thumb.appendChild(imageCount);

    card.appendChild(thumb);

    var content = document.createElement('div');
    content.className = 'mpacs-series-content';

    var title = document.createElement('div');
    title.className = 'mpacs-series-card-title';
    title.textContent = series.seriesNumber + '. ' + series.description;
    content.appendChild(title);

    var meta = document.createElement('div');
    meta.className = 'mpacs-series-meta';
    meta.textContent = [
      series.instances ? series.instances + ' images' : 'images -',
      series.bodyPart || 'body part -',
    ].join(' | ');
    content.appendChild(meta);

    card.appendChild(content);

    card.addEventListener('click', function(event) {
      event.preventDefault();
      seriesState.activeSeriesUid = series.uid;
      renderSeriesStrip();
      updateViewportOverlay();
      focusNativeSeries(series, index);
    });

    return card;
  }

  function renderSeriesStrip() {
    var list = document.getElementById(SERIES_LIST_ID);
    var count = document.querySelector('[data-mpacs-series-count="true"]');

    if (!list) {
      return;
    }

    if (count) {
      count.textContent = String(seriesState.series.length || 0);
    }

    list.textContent = '';

    if (seriesState.loading) {
      list.appendChild(createSeriesStatus('Dang tai series...'));
      return;
    }

    if (seriesState.error) {
      list.appendChild(createSeriesStatus(seriesState.error));
      return;
    }

    if (!seriesState.series.length) {
      list.appendChild(createSeriesStatus('Chua co series.'));
      return;
    }

    seriesState.series.forEach(function(series, index) {
      list.appendChild(createSeriesCard(series, index));
    });
  }

  function createSeriesStatus(text) {
    var status = document.createElement('div');
    status.className = 'mpacs-series-status';
    status.textContent = text;
    return status;
  }

  function focusNativeSeries(series, index) {
    var labels = [
      series.description,
      'Series ' + series.seriesNumber,
      series.seriesNumber + '.',
    ];

    if (runNativeCommand(labels)) {
      return;
    }

    var thumbnails = Array.prototype.slice.call(
      document.querySelectorAll('[data-cy*="thumbnail"], [class*="thumbnail"], [class*="Thumbnail"]')
    ).filter(function(element) {
      return !isInsideShell(element) && isElementVisible(element);
    });

    if (thumbnails[index] && typeof thumbnails[index].click === 'function') {
      thumbnails[index].click();
    }
  }

  function updateViewportOverlay() {
    var overlay = document.getElementById(OVERLAY_ID);
    var activeSeries = getActiveSeries();
    var activeIndex = activeSeries
      ? seriesState.series.map(function(series) { return series.uid; }).indexOf(activeSeries.uid) + 1
      : 0;

    var signature = [
      currentLayout,
      activeToolKey,
      getSyncLabel(),
      cineState.playing ? 'playing' : 'paused',
      lastCommandMessage,
      activeSeries ? activeSeries.uid : '',
      activeSeries ? activeSeries.instances : '',
      seriesState.series.length,
      seriesState.loading ? 'loading' : '',
      seriesState.error,
    ].join('|');

    if (!overlay || signature === lastOverlaySignature) {
      return;
    }

    lastOverlaySignature = signature;

    var topLeft = overlay.querySelector('[data-mpacs-overlay-top-left]');
    var topRight = overlay.querySelector('[data-mpacs-overlay-top-right]');
    var bottomLeft = overlay.querySelector('[data-mpacs-overlay-bottom-left]');
    var bottomRight = overlay.querySelector('[data-mpacs-overlay-bottom-right]');

    if (topLeft) {
      topLeft.textContent = activeSeries ? activeSeries.modality + ' | ' + activeSeries.description : 'Loading study';
    }

    if (topRight) {
      topRight.textContent = activeSeries
        ? 'Series Index: ' + activeIndex + ' / ' + seriesState.series.length + '\nImage: 1 / ' + (activeSeries.instances || '-')
        : 'Series Index: -\nImage: -';
    }

    if (bottomLeft) {
      bottomLeft.textContent = activeSeries && activeSeries.bodyPart ? activeSeries.bodyPart : 'MiniPACS workstation';
    }

    if (bottomRight) {
      bottomRight.textContent = [
        'Layout: ' + currentLayout,
        'Tool: ' + getToolLabel(activeToolKey),
        'Sync: ' + getSyncLabel(),
        'Zoom: --',
        'WW/WL: --',
      ].join('\n');
    }

    updateActiveButton();
    updateSyncState();
    updateCineState();
    updateCommandState();
  }

  function openReport() {
    var studyInstanceUid = getStudyInstanceUid();

    if (!studyInstanceUid) {
      return;
    }

    var port = window.location.port === '3000' ? '' : window.location.port;
    var host = window.location.hostname + (port ? ':' + port : '');
    var reportUrl = window.location.protocol + '//' + host + '/report/' + encodeURIComponent(studyInstanceUid);
    window.open(reportUrl, '_blank', 'noopener,noreferrer');
  }

  function printViewer() {
    window.print();
  }

  function closeViewer() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.close();
  }

  function resetStudyStateIfNeeded() {
    var studyUid = getStudyInstanceUid();

    if (seriesState.studyUid === studyUid) {
      return;
    }

    seriesState.studyUid = studyUid;
    seriesState.loading = false;
    seriesState.loaded = false;
    seriesState.error = '';
    seriesState.series = [];
    seriesState.activeSeriesUid = '';
    lastOverlaySignature = '';
  }

  function applyCustomization() {
    scheduled = false;

    if (!document.body) {
      return;
    }

    var viewerRoute = isViewerRoute();
    document.body.classList.toggle(BODY_CLASS, viewerRoute);
    document.body.classList.toggle(WORKSTATION_CLASS, viewerRoute);

    if (!viewerRoute) {
      removeWorkstationShell();
      clearHiddenMarks();
      return;
    }

    resetStudyStateIfNeeded();

    if (!normalizeViewerRoute()) {
      return;
    }

    ensureWorkstationShell();
    loadSeriesForCurrentStudy();
    updateViewportOverlay();
    hideTextLabels();
    hideLogoAndSeparators();
    hideLegacyOhifChrome();
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
