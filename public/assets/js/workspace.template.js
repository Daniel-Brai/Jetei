function formatDate(dateString) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZone: 'UTC',
    };

    const date = new Date(dateString);
    return date.toLocaleString('en-US', options);
}

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

function subString(text, end) {
    if (typeof end === 'string') {
        end = parseInt(end);
    }
    return text.substring(0, end);
}

htmx.defineExtension('load-templates', {
    transformResponse: function (text, xhr, elt) {
        var nunjucksTemplate = htmx.closest(elt, '[nunjucks-template]');
        if (nunjucksTemplate) {
            var data = JSON.parse(text);
            var data = { results: data.data };
            var templateName = nunjucksTemplate.getAttribute('nunjucks-template');
            var template = htmx.find('#' + templateName);
            template.innerHTML = `
    <div
      class="w-full py-10 -mb-8 md:mt-6 flex flex-col md:py-10 text-white rounded-md"
    >
      <div
        class="z-20 flex space-x-6 items-center justify-between text-lg font-medium -mt-2"
      >
        <span class="font-medium text-xl sm:text-2xl lg:text-2xl">
          My Hubs
        </span>
        <div
          class="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <a href="workspace/hubs/new">
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
              <p class="text-sm">Create Hub</p>
            </div>
          </a>
        </div>
      </div>

      <div class="my-6">
        <div class="flex flex-col gap-2 py-4 pt-0">
            {% for item in results.hubs %} 
            <a
                id="{{ item.id }}"
                class="max-w-lg flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
                href="workspace/hubs/{{ item.id }}"
                preload="mouseover"
            >
                <div class="flex w-full flex-col gap-1">
                <div class="flex items-center">
                    <div class="flex items-center gap-2">
                    <div class="font-semibold">{{ item.name }}</div>
                    </div>
                    <div class="updated-at ml-auto text-xs">
                    {{ item.updatedAt }}
                    </div>
                </div>
                <div class="text-xs font-medium">{{ item.description }}</div>
                </div>
                <div class="note-text line-clamp-2 text-xs text-muted-foreground">
                {% if item.notes[0].text %}
                {{ item.notes[0].text }}
                {% else %}
                No content yet!
                {% endif %}
                </div>
            </a>
            {% endfor %}
        </div>

        {% if results.hubs|length == 0 %}
        <div
          class="mt-4 mb-10 flex flex-col items-center justify-center space-y-4"
        >
          <img
            class="w-36 h-48"
            src="/assets/images/no-hubs.png"
            alt="Empty Hub"
          />
          <p class="text-sm font-medium text-center">
            Whoa! Looks like you don't have any hubs!
          </p>
        </div>
        {% endif %}
      </div>
    </div>

    <div
      class="w-full -mb-4 md:mt-6 flex flex-col md:py-10 text-white rounded-md"
    >
      <div
        class="relative z-20 flex space-x-6 items-center justify-between text-lg font-medium -mt-2"
      >
        <span class="font-medium text-xl sm:text-2xl lg:text-2xl"> My Chats </span>
      </div>

      <div class="relative z-20 my-6 w-full">
        {% for item in results.chats %} 
          <div class="flex flex-col gap-2 py-4 pt-0">
            <a
              id="{{ item.id }}"
              class="flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
              href="/workspace/chats/{{ item.id }}"
              preload="mouseover"
            >
              <div class="flex w-full flex-col gap-1">
                <div class="flex items-center">
                  <div class="flex items-center gap-2">
                    <div class="flex items-center justify-center space-x-2">
                      <div class="bg-muted rounded-full">
                        <svg class="size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-user-round"><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></svg>
                      </div>
                      <div class="font-semibold">
                          {{ item.message[0].name }}
                      </div>
                    </div>
                    {% if item.workspace %}
                      <span class="flex py-[1px] px-3 text-[10px] bg-blue-500 rounded-full" title="{{ item.workspace }} hub">{{ item.workspace }}</span>
                    {% endif %}
                    {% if not item.message[0].isRead %}
                      <span class="flex h-2 w-2 rounded-full bg-blue-600" title="message not read"></span>
                    {% else %}
                      <span class="flex h-2 w-2 rounded-full bg-blue-800" title="message read"></span>
                    {% endif %}
                  </div>
                  <div class="ml-auto text-xs">
                    {{ item.message[0].sentAt }}
                  </div>
                </div>
                <div class="text-xs font-medium">New message</div>
              </div>
              <div class="message-content line-clamp-2 text-xs text-muted-foreground">
                {{ item.message[0].content }}
              </div>
            </a>
          </div>
        {% else %}
        <div class="mt-4 flex flex-col items-center justify-center space-y-4">
          <img
            class="w-32 h-48"
            src="/assets/images/empty-mailbox.png"
            alt="Empty Chats"
          />
          <p class="text-sm font-medium text-center">
            You don't have any message yet!
          </p>
        </div>
        {% endfor %}
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
    const dates = document.querySelectorAll('.updated-at');
    const note_texts = document.querySelectorAll('.note-text');
    const message_texts = document.querySelectorAll('.message-contnet');
    if (note_texts) {
      note_texts.forEach((n) => {
          if (n.textContent.length > 300) {
              n.textContent = `${subString(n.textContent, 300)}...`;
          }
          n.textContent = `${subString(n.textContent, 300)}`;
      });
    }
    if (dates) {
      dates.forEach((d) => {
          d.textContent = `${formatDistanceToNow(d.textContent.trim())}`;
          d.classList.remove('hidden');
      });
    }
    if(message_texts) {
      message_texts.forEach((m) => {
          if (m.textContent.length > 300) {
              m.textContent = `${subString(m.textContent, 300)}...`;
          }
          m.textContent = `${subString(m.textContent, 300)}`;
      })
    }
}, 1500);
