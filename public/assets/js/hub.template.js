function formatDate(dateString) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZone: 'UTC'
    };

    const date = new Date(dateString);
    return date.toLocaleString('en-US', options);
}

htmx.defineExtension('load-templates', {
    transformResponse: function (text, xhr, elt) {
        var nunjucksTemplate = htmx.closest(elt, '[nunjucks-template]');
        if (nunjucksTemplate) {
            var data = JSON.parse(text);
            var templateName = nunjucksTemplate.getAttribute('nunjucks-template');
            var template = htmx.find('#' + templateName);
            template.innerHTML = `
        <div class="flex w-full flex-col space-y-6 sm:w-[600px] mb-10">
            <div class="flex flex-col space-y-2 text-left">
            <div class="text-2xl md:text-[32px] font-semibold tracking-tight flex items-center w-full">
                {{ data.name }}
            </div>
            <p class="text-[15px] text-muted-foreground max-w-[600px]">
                {{ data.description }}
            </p>
            </div>

            <div class="mt-40">
                <div class="flex flex-col space-y-3">
                    <div class="flex items-center justify-between">
                        <p class="text-xl font-semibold md:text-[30px] tracking-tight">Your Recent notes</p>
                        <div
                            class="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                            >
                            <a href="/workspace{{ details.path }}/notes/new">
                                <div
                                class="relative btn-outline rounded-md flex items-center px-3 py-2 space-x-2 cursor-pointer"
                                >
                                <div class="text-muted-foreground">
                                    <svg
                                    class="size-5"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="lucide lucide-plus-circle"
                                    >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M8 12h8" />
                                    <path d="M12 8v8" />
                                    </svg>
                                </div>
                                <p class="text-sm">Create Note</p>
                                </div>
                            </a>
                        </div>
                    </div>
                    <div class="space-y-8">
                        {% for note in data.notes %}
                            <a class="cursor-pointer" href="/workspace{{ details.path }}/notes/{{ note.id }}/edit" preload="mouseover">
                                <div class="flex items-center btn-ghost py-3 px-3 rounded-md">
                                    <div class="mr-3">
                                        <svg class="size-7" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M16 2v20"/></svg>
                                    </div>
                                    <div class="space-y-1">
                                    <p class="text-sm font-medium leading-none">
                                        {% if note.name %}
                                        {{ note.name }}
                                        {% else %}
                                        No name yet!
                                        {% endif %}
                                    </p>
                                    <p class="text-sm text-muted-foreground">
                                        {% if note.text %}
                                        {{ note.text }}
                                        {% else %}
                                        No content yet!
                                        {% endif %}
                                    </p>
                                    </div>
                                    <div class="updated-at hidden ml-auto text-sm font-medium">{{ note.updatedAt }}</div>
                                </div>
                            </a>
                        {% endfor %}
                    </div>
                </div>
            </div>
        </div>
      `;
            if (template) {
                return nunjucks.renderString(template.innerHTML, data);
            } else {
                return nunjucks.render(templateName, data);
            }
        }
    },
});

setTimeout(() => {
    const dates = document.querySelectorAll('.updated-at')
    dates.forEach((d) => {
        d.classList.remove('hidden')
        d.textContent = `Edited ${formatDate(d.textContent)}`
    })
}, 100)
