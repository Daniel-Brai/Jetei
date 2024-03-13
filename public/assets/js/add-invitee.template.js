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
      if (template) {
        template.innerHTML = ` 
        <select
            name="hubId"
            id="hubId"
            class="w-full rounded-md border border-input bg-background pl-2 pr-4 py-3 mb-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
        >
        <option value="" disabled selected>Select a Hub</option>
        {% for item in results %}
        <option value="{{ item.id }}">{{ item.name }}</option>
        {% endfor %}
        </select>
        `;
        return nunjucks.renderString(template.innerHTML, data);
      } else {
        return nunjucks.render(templateName, data);
      }
    }
    return text;
  },
});
