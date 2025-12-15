// Section data
const sections = [
  { id: 'section-introduction', file: 'sections/introduction.html' },
  { id: 'section-music', file: 'sections/music.html' },
  { id: 'section-publications', file: 'sections/publications.html' },
  { id: 'section-experience', file: 'sections/experience.html' },
  { id: 'section-misc', file: 'sections/misc.html' },
  // Hidden section only reachable via direct hash
  { id: 'portfolio', file: 'sections/portfolio.html', hidden: true }
];

// Load section content
async function loadSection(sectionId) {
  const section = sections.find(s => s.id === sectionId);
  if (!section) return;

  try {
    // Try to load the section file
    const response = await fetch(section.file);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    
    // Remove existing section if it exists
    const existingSection = document.getElementById(sectionId);
    if (existingSection) {
      existingSection.remove();
    }
    
    // Add new section to container
    const container = document.getElementById('content-container');
    container.insertAdjacentHTML('beforeend', html);
    
    // Re-initialize any scripts in the new content
    const scripts = document.getElementById(sectionId).querySelectorAll('script');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      newScript.textContent = script.textContent;
      document.head.appendChild(newScript);
      document.head.removeChild(newScript);
    });
    
  } catch (error) {
    console.error('Error loading section:', error);
    // Fallback: show a message if loading fails
    const container = document.getElementById('content-container');
    container.innerHTML = `
      <div class="section active">
        <heading>Loading Error</heading>
        <p>Unable to load section content. Please make sure you're serving the files from a web server.</p>
        <p>You can run a local server using: <code>python -m http.server</code> or <code>npx serve</code></p>
      </div>
    `;
  }
}

// Section navigation
function selectSection(id) {
  // Update global tracking
  currentSectionId = id;
  
  // Update active states
  document.querySelectorAll('.section').forEach(function(el){ 
    el.classList.remove('active'); 
  });
  document.querySelectorAll('#sidebar .sidebar-link').forEach(function(el){ 
    el.classList.remove('active'); 
  });
  
  // Set new active states
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  const link = document.querySelector('#sidebar .sidebar-link[data-target="' + id + '"]');
  if (link) link.classList.add('active');
  
  // Update URL
  if (history && history.replaceState) {
    history.replaceState(null, '', '#' + id);
  }
}

// Check if mobile device
function isMobile() {
  return window.innerWidth <= 768;
}

// Load all sections for mobile
async function loadAllSections(includeHiddenIds = []) {
  for (const section of sections) {
    if (section.hidden && !includeHiddenIds.includes(section.id)) {
      continue;
    }
    await loadSection(section.id);
  }
}

// Initialize
async function init() {
  
  const hashFromUrl = (location.hash || '#section-introduction').replace('#','');
  const initialSection = sections.find(s => s.id === hashFromUrl) || sections.find(s => s.id === 'section-introduction');
  currentSectionId = initialSection.id;

  if (isMobile()) {
    // Mobile: Load standard sections, plus hidden if explicitly requested
    await loadAllSections([currentSectionId]);
    document.querySelectorAll('.section').forEach(function(el) {
      el.classList.add('active');
    });
  } else {
    // Desktop: Load only the initial section
    await loadSection(currentSectionId);
    selectSection(currentSectionId);
    
    // Set up sidebar click handlers
    document.querySelectorAll('#sidebar .sidebar-link').forEach(function(el){
      el.addEventListener('click', async function(){
        const targetId = el.getAttribute('data-target');
        await loadSection(targetId);
        selectSection(targetId);
      });
    });
  }
}

// Debounce resize handler
let resizeTimeout;
let currentSectionId = 'section-introduction'; // Track current section globally

async function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(async function() {
    if (isMobile()) {
      // Mobile: Load non-hidden sections and the current one if hidden
      await loadAllSections([currentSectionId]);
      document.querySelectorAll('.section').forEach(function(el) {
        el.classList.add('active');
      });
    } else {
      // Desktop: Load only the current section and hide others
      // First, try to find the current section from URL hash
      const hash = location.hash.replace('#', '');
      if (hash && sections.find(s => s.id === hash)) {
        currentSectionId = hash;
      }
      
      // Load the current section if it's not already loaded
      const existingSection = document.getElementById(currentSectionId);
      if (!existingSection) {
        await loadSection(currentSectionId);
      }
      
      // Hide all sections except the current one
      document.querySelectorAll('.section').forEach(function(el) {
        el.classList.remove('active');
      });
      
      // Show the current section
      const currentSection = document.getElementById(currentSectionId);
      if (currentSection) {
        currentSection.classList.add('active');
      }
      
      // Update sidebar active state
      document.querySelectorAll('#sidebar .sidebar-link').forEach(function(el) {
        el.classList.remove('active');
        if (el.getAttribute('data-target') === currentSectionId) {
          el.classList.add('active');
        }
      });
      
      // Re-setup sidebar click handlers for desktop
      document.querySelectorAll('#sidebar .sidebar-link').forEach(function(el){
        // Remove existing listeners to avoid duplicates
        el.removeEventListener('click', el._clickHandler);
        // Add new listener
        el._clickHandler = async function(){
          const targetId = el.getAttribute('data-target');
          currentSectionId = targetId; // Update global tracking
          await loadSection(targetId);
          selectSection(targetId);
        };
        el.addEventListener('click', el._clickHandler);
      });
    }
  }, 250); // Wait 250ms after resize stops
}

// Theme management
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Always use system preference on page load
  const initialTheme = prefersDark ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', initialTheme);
  updateThemeButton(initialTheme);

  // Listen to system changes
  if (window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      updateThemeButton(newTheme);
    });
  }

  // Add click handler
  themeToggle.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
  const themeToggle = document.getElementById('theme-toggle');
  if (theme === 'dark') {
    themeToggle.textContent = '☀️ Light';
  } else {
    themeToggle.textContent = '🌙 Dark';
  }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  init();
});

// Handle window resize
window.addEventListener('resize', handleResize);
