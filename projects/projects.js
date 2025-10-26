import { fetchJSON, renderProjects } from '../global.js';

async function loadProjects() {
  const isProjectsPage = location.pathname.includes('/projects/');
  const jsonPath = isProjectsPage ? '../lib/projects.json' : 'lib/projects.json';

  const projects = await fetchJSON(jsonPath);
  if (!projects) {
    console.error("No project data found");
    return;
  }

  const title = document.querySelector('.projects-title');
  if (title) {
    title.textContent = `Projects (${projects.length})`;
  }

  const projectsContainer = document.querySelector('.projects');
  renderProjects(projects, projectsContainer, 'h2');
}

loadProjects();