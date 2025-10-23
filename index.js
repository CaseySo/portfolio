import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

async function loadHomeProjects() {
  const projects = await fetchJSON('./lib/projects.json');
  if (!projects) return;

  const latestProjects = projects.slice(0, 3);
  const container = document.querySelector('.projects');
  renderProjects(latestProjects, container, 'h3');
}

async function loadGitHubStats() {
  const statsContainer = document.getElementById('profile-stats');
  if (!statsContainer) return;

  const githubData = await fetchGitHubData('CaseySo'); 
  if (!githubData) {
    statsContainer.innerHTML = '<p>Unable to load GitHub data.</p>';
    return;
  }

  statsContainer.innerHTML = `
    <h2>GitHub Stats</h2>
    <dl>
      <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
      <dt>Followers:</dt><dd>${githubData.followers}</dd>
      <dt>Following:</dt><dd>${githubData.following}</dd>
    </dl>
  `;
}

loadHomeProjects();
loadGitHubStats();
