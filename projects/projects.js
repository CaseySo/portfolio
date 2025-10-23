import { fetchJSON, renderProjects } from '../global.js';

async function loadProjects() {
  const projects = await fetchJSON('../lib/projects.json');
  if (!projects) {
    console.error("No project data found");
    return;
  }

  const isProjectsPage = location.pathname.includes('/projects/');
  const adjustedProjects = projects.map(project => {
    if (isProjectsPage && project.image.startsWith('images/')) {
      return { ...project, image: `../${project.image}` };
    }
    return project;
  });

  const title = document.querySelector('.projects-title');
  if (title) {
    title.textContent = `Projects (${projects.length})`;
  }

  const projectsContainer = document.querySelector('.projects');
  renderProjects(adjustedProjects, projectsContainer, 'h2');
}

loadProjects();
