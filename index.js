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

import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

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

async function loadGitHubStats() {
  const githubData = await fetchGitHubData('your-username'); // 👈 replace this
  const profileStats = document.querySelector('#profile-stats');

  if (profileStats && githubData) {
    profileStats.innerHTML = `
      <h2>GitHub Stats</h2>
      <dl>
        <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
        <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
        <dt>Followers:</dt><dd>${githubData.followers}</dd>
        <dt>Following:</dt><dd>${githubData.following}</dd>
      </dl>
    `;
  } else {
    console.warn("Profile stats element not found or GitHub data missing");
  }
}

loadLatestProjects();
loadGitHubStats();
