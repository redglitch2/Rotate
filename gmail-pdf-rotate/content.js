(() => {
  function createControlPanel() {
    const panel = document.createElement('div');
    panel.className = 'gpdr-panel';
    panel.innerHTML = `
      <button class="gpdr-btn" data-dir="left" title="Rotate left">⟲</button>
    `;
    return panel;
  }

  const rotationMap = new WeakMap();

  function setRotation(el, deg) {
    rotationMap.set(el, deg);
    el.style.transform = `rotate(${deg}deg)`;
    el.style.transformOrigin = 'center center';
    el.style.maxWidth = 'none';
    el.style.maxHeight = 'none';
  }

  function getRotation(el) {
    return rotationMap.get(el) || 0;
  }

  function queryPreviewNodes(root = document) {
    return Array.from(
      root.querySelectorAll(
        'embed[type="application/pdf"], object[type="application/pdf"], iframe[src*="/viewer"], iframe[src*="pdf" i], img[src][style]'
      )
    ).filter(n => {
      // Must be visible
      if (n.offsetParent === null) return false;
      // Ignore Gmail UI logos/icons (usually small)
      if (n.tagName === 'IMG') {
        const w = n.naturalWidth || n.width;
        const h = n.naturalHeight || n.height;
        if (w < 200 && h < 200) return false;
      }
      return true;
    });
  }

  function injectOnce(dialog) {
    if (dialog.querySelector('.gpdr-panel')) return;
    const panel = createControlPanel();
    dialog.appendChild(panel);

    const getTarget = () => {
      const local = queryPreviewNodes(dialog);
      if (local.length) return local[0];
      const global = queryPreviewNodes(document);
      return global[0] || null;
    };

    function rotate(dir) {
      const target = getTarget();
      if (!target) return;
      let deg = getRotation(target);
      if (dir === 'left') deg -= 90;
      else if (dir === 'right') deg += 90;
      else if (dir === 'reset') deg = 0;
      setRotation(target, ((deg % 360) + 360) % 360);
    }

    panel.addEventListener('click', (e) => {
      const btn = e.target.closest('.gpdr-btn');
      if (!btn) return;
      const dir = btn.getAttribute('data-dir');
      rotate(dir);
      e.stopPropagation();
    });
  }

  const observer = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.getAttribute && node.getAttribute('role') === 'dialog') {
          injectOnce(node);
        }
        if (node.querySelector) {
          const previews = queryPreviewNodes(node);
          if (previews.length) {
            let container = node.closest?.('[role="dialog"]') || document.querySelector('[role="dialog"]') || document.body;
            injectOnce(container);
          }
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  const existingDialog = document.querySelector('[role="dialog"]');
  if (existingDialog) injectOnce(existingDialog);
})();