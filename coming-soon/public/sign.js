// Give the sign a push when you click it.
  (function () {
    var swing = document.getElementById('swing');
    if (!swing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    swing.addEventListener('click', function () {
      if (swing.classList.contains('nudge')) return;
      swing.classList.add('nudge');
      setTimeout(function () { swing.classList.remove('nudge'); }, 9200);
    });
  })();
