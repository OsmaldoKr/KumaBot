window.onload = () => {
  const chat = document.querySelector('div.container-fluid')

  function addMsg(message) {
    const html = document.createElement('span')

    html.className = 'msg'
    html.textContent = message

    chat.appendChild(html)
  }

  window.onclick = () => {
    addMsg('Mensaje número 12')
  }
}
