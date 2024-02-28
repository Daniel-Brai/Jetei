htmx.defineExtension('toaster', {
  onEvent: function (name, evt) {
    if (name !== 'htmx:beforeOnLoad') {
      return true;
    }
    if (evt.detail.xhr.status === 200 || evt.detail.xhr.status === 201 || evt.detail.xhr.status === 400) {
      return true;
    }
    const genId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

    var errorDrawer = document.getElementById(`toast-${genId()}`);
    if (!errorDrawer) {
      errorDrawer = document.createElement('div', { id: 'htmx-error-drawer' });
      var body = document.querySelector('body');
      body.insertBefore(errorDrawer, body.firstChild);
    }
    var errorSummary = document.createElement('summary');
    var errorDetailsElement = document.createElement('details');
    var errorDetailsText = document.createElement('div');
    errorDetailsText.innerHTML = evt.detail.xhr.responseText;
    var errorSummaryText = document.createTextNode(
      `${evt.detail.xhr.status} - ${evt.detail.xhr.statusText}`,
    );
    function dismiss() {
      errorDetailsElement.remove();
    }
    var dissmissButton = document.createElement('button');
    dissmissButton.addEventListener('click', dismiss);
    dissmissButton.innerText = 'Dismiss';
    errorSummary.appendChild(errorSummaryText);
    errorSummary.appendChild(dissmissButton);
    errorDetailsElement.appendChild(errorSummary);
    errorDetailsElement.appendChild(errorDetailsText);
    errorDrawer.appendChild(errorDetailsElement);
    return true;
  },
});
