import { fetchJSON, renderProjects } from '../global.js';

async function loadProjects() {
  const projects = await fetchJSON('../lib/projects.json');
  if (!projects) {
    console.error("No project data found");
    return;
  }
  const fixedProjects = projects.map(p => {
    if (p.image && !p.image.startsWith('http')) {
      return { ...p, image: `../${p.image}` };
    }
    return p;
  });

  const title = document.querySelector('.projects-title');
  if (title) {
    title.textContent = `Projects (${projects.length})`;
  }

  const projectsContainer = document.querySelector('.projects');
  renderProjects(fixedProjects, projectsContainer, 'h2');
}

loadProjects();