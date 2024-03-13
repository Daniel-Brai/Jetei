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
                  class="flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
                  href="/workspace/hubs/{{ item.id }}"
                  preload="mouseover"
              >
                 <div class="mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                 </div>
                  <div class="flex w-full flex-col gap-1">
                      <div class="flex items-center">
                          <div class="flex items-center gap-2">
                          <div class="font-semibold">{{ item.name }}</div>
                          </div>
                      </div>
                      <div class="text-xs font-medium">{{ item.description }}</div>
                  </div>
              </a>
          {% endfor %}`;
      if (template) {
        const templateContent = template.innerHTML;
        return nunjucks.renderString(template.innerHTML, data);
      } else {
        return nunjucks.render(templateName, data);
      }
    }
    return text;
  },
});
