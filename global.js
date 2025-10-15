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
  { url: 'resume/', title: 'Resume' }
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