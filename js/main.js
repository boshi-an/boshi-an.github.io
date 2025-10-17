// Section data
const sections = [
  { id: 'section-introduction', file: 'sections/introduction.html' },
  { id: 'section-publications', file: 'sections/publications.html' },
  { id: 'section-experience', file: 'sections/experience.html' },
  { id: 'section-misc', file: 'sections/misc.html' }
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
async function loadAllSections() {
  for (const section of sections) {
    await loadSection(section.id);
  }
}

// Initialize
async function init() {
  
  if (isMobile()) {
    // Mobile: Load all sections and show them all
    await loadAllSections();
    // Show all sections on mobile
    document.querySelectorAll('.section').forEach(function(el) {
      el.classList.add('active');
    });
  } else {
    // Desktop: Load only the initial section
    const hash = (location.hash || '#section-introduction').replace('#','');
    await loadSection(hash);
    selectSection(hash);
    
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
async function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(async function() {
    if (isMobile()) {
      // Mobile: Load all sections and show them all
      await loadAllSections();
      document.querySelectorAll('.section').forEach(function(el) {
        el.classList.add('active');
      });
    } else {
      // Desktop: Load only the current section and hide others
      const currentSection = document.querySelector('.section.active');
      if (!currentSection) {
        await loadSection('section-introduction');
        selectSection('section-introduction');
      } else {
        // Hide all sections except the current one
        document.querySelectorAll('.section').forEach(function(el) {
          el.classList.remove('active');
        });
        currentSection.classList.add('active');
      }
      
      // Re-setup sidebar click handlers for desktop
      document.querySelectorAll('#sidebar .sidebar-link').forEach(function(el){
        // Remove existing listeners to avoid duplicates
        el.removeEventListener('click', el._clickHandler);
        // Add new listener
        el._clickHandler = async function(){
          const targetId = el.getAttribute('data-target');
          await loadSection(targetId);
          selectSection(targetId);
        };
        el.addEventListener('click', el._clickHandler);
      });
    }
  }, 250); // Wait 250ms after resize stops
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Handle window resize
window.addEventListener('resize', handleResize);
