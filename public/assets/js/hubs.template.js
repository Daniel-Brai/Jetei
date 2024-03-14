function subString(text, end) {
    if (typeof end === 'string') {
      end = parseInt(end);
    }
    return text.substring(0, end);
}

htmx.defineExtension('load-templates', {
  transformResponse: function (text, xhr, elt) {
    var nunjucksArrayTemplate = htmx.closest(elt, '[nunjucks-array-template]');
    if (nunjucksArrayTemplate) {
      var data = JSON.parse(text);
      var data = { results: data.data };
      var templateName = nunjucksArrayTemplate.getAttribute(
        'nunjucks-array-template',
      );
      var template = htmx.find('#' + templateName);
      template.innerHTML = ` {% for item in results %}
            
              <a
                  id="{{ item.id }}"
                  class="flex items-center mb-3 gap-2 overflow-hidden rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
                  href="/workspace/hubs/{{ item.id }}"
                  preload="mouseover"
              >
                 <div class="mr-3">
                  {% if note.photo %}
                    <img class="size-6 object-cover rounded-full" loading="eager" src="{{ item.photo }}" />
                  {% else %}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-library"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7v10"/><path d="M11 7v10"/><path d="m15 7 2 10"/></svg>
                  {% endif %}
                 </div>
                  <div class="flex w-full flex-col gap-1">
                      <div class="flex items-center">
                          <div class="flex items-center gap-2">
                          <div class="font-semibold">{{ item.name }}</div>
                          </div>
                      </div>
                      <div class="hub-desc text-xs font-medium">{{ item.description }}</div>
                  </div>
              </a>
          {% endfor %}`;
      if (template) {
        return nunjucks.renderString(template.innerHTML, data);
      } else {
        return nunjucks.render(templateName, data);
      }
    }
    return text;
  },
});

setTimeout(() => {
    const hub_descs = document.querySelectorAll('.hub-desc')
    hub_descs.forEach((h) => {
      if (h.textContent.length > 300) {
        h.textContent = `${subString(h.textContent, 300)}...`
      }
      h.textContent = `${subString(h.textContent, 300)}`
    })
}, 100)
