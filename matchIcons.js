/* === Tab Navigation Logic === */

(function() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const gameContainers = {
    'maze': document.getElementById('maze-game'),
    'cardmatching': document.getElementById('cardmatching-game')
  };

  // Get maze-specific UI elements
  const mobileControls = document.getElementById('mobileControls');
  const topbar = document.getElementById('topbar');

  // Handle tab clicks
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetGame = button.dataset.game;
      
      // Remove active class from all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked tab
      button.classList.add('active');
      
      // Hide all game containers
      Object.values(gameContainers).forEach(container => {
        if (container) container.classList.remove('active');
      });
      
      // Show target game container
      if (gameContainers[targetGame]) {
        gameContainers[targetGame].classList.add('active');
      }
      
      // Show/hide maze-specific controls
      if (targetGame === 'maze') {
        // Show maze controls (restore original display logic)
        if (mobileControls) {
          const small = window.matchMedia('(max-width:880px)').matches;
          mobileControls.style.display = small ? 'flex' : 'none';
        }
        if (topbar) topbar.style.display = '';
      } else {
        // Hide maze controls for other games
        if (mobileControls) mobileControls.style.display = 'none';
        if (topbar) topbar.style.display = 'none';
      }
      
      // Reset the selected game
      if (targetGame === 'maze') {
        // Reset maze game
        const regenBtn = document.getElementById('regen');
        if (regenBtn) regenBtn.click();
      } else if (targetGame === 'cardmatching') {
        // Reset card matching game
        if (typeof window.resetCardMatchingGame === 'function') {
          window.resetCardMatchingGame();
        }
      }
    });
  });

  // Initial setup: hide maze controls if CardMatching is active
  const activeMazeGame = document.querySelector('.tab-button.active');
  if (activeMazeGame && activeMazeGame.dataset.game !== 'maze') {
    if (mobileControls) mobileControls.style.display = 'none';
    if (topbar) topbar.style.display = 'none';
  }
})();
