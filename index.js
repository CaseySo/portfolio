import { fetchJSON, renderProjects } from './global.js';

async function loadLatestProjects() {
  const projects = await fetchJSON('./lib/projects.json');
  if (!projects) {
    console.error("No project data found");
    return;
  }
  const latestProjects = projects.slice(0, 3);
  const projectsContainer = document.querySelector('.projects');
  renderProjects(latestProjects, projectsContainer, 'h2');
}
loadLatestProjects();
