// Points the browser tab icon at the given image (from Brand > Favicon).
export function setFavicon(href) {
  if (!href) return
  let link = document.head.querySelector('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'icon')
    document.head.appendChild(link)
  }
  link.removeAttribute('type')
  link.setAttribute('href', href)
}
