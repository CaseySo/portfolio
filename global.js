console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}
// const navLinks = $$("nav a");
// const currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname
// );
// currentLink?.classList.add("current");
const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/" // local
    : "/portfolio/"; // github repo

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/CaseySo', title: 'Github' },
  { url: 'resume.html', title: 'Resume' }
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;
  if (!url.startsWith('http')) {
        url = BASE_PATH + url;
    }

// nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  nav.append(a);

//   if (!url.startsWith('http')) {
//   url = BASE_PATH + url;
  if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
  }
  if (a.host !== location.host) {
        a.target = '_blank';
  }
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
`
);

const select = document.querySelector('.color-scheme select');

function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty('color-scheme', colorScheme);
  select.value = colorScheme;
}

if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
} else {
  setColorScheme('light dark'); 
}

select.addEventListener('input', function (event) {
  const scheme = event.target.value;
  setColorScheme(scheme);
  localStorage.colorScheme = scheme;
  console.log('color scheme changed to', scheme);
});
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (localStorage.colorScheme === "light dark") {
    setColorScheme("light dark");
  }
});

const form = document.querySelector("form");

form?.addEventListener("submit", function(event) {
  event.preventDefault(); 

  const data = new FormData(form);
  const params = [];

  for (let [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  const query = params.join("&");
  const url = `${form.action}?${query}`;

  location.href = url; 
});

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!Array.isArray(projects) || !containerElement) {
    console.error('Invalid parameters passed to renderProjects.');
    return;
  }

  containerElement.innerHTML = ''; // clear old content

  const inProjectsFolder = location.pathname.includes('/projects');

  for (let project of projects) {
    const article = document.createElement('article');

    const imgSrc = inProjectsFolder ? `../${project.image}` : project.image;

    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${imgSrc}" alt="${project.title}">
      <p>${project.description}</p>
    `;

    containerElement.appendChild(article);
  }

  if (projects.length === 0) {
    containerElement.innerHTML = '<p>No projects found.</p>';
  }
}



export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
