function formatDistanceToNow(date) {
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z$/;
    const parsedDate = date instanceof Date ? date : new Date(date);

    if (isNaN(parsedDate.getTime()) || !regex.test(date)) {
        return "Invalid date";
    }

    const now = new Date();
    const diffInMilliseconds = now - parsedDate;

    if (diffInMilliseconds < 1000) {
        return "less than a minute ago";
    } else if (diffInMilliseconds < 60000) {
        const seconds = Math.round(diffInMilliseconds / 1000);
        return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
    } else if (diffInMilliseconds < 3600000) {
        const minutes = Math.round(diffInMilliseconds / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInMilliseconds < 86400000) {
        const hours = Math.round(diffInMilliseconds / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInMilliseconds < 2592000000) {
        const days = Math.round(diffInMilliseconds / 86400000);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffInMilliseconds < 31536000000) {
        const months = Math.round(diffInMilliseconds / 2592000000);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    } else { // More than a year
        const years = Math.round(diffInMilliseconds / 31536000000);
        return `${years} year${years > 1 ? 's' : ''} ago`;
    }
}

htmx.defineExtension('load-templates', {
    transformResponse: function (text, xhr, elt) {
        var nunjucksTemplate = htmx.closest(elt, '[nunjucks-template]');
        if (nunjucksTemplate) {
            var data = JSON.parse(text);
            var data = { data: data.data };
            var templateName = nunjucksTemplate.getAttribute('nunjucks-template');
            var template = htmx.find('#' + templateName);
            template.innerHTML = `
<div class="flex w-full flex-col space-y-6 mb-10">
    <div class="flex flex-col space-y-2 text-left">
        <div class="text-2xl md:text-[32px] font-semibold tracking-tight flex items-center w-full">
            Chats
        </div>
        <p class="text-[15px] text-muted-foreground max-w-[600px]">
            Discover, Learn, Understand - Our Chat Connects You
        </p>
    </div>

    <div class="flex flex-col space-y-3 mb-10">
        <div class="flex items-center justify-between mb-4">
            <div id="search-chat-input" class="cursor-pointer relative">
                <div class="absolute left-2 top-2">
                    <span class="">
                    <svg
                        class=""
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        width="24"
                        height="24"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                    </span>
                </div>
                <div
                    class="select-none flex h-10 pl-10 rounded-md border border-input bg-background px-24 py-2 text-sm text-muted-foreground"
                >
                    Search chats...
                </div>
            </div>
        </div>
        {% for invitee in data %}
            <script>
                console.log("{{ invitee }}")
            </script>
            <div
                id="invitee-{{ invitee.inviteeId }}"
                class="flex items-center justify-between mb-3 gap-2 overflow-hidden bg-outline rounded-lg border p-3 text-left text-sm transition-all"
            >
                <div class="w-full flex space-x-2 items-center">
                    <div class="mx-auto bg-secondary p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div class="flex flex-col space-y-2 w-full">
                        <p>{{ invitee.inviteeName }}</p>
                        <p class="text-muted-foreground text-sm">{{ invitee.inviteeRole | capitalize  }}</p>
                    </div>
                </div>
                <div class="flex w-full flex-col items-end">
                    <div class="flex space-x-2">
                        <div data-id="{{ invitee.inviteeId }}" class="btn-ghost px-2 py-1 rounded-md cursor-pointer chat-btn">
                            <div title="Chat with {{ invitee.inviteeName }}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {% if invitee|length == 0 %}
            <div class="py-3 {% if data.invitee|length == 0 %}mt-4{% else %}mt-6{% endif %} btn-outline rounded-md">
                <div class="flex items-center justify-center space-x-4 py-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <p class="text-sm font-medium text-center">
                    You don't have any members to chat with yet!
                    </p>
                </div>
            </div>
        {% endif %}
        {% endfor %}
    </div>
<script nonce="{{ nonce }}">
    const searchChatInput = document.getElementById('search-chat-input'); 
    if (searchChatInput) {
        searchChatInput.addEventListener('click', () => {
            if (searchInput) {
                searchInput.click()
                searchWorkInput.value = 'chats:'
            }    
        });
    }
</script>
      `;
            if (template) {
                return nunjucks.renderString(template.innerHTML, data);
            } else {
                return nunjucks.render(templateName, data);
            }
        }
    },
});

